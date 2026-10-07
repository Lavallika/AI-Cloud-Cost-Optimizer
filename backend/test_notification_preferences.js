require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("./config/db");
const { server } = require("./server");

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let testUser1, testUser2;

async function setupTestUsers() {
  // Ensure we have two test users
  const res1 = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Test User 1', 'testuser1_pref@example.com', 'dummyhash')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email`
  );
  testUser1 = res1.rows[0];

  const res2 = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Test User 2', 'testuser2_pref@example.com', 'dummyhash')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email`
  );
  testUser2 = res2.rows[0];

  // Clean up any existing preferences for these test users
  await pool.query("DELETE FROM user_notification_preferences WHERE user_id IN ($1, $2)", [
    testUser1.id,
    testUser2.id
  ]);
}

async function cleanup() {
  if (testUser1 && testUser2) {
    await pool.query("DELETE FROM user_notification_preferences WHERE user_id IN ($1, $2)", [
      testUser1.id,
      testUser2.id
    ]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [testUser1.id, testUser2.id]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("RUNNING NOTIFICATION PREFERENCES API VERIFICATION TESTS");
  console.log("========================================================\n");

  try {
    await setupTestUsers();
    const token1 = createToken(testUser1);
    const token2 = createToken(testUser2);

    // ─── Test A: Unauthenticated GET returns 401 ──────────────────────────────
    console.log("Test A: Unauthenticated GET");
    const unauthRes = await fetch(`${BASE_URL}/api/notification-preferences`);
    assert(unauthRes.status === 401, `Unauthenticated GET returns 401 (got ${unauthRes.status})`);
    const unauthData = await unauthRes.json();
    assert(unauthData.success === false, "Unauthenticated response contains success: false");

    // ─── Test B: Authenticated GET creates/returns defaults ───────────────────
    console.log("\nTest B: Authenticated GET creates/returns defaults");
    const getRes1 = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(getRes1.status === 200, `Authenticated GET returns 200 (got ${getRes1.status})`);
    const getData1 = await getRes1.json();
    assert(getData1.success === true, "Response has success: true");
    const prefs1 = getData1.preferences;
    assert(prefs1.user_id === testUser1.id, `Preferences belong to user_id ${testUser1.id}`);
    assert(prefs1.high_cost_enabled === true, "Default high_cost_enabled is true");
    assert(prefs1.cost_increase_enabled === true, "Default cost_increase_enabled is true");
    assert(prefs1.low_utilization_enabled === true, "Default low_utilization_enabled is true");
    assert(prefs1.ai_recommendation_enabled === true, "Default ai_recommendation_enabled is true");
    assert(prefs1.optimization_opportunity_enabled === true, "Default optimization_opportunity_enabled is true");
    assert(prefs1.high_cost_threshold === 10000, `Default high_cost_threshold is 10000 (got ${prefs1.high_cost_threshold})`);

    // ─── Test C: Validation on PUT ───────────────────────────────────────────
    console.log("\nTest C1: PUT validation rejects invalid boolean types");
    const invalidBoolRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_enabled: "yes" })
    });
    assert(invalidBoolRes.status === 400, `String boolean rejected with 400 (got ${invalidBoolRes.status})`);

    const invalidBoolNumRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_enabled: 1 })
    });
    assert(invalidBoolNumRes.status === 400, `Number boolean 1 rejected with 400 (got ${invalidBoolNumRes.status})`);

    console.log("\nTest C2: PUT validation rejects invalid high_cost_threshold");
    const negThresholdRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_threshold: -500 })
    });
    assert(negThresholdRes.status === 400, `Negative threshold rejected with 400 (got ${negThresholdRes.status})`);

    const zeroThresholdRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_threshold: 0 })
    });
    assert(zeroThresholdRes.status === 400, `Zero threshold rejected with 400 (got ${zeroThresholdRes.status})`);

    const hugeThresholdRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_threshold: 999999999 })
    });
    assert(hugeThresholdRes.status === 400, `Exceeded max threshold rejected with 400 (got ${hugeThresholdRes.status})`);

    const nanThresholdRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_threshold: "not_a_number" })
    });
    assert(nanThresholdRes.status === 400, `NaN threshold rejected with 400 (got ${nanThresholdRes.status})`);

    console.log("\nTest C3: PUT validation rejects arbitrary fields");
    const arbitraryRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ is_admin: true, high_cost_enabled: false })
    });
    assert(arbitraryRes.status === 400, `Arbitrary column rejected with 400 (got ${arbitraryRes.status})`);

    console.log("\nTest C4: PUT validation rejects empty request body");
    const emptyBodyRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({})
    });
    assert(emptyBodyRes.status === 400, `Empty body rejected with 400 (got ${emptyBodyRes.status})`);

    console.log("\nTest C5: Authenticated PUT updates values successfully");
    const validUpdatePayload = {
      high_cost_enabled: false,
      cost_increase_enabled: false,
      low_utilization_enabled: true,
      ai_recommendation_enabled: false,
      optimization_opportunity_enabled: true,
      high_cost_threshold: 25000
    };
    const putRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify(validUpdatePayload)
    });
    assert(putRes.status === 200, `PUT returns 200 (got ${putRes.status})`);
    const putData = await putRes.json();
    assert(putData.success === true, "PUT response has success: true");
    assert(putData.preferences.high_cost_enabled === false, "high_cost_enabled updated to false");
    assert(putData.preferences.cost_increase_enabled === false, "cost_increase_enabled updated to false");
    assert(putData.preferences.ai_recommendation_enabled === false, "ai_recommendation_enabled updated to false");
    assert(putData.preferences.high_cost_threshold === 25000, "high_cost_threshold updated to 25000");

    // ─── Test D: Authenticated GET returns updated values ─────────────────────
    console.log("\nTest D: Authenticated GET returns updated values");
    const getUpdatedRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(getUpdatedRes.status === 200, `GET returns 200`);
    const getUpdatedData = await getUpdatedRes.json();
    assert(getUpdatedData.preferences.high_cost_enabled === false, "Persisted high_cost_enabled is false");
    assert(getUpdatedData.preferences.cost_increase_enabled === false, "Persisted cost_increase_enabled is false");
    assert(getUpdatedData.preferences.high_cost_threshold === 25000, "Persisted high_cost_threshold is 25000");

    // ─── Test E: Reset restores database defaults ─────────────────────────────
    console.log("\nTest E: POST /api/notification-preferences/reset restores defaults");
    const resetRes = await fetch(`${BASE_URL}/api/notification-preferences/reset`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(resetRes.status === 200, `Reset returns 200 (got ${resetRes.status})`);
    const resetData = await resetRes.json();
    assert(resetData.success === true, "Reset response has success: true");
    assert(resetData.preferences.high_cost_enabled === true, "high_cost_enabled reset to true");
    assert(resetData.preferences.cost_increase_enabled === true, "cost_increase_enabled reset to true");
    assert(resetData.preferences.low_utilization_enabled === true, "low_utilization_enabled reset to true");
    assert(resetData.preferences.ai_recommendation_enabled === true, "ai_recommendation_enabled reset to true");
    assert(resetData.preferences.optimization_opportunity_enabled === true, "optimization_opportunity_enabled reset to true");
    assert(resetData.preferences.high_cost_threshold === 10000, "high_cost_threshold reset to 10000");

    // ─── Test F: User Isolation ───────────────────────────────────────────────
    console.log("\nTest F: User isolation is maintained");
    // 1. Get User 2 preferences (creates defaults for User 2)
    const user2GetRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    assert(user2GetRes.status === 200, `User 2 GET returns 200`);
    const user2Prefs = (await user2GetRes.json()).preferences;
    assert(user2Prefs.user_id === testUser2.id, `User 2 preferences belong to user_id ${testUser2.id}`);
    assert(user2Prefs.high_cost_threshold === 10000, "User 2 high_cost_threshold is default 10000");

    // 2. User 1 updates preferences to custom values
    await fetch(`${BASE_URL}/api/notification-preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ high_cost_threshold: 42000, high_cost_enabled: false })
    });

    // 3. Verify User 2 preferences were NOT affected by User 1's update
    const user2CheckRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const user2CheckPrefs = (await user2CheckRes.json()).preferences;
    assert(user2CheckPrefs.user_id === testUser2.id, "User 2 still has user_id 2");
    assert(user2CheckPrefs.high_cost_threshold === 10000, "User 2 high_cost_threshold is UNCHANGED (10000)");
    assert(user2CheckPrefs.high_cost_enabled === true, "User 2 high_cost_enabled is UNCHANGED (true)");

    // 4. Verify User 1 cannot spoof user_id via query parameter or body
    const spoofQueryRes = await fetch(`${BASE_URL}/api/notification-preferences?user_id=${testUser2.id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const spoofQueryData = (await spoofQueryRes.json()).preferences;
    assert(spoofQueryData.user_id === testUser1.id, "Query user_id spoof is ignored; returns User 1 data");
    assert(spoofQueryData.high_cost_threshold === 42000, "Still User 1 data (42000)");

    // 5. User 1 resets; verify User 2 is still unaffected
    await fetch(`${BASE_URL}/api/notification-preferences/reset`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` }
    });
    const user2FinalRes = await fetch(`${BASE_URL}/api/notification-preferences`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const user2FinalPrefs = (await user2FinalRes.json()).preferences;
    assert(user2FinalPrefs.user_id === testUser2.id, "User 2 data unaffected after User 1 reset");

    console.log("\n========================================================");
    console.log("ALL TESTS PASSED SUCCESSFULLY! ✓✓✓");
    console.log("========================================================\n");
  } catch (err) {
    console.error("\nTEST SUITE FAILED ✗:", err);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

runTests();

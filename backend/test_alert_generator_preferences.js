require("dotenv").config();
const pool = require("./config/db");
const { generateAlertsForCostRecord } = require("./utils/alertGenerator");

let testUserA, testUserB;
let originalFetch = global.fetch;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function setup() {
  console.log("\nSetting up test users and environment...");

  // Setup User A
  const resA = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Test Alert User A', 'test_alert_a@example.com', 'dummyhash')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email`
  );
  testUserA = resA.rows[0];

  // Setup User B
  const resB = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Test Alert User B', 'test_alert_b@example.com', 'dummyhash')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email`
  );
  testUserB = resB.rows[0];

  // Clean existing test data for these users
  await cleanupData();
  console.log(`  Initialized Test User A (id: ${testUserA.id}) and User B (id: ${testUserB.id})`);
}

async function cleanupData() {
  const ids = [testUserA.id, testUserB.id];
  await pool.query("DELETE FROM notifications WHERE user_id = ANY($1)", [ids]);
  await pool.query("DELETE FROM user_notification_preferences WHERE user_id = ANY($1)", [ids]);
}

async function teardown() {
  console.log("\nTearing down test data...");
  await cleanupData();
  const ids = [testUserA.id, testUserB.id];
  await pool.query("DELETE FROM users WHERE id = ANY($1)", [ids]);
  global.fetch = originalFetch;
  await pool.end();
}

function mockFetchForML() {
  global.fetch = async (url, options) => {
    if (url.includes("/api/optimize")) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          recommendations: [
            {
              title: "Downsize EC2 t3.xlarge to t3.medium",
              estimated_savings: 4500
            }
          ],
          predicted_monthly_cost: 15000,
          total_estimated_savings: 4500
        })
      };
    }
    return originalFetch ? originalFetch(url, options) : Promise.reject(new Error("Unknown URL"));
  };
}

function restoreFetch() {
  global.fetch = originalFetch;
}

async function runTests() {
  try {
    await setup();

    console.log("\n========================================================");
    console.log("RUNNING ALERT GENERATOR PREFERENCES VERIFICATION TESTS");
    console.log("========================================================");

    // ──────────────────────────────────────────────────────────────────────────
    // Test A: high_cost_enabled=false prevents HIGH_COST
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest A: high_cost_enabled=false prevents HIGH_COST");
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, false, 10000)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900001,
        current_monthly_cost: 15000,
        provider: "AWS",
        service: "EC2",
        resource_name: "prod-db-node-1"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "No HIGH_COST alert generated when high_cost_enabled=false (cost 15000 >= threshold 10000)");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test B: high_cost_enabled=true allows HIGH_COST
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest B: high_cost_enabled=true allows HIGH_COST");
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, true, 10000)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900002,
        current_monthly_cost: 15000,
        provider: "AWS",
        service: "EC2",
        resource_name: "prod-db-node-2"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 1, "HIGH_COST alert generated when high_cost_enabled=true (cost 15000 >= threshold 10000)");
      assert(res.rows[0].severity === "critical", "HIGH_COST alert severity is critical");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test C: custom high_cost_threshold=20000 prevents alert for 15000
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest C: custom high_cost_threshold=20000 prevents alert for 15000");
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, true, 20000)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900003,
        current_monthly_cost: 15000,
        provider: "AWS",
        service: "RDS",
        resource_name: "prod-db-node-3"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "No HIGH_COST alert generated when cost 15000 < custom threshold 20000");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test D: custom high_cost_threshold=10000 allows alert for 15000
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest D: custom high_cost_threshold=10000 allows alert for 15000");
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, true, 10000)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900004,
        current_monthly_cost: 15000,
        provider: "GCP",
        service: "Compute Engine",
        resource_name: "analytics-cluster-1"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 1, "HIGH_COST alert generated when cost 15000 >= custom threshold 10000");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test E: each of the other four disabled flags prevents its corresponding alert
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest E: each of the other four disabled flags prevents its corresponding alert");
    mockFetchForML();

    // E1: cost_increase_enabled=false prevents COST_INCREASE
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, cost_increase_enabled)
         VALUES ($1, false)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900005,
        current_monthly_cost: 15000,
        previous_monthly_cost: 10000, // 50% increase (>= 10%)
        provider: "AWS",
        service: "EC2"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'COST_INCREASE'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "cost_increase_enabled=false prevents COST_INCREASE alert");

      // Verify that enabling it creates the alert
      await pool.query(
        "UPDATE user_notification_preferences SET cost_increase_enabled = true WHERE user_id = $1",
        [testUserA.id]
      );
      const costRecordEnabled = { ...costRecord, id: 900006 };
      await generateAlertsForCostRecord(costRecordEnabled, testUserA.id);

      const resEnabled = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'COST_INCREASE'",
        [testUserA.id, costRecordEnabled.id]
      );
      assert(resEnabled.rows.length === 1, "cost_increase_enabled=true allows COST_INCREASE alert");
    }

    // E2: low_utilization_enabled=false prevents LOW_UTILIZATION
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, low_utilization_enabled)
         VALUES ($1, false)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900007,
        current_monthly_cost: 5000,
        cpu_utilization: 15, // < 30%
        memory_utilization: 20, // < 30%
        provider: "AWS",
        service: "EC2"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'LOW_UTILIZATION'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "low_utilization_enabled=false prevents LOW_UTILIZATION alert");

      // Verify that enabling it creates the alert
      await pool.query(
        "UPDATE user_notification_preferences SET low_utilization_enabled = true WHERE user_id = $1",
        [testUserA.id]
      );
      const costRecordEnabled = { ...costRecord, id: 900008 };
      await generateAlertsForCostRecord(costRecordEnabled, testUserA.id);

      const resEnabled = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'LOW_UTILIZATION'",
        [testUserA.id, costRecordEnabled.id]
      );
      assert(resEnabled.rows.length === 1, "low_utilization_enabled=true allows LOW_UTILIZATION alert");
    }

    // E3: ai_recommendation_enabled=false prevents AI_RECOMMENDATION
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, ai_recommendation_enabled, optimization_opportunity_enabled)
         VALUES ($1, false, false)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900009,
        current_monthly_cost: 15000,
        cpu_utilization: 20,
        memory_utilization: 20,
        storage_utilization: 20,
        provider: "AWS",
        service: "EC2"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'AI_RECOMMENDATION'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "ai_recommendation_enabled=false prevents AI_RECOMMENDATION alert");

      // Verify that enabling it creates the alert
      await pool.query(
        "UPDATE user_notification_preferences SET ai_recommendation_enabled = true WHERE user_id = $1",
        [testUserA.id]
      );
      const costRecordEnabled = { ...costRecord, id: 900010 };
      await generateAlertsForCostRecord(costRecordEnabled, testUserA.id);

      const resEnabled = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'AI_RECOMMENDATION'",
        [testUserA.id, costRecordEnabled.id]
      );
      assert(resEnabled.rows.length === 1, "ai_recommendation_enabled=true allows AI_RECOMMENDATION alert");
    }

    // E4: optimization_opportunity_enabled=false prevents OPTIMIZATION_OPPORTUNITY
    {
      await cleanupData();
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, ai_recommendation_enabled, optimization_opportunity_enabled)
         VALUES ($1, false, false)`,
        [testUserA.id]
      );

      const costRecord = {
        id: 900011,
        current_monthly_cost: 15000,
        cpu_utilization: 20,
        memory_utilization: 20,
        storage_utilization: 20,
        provider: "AWS",
        service: "EC2"
      };

      await generateAlertsForCostRecord(costRecord, testUserA.id);

      const res = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'OPTIMIZATION_OPPORTUNITY'",
        [testUserA.id, costRecord.id]
      );
      assert(res.rows.length === 0, "optimization_opportunity_enabled=false prevents OPTIMIZATION_OPPORTUNITY alert");

      // Verify that enabling it creates the alert
      await pool.query(
        "UPDATE user_notification_preferences SET optimization_opportunity_enabled = true WHERE user_id = $1",
        [testUserA.id]
      );
      const costRecordEnabled = { ...costRecord, id: 900012 };
      await generateAlertsForCostRecord(costRecordEnabled, testUserA.id);

      const resEnabled = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'OPTIMIZATION_OPPORTUNITY'",
        [testUserA.id, costRecordEnabled.id]
      );
      assert(resEnabled.rows.length === 1, "optimization_opportunity_enabled=true allows OPTIMIZATION_OPPORTUNITY alert");
    }

    restoreFetch();

    // ──────────────────────────────────────────────────────────────────────────
    // Test F: user A's preferences do not affect user B
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest F: user A's preferences do not affect user B");
    {
      await cleanupData();

      // User A disables high cost alerts
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, false, 10000)`,
        [testUserA.id]
      );

      // User B keeps high cost alerts enabled with threshold 10000
      await pool.query(
        `INSERT INTO user_notification_preferences
           (user_id, high_cost_enabled, high_cost_threshold)
         VALUES ($1, true, 10000)`,
        [testUserB.id]
      );

      const costRecord = {
        id: 900013,
        current_monthly_cost: 15000,
        provider: "AWS",
        service: "EC2"
      };

      // Generate alerts for both users with identical cost record
      await generateAlertsForCostRecord(costRecord, testUserA.id);
      await generateAlertsForCostRecord(costRecord, testUserB.id);

      const resA = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecord.id]
      );
      const resB = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserB.id, costRecord.id]
      );

      assert(resA.rows.length === 0, "User A with high_cost_enabled=false receives NO alert");
      assert(resB.rows.length === 1, "User B with high_cost_enabled=true receives HIGH_COST alert");
      assert(resB.rows[0].user_id === testUserB.id, "User B's alert is strictly scoped to User B");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test G: existing alert generation fallback behavior (database defaults)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest G: existing alert generation fallback behavior (no preference row)");
    {
      await cleanupData();
      // Ensure NEITHER user has a row in user_notification_preferences
      const prefCheck = await pool.query(
        "SELECT * FROM user_notification_preferences WHERE user_id = $1",
        [testUserA.id]
      );
      assert(prefCheck.rows.length === 0, "User A has no preferences row in DB");

      // Default high_cost_threshold is 10000, default high_cost_enabled is true
      const costRecordAbove = {
        id: 900014,
        current_monthly_cost: 15000,
        provider: "AWS",
        service: "EC2"
      };
      await generateAlertsForCostRecord(costRecordAbove, testUserA.id);

      const resAbove = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecordAbove.id]
      );
      assert(resAbove.rows.length === 1, "Fallback defaults trigger HIGH_COST when cost (15000) >= default threshold (10000)");

      // Cost below default threshold (10000) does not trigger HIGH_COST
      const costRecordBelow = {
        id: 900015,
        current_monthly_cost: 5000,
        provider: "AWS",
        service: "EC2"
      };
      await generateAlertsForCostRecord(costRecordBelow, testUserA.id);

      const resBelow = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecordBelow.id]
      );
      assert(resBelow.rows.length === 0, "Fallback defaults do not trigger HIGH_COST when cost (5000) < default threshold (10000)");

      // 24-hour deduplication check with fallback defaults
      await generateAlertsForCostRecord(costRecordAbove, testUserA.id);
      const resDedup = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 AND source_id = $2 AND type = 'HIGH_COST'",
        [testUserA.id, costRecordAbove.id]
      );
      assert(resDedup.rows.length === 1, "24-hour deduplication prevents duplicate alert creation");
    }

    console.log("\n========================================================");
    console.log("ALL ALERT GENERATOR PREFERENCE TESTS PASSED! ✓✓✓");
    console.log("========================================================\n");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

runTests();

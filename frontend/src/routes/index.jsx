import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import CloudCosts from "../pages/CloudCosts";
import Analytics from "../pages/Analytics";
import AIRecommendations from "../pages/AIRecommendations";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/cloud-costs" element={<CloudCosts />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/ai-recommendations" element={<AIRecommendations />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;

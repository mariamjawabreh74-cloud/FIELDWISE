import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import "./lib/i18n";
import "./styles/forms.css";
import "./styles/insights.css";
import "./styles/planning.css";
import "./styles/explorer.css";
import "./styles/season.css";
import "./styles/accessibility.css";
import { Layout } from "./components/Layout";
import Landing from "./pages/Landing";
import { ApiProvider } from "./hooks/ApiProvider";
import { FarmProvider } from "./hooks/useFarm";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Location = lazy(() => import("./pages/Location"));
const Boundary = lazy(() => import("./pages/Boundary"));
const Profile = lazy(() => import("./pages/Profile"));
const CropHistory = lazy(() => import("./pages/CropHistory"));
const Priorities = lazy(() => import("./pages/Priorities"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Planner = lazy(() => import("./pages/Planner"));
const Comparison = lazy(() => import("./pages/Comparison"));
const Explorer = lazy(() => import("./pages/Explorer"));
const ActionPlan = lazy(() => import("./pages/ActionPlan"));
const Methodology = lazy(() => import("./pages/Methodology"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ApiProvider>
      <FarmProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="start" element={<Onboarding />} />
              <Route path="farm/location" element={<Location />} />
              <Route path="farm/boundary" element={<Boundary />} />
              <Route path="farm/profile" element={<Profile />} />
              <Route path="farm/history" element={<CropHistory />} />
              <Route path="farm/priorities" element={<Priorities />} />
              <Route path="farm/analysis" element={<Analysis />} />
              <Route path="farm/planner" element={<Planner />} />
              <Route path="farm/compare" element={<Comparison />} />
              <Route path="farm/explore" element={<Explorer />} />
              <Route path="farm/plan" element={<ActionPlan />} />
              <Route path="methodology" element={<Methodology />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FarmProvider>
    </ApiProvider>
  );
}

export default App;

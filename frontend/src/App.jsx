import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Orders from "./pages/Orders";
import Trips from "./pages/Trips";
import LiveTracking from "./pages/LiveTracking";
import DriverTracking from "./pages/DriverTracking";
import FuelManagement from "./pages/FuelManagement";
import Maintenance from "./pages/Maintenance";
import Customers from "./pages/Customers";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import AuthPage from "./pages/AuthPage";



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/driver-track/:token"
            element={<DriverTracking />}
          />

          <Route
            path="/login"
            element={<AuthPage />}
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AdminLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-col">
        <Topbar />

        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/vehicles"
            element={<Vehicles />}
          />

          <Route
            path="/drivers"
            element={<Drivers />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/trips"
            element={<Trips />}
          />

          <Route
            path="/tracking"
            element={<LiveTracking />}
          />

          <Route
            path="/fuel"
            element={<FuelManagement />}
          />

          <Route
            path="/maintenance"
            element={<Maintenance />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/income"
            element={<Income />}
          />

          <Route
            path="/expenses"
            element={<Expenses />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />
          <Route
            path="/ai-assistant"
            element={<AIAssistant />}
          />
          <Route
            path="/settings"
            element={<Settings />}
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

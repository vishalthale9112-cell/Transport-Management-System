import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

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
import Notifications from "./pages/Notifications";
import Placeholder from "./pages/Placeholder";

const placeholders = [
  ["/income", "Income"],
  ["/expenses", "Expenses"],
  ["/reports", "Reports"],
  ["/documents", "Documents"],
  ["/ai-assistant", "AI Assistant"],
  ["/settings", "Settings"],
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Driver public GPS page */}
        <Route
          path="/driver-track/:token"
          element={<DriverTracking />}
        />

        {/* Admin dashboard */}
        <Route
          path="/*"
          element={<AdminLayout />}
        />
      </Routes>
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
            path="/notifications"
            element={<Notifications />}
          />

          {placeholders.map(([path, title]) => (
            <Route
              key={path}
              path={path}
              element={<Placeholder title={title} />}
            />
          ))}
        </Routes>
      </div>
    </div>
  );
}
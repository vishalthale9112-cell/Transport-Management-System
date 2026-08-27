import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Placeholder from "./pages/Placeholder";

const placeholders = [
  ["/orders", "Orders"],
  ["/trips", "Trips"],
  ["/tracking", "Live Tracking"],
  ["/fuel", "Fuel Management"],
  ["/maintenance", "Maintenance"],
  ["/customers", "Customers"],
  ["/income", "Income"],
  ["/expenses", "Expenses"],
  ["/reports", "Reports"],
  ["/documents", "Documents"],
  ["/notifications", "Notifications"],
  ["/ai-assistant", "AI Assistant"],
  ["/settings", "Settings"],
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main-col">
          <Topbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            {placeholders.map(([path, title]) => (
              <Route key={path} path={path} element={<Placeholder title={title} />} />
            ))}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

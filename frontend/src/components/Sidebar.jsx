import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Truck, User, Package, Route, MapPin,
  Fuel, Wrench, Users, TrendingUp, TrendingDown, FileBarChart,
  FolderOpen, Bell, Bot, Settings,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Vehicles", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: User },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/trips", label: "Trips", icon: Route },
  { to: "/tracking", label: "Live Tracking", icon: MapPin },
  { to: "/fuel", label: "Fuel Management", icon: Fuel },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/income", label: "Income", icon: TrendingUp },
  { to: "/expenses", label: "Expenses", icon: TrendingDown },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="mark">TT</span>
        <span>THALE TRANSPORT</span>
      </div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}

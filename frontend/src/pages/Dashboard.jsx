import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { AlertTriangle, Bell, Info } from "lucide-react";
import { getDashboard, getVehicles } from "../api";
import RealMap from "../components/RealMap";

const FUEL_COLORS = { Diesel: "#0b1e33", Petrol: "#1abc9c", CNG: "#f5a623" };
const SEVERITY_STYLE = {
  info: { bg: "#e8f3ff", color: "#2f6fdb", icon: Bell },
  warning: { bg: "#fef6e6", color: "#f5a623", icon: AlertTriangle },
  critical: { bg: "#fdeeea", color: "#e74c3c", icon: Info },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    getDashboard().then(setStats).catch(() => {});
    getVehicles().then(setVehicles).catch(() => {});
  }, []);

  if (!stats) return <div className="content">Loading dashboard...</div>;

  const fuelData = Object.entries(stats.fuel_breakdown).map(([name, value]) => ({ name, value }));
  const costData = Object.entries(stats.cost_per_km).map(([name, value]) => ({ name, value }));

  return (
    <div className="content">
      <div className="stat-row">
        <div className="card stat-card">
          <div className="stat-label">Total Vehicles</div>
          <div className="stat-value">{stats.total_vehicles}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Active Trips</div>
          <div className="stat-value">{stats.active_trips}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Drivers</div>
          <div className="stat-value">{stats.total_drivers}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">{stats.pending_orders}</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-title">
            Monthly Revenue
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-500)" }}>
              <span className="legend-dot" style={{ background: "var(--navy-900)" }} />Revenue
              <span className="legend-dot" style={{ background: "var(--amber-500)", marginLeft: 10 }} />Expenses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.monthly_finance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Line type="monotone" dataKey="revenue" stroke="#0b1e33" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#f5a623" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Fuel Type Breakdown</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={fuelData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {fuelData.map((entry) => (
                  <Cell key={entry.name} fill={FUEL_COLORS[entry.name] || "#999"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", fontSize: 12, marginTop: 4 }}>
            {fuelData.map((f) => (
              <span key={f.name}>
                <span className="legend-dot" style={{ background: FUEL_COLORS[f.name] }} />{f.name}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Cost per KM</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={costData}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
              <YAxis hide />
              <Tooltip formatter={(v) => `₹${v}/km`} />
              <Bar dataKey="value" fill="#1abc9c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-title" style={{ padding: "16px 20px 0" }}>Live GPS Fleet Map</div>
          <div style={{ margin: "14px 20px 20px" }}>
            <RealMap vehicles={vehicles} height={300} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">Live Alerts and Critical Notifications</div>
          {stats.alerts.map((a) => {
            const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
            const Icon = s.icon;
            return (
              <div className="alert-item" key={a.id}>
                <div className="alert-icon" style={{ background: s.bg, color: s.color }}>
                  <Icon size={15} />
                </div>
                <div>
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-time">{a.minutes_ago} minutes ago</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
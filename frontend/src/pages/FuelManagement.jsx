import { useState, useEffect } from "react";
import { Plus, Fuel, Search } from "lucide-react";
import { getVehicles, getFuelLogs, createFuelLog } from "../api";

export default function FuelManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", liters: "", cost: "", odometer: "" });
  const [search, setSearch] = useState("");

  const load = () => getFuelLogs().then(setLogs).catch(() => {});

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {});
    load();
  }, []);

  const vehicleNumber = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? v.registration_number : `#${id}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.liters || !form.cost) return;
    await createFuelLog({
      vehicle_id: Number(form.vehicle_id),
      liters: Number(form.liters),
      cost: Number(form.cost),
      odometer: Number(form.odometer) || 0,
    });
    setForm({ vehicle_id: "", liters: "", cost: "", odometer: "" });
    setShowForm(false);
    load();
  };

  // Filter logs by searched vehicle number (case-insensitive, partial match)
  const filteredLogs = search.trim()
    ? logs.filter((l) => vehicleNumber(l.vehicle_id).toLowerCase().includes(search.trim().toLowerCase()))
    : logs;

  const totalCost = filteredLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalLiters = filteredLogs.reduce((sum, l) => sum + l.liters, 0);
  const avgCostPerLiter = totalLiters ? (totalCost / totalLiters).toFixed(1) : 0;
  const entryCount = filteredLogs.length;

  return (
    <div className="content">
      <div className="stat-row">
        <div className="card stat-card">
          <div className="stat-label">{search ? `Total Cost — ${search}` : "Total Fuel Cost"}</div>
          <div className="stat-value">₹{totalCost.toLocaleString("en-IN")}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">{search ? `Total Liters — ${search}` : "Total Liters"}</div>
          <div className="stat-value">{totalLiters} L</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Avg Cost / Liter</div>
          <div className="stat-value">₹{avgCostPerLiter}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">{search ? "Fill-ups Found" : "Total Entries"}</div>
          <div className="stat-value">{entryCount}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Fuel History
          <div style={{ display: "flex", gap: 10 }}>
            <div className="search-box" style={{ maxWidth: 220 }}>
              <Search size={14} />
              <input
                placeholder="Enter vehicle number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
              <Plus size={14} /> Log Fuel Entry
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.registration_number}</option>
              ))}
            </select>
            <input
              placeholder="Liters"
              type="number"
              value={form.liters}
              onChange={(e) => setForm({ ...form, liters: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 100 }}
            />
            <input
              placeholder="Cost (₹)"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 110 }}
            />
            <input
              placeholder="Odometer (km)"
              type="number"
              value={form.odometer}
              onChange={(e) => setForm({ ...form, odometer: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 130 }}
            />
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Liters</th>
              <th>Cost</th>
              <th>Odometer</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((l) => (
              <tr key={l.id}>
                <td style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Fuel size={13} color="var(--teal-600)" /> {vehicleNumber(l.vehicle_id)}
                </td>
                <td>{l.date || "—"}</td>
                <td>{l.liters} L</td>
                <td>₹{l.cost.toLocaleString("en-IN")}</td>
                <td>{l.odometer.toLocaleString("en-IN")} km</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>
                  {search ? `No fuel history found for "${search}"` : "No fuel logs yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
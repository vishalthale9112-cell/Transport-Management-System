import { useState, useEffect } from "react";
import { Plus, Wrench, AlertTriangle } from "lucide-react";
import { getVehicles } from "../api";

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([
    { id: 1, vehicle: "MH14CD5678", service_type: "Oil Change", date: "2026-08-20", cost: 2500, next_due_days: 2 },
    { id: 2, vehicle: "MH12AB3456", service_type: "Brake Check", date: "2026-08-10", cost: 3200, next_due_days: 15 },
    { id: 3, vehicle: "KA01XY1454", service_type: "Tyre Replacement", date: "2026-07-28", cost: 18000, next_due_days: 45 },
    { id: 4, vehicle: "MH04EF9012", service_type: "General Service", date: "2026-08-01", cost: 4500, next_due_days: 1 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle: "", service_type: "", cost: "", next_due_days: "" });

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {});
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.vehicle || !form.service_type) return;
    setRecords([
      {
        id: Date.now(),
        vehicle: form.vehicle,
        service_type: form.service_type,
        date: new Date().toISOString().slice(0, 10),
        cost: Number(form.cost) || 0,
        next_due_days: Number(form.next_due_days) || 30,
      },
      ...records,
    ]);
    setForm({ vehicle: "", service_type: "", cost: "", next_due_days: "" });
    setShowForm(false);
  };

  const dueSoonCount = records.filter((r) => r.next_due_days <= 5).length;
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="content">
      <div className="stat-row">
        <div className="card stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{records.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Due Soon (≤5 days)</div>
          <div className="stat-value" style={{ color: dueSoonCount > 0 ? "var(--red-500)" : undefined }}>
            {dueSoonCount}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Service Cost</div>
          <div className="stat-value">₹{totalCost.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Maintenance Records
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> Log Service
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.registration_number}>{v.registration_number}</option>
              ))}
            </select>
            <input
              placeholder="Service Type (e.g. Oil Change)"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 180 }}
            />
            <input
              placeholder="Cost (₹)"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 100 }}
            />
            <input
              placeholder="Next due in (days)"
              type="number"
              value={form.next_due_days}
              onChange={(e) => setForm({ ...form, next_due_days: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 140 }}
            />
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Service Type</th>
              <th>Last Serviced</th>
              <th>Cost</th>
              <th>Next Service Due</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Wrench size={13} color="var(--teal-600)" /> {r.vehicle}
                </td>
                <td>{r.service_type}</td>
                <td>{r.date}</td>
                <td>₹{r.cost.toLocaleString("en-IN")}</td>
                <td>
                  {r.next_due_days <= 5 ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--red-500)", fontWeight: 700 }}>
                      <AlertTriangle size={13} /> Due in {r.next_due_days} day{r.next_due_days !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span>Due in {r.next_due_days} days</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No maintenance records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
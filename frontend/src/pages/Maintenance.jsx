import { useState, useEffect } from "react";
import { Plus, Wrench, AlertTriangle, Calendar, IndianRupee, Clock, User, Phone, Droplet, Disc, Settings, CircleDot, Tag } from "lucide-react";
import { getVehicles, getDrivers } from "../api";

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [records, setRecords] = useState([
    { id: 1, vehicle: "MH20BH1234", service_type: "Oil Change", brand: "Castrol", date: "2026-08-31", cost: 1200, next_due_days: 1, driver: "" },
    { id: 2, vehicle: "MH14CD5678", service_type: "Oil Change", brand: "Shell", date: "2026-08-20", cost: 2500, next_due_days: 2, driver: "Suresh Patil" },
    { id: 3, vehicle: "MH12AB3456", service_type: "Brake Check", brand: "Bosch", date: "2026-08-10", cost: 3200, next_due_days: 15, driver: "Thanya Yog" },
    { id: 4, vehicle: "KA01XY1454", service_type: "Tyre Replacement", brand: "MRF", date: "2026-07-28", cost: 18000, next_due_days: 45, driver: "Rahul Singh" },
    { id: 5, vehicle: "MH04EF9012", service_type: "General Service", brand: "", date: "2026-08-01", cost: 4500, next_due_days: 1, driver: "Ganesh More" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle: "", service_type: "", brand: "", cost: "", next_due_days: "", driver: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {});
    getDrivers().then(setDrivers).catch(() => {});
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.vehicle || !form.service_type) return;
    setRecords([
      {
        id: Date.now(),
        vehicle: form.vehicle,
        service_type: form.service_type,
        brand: form.brand,
        date: new Date().toISOString().slice(0, 10),
        cost: Number(form.cost) || 0,
        next_due_days: Number(form.next_due_days) || 30,
        driver: form.driver,
      },
      ...records,
    ]);
    setForm({ vehicle: "", service_type: "", brand: "", cost: "", next_due_days: "", driver: "" });
    setShowForm(false);
  };

  const dueSoonCount = records.filter((r) => r.next_due_days <= 5).length;
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

  const driverInfo = (name) => drivers.find((d) => d.name === name);

  const serviceIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("oil")) return { Icon: Droplet, color: "#f5a623", bg: "#fef6e6" };
    if (t.includes("brake")) return { Icon: Disc, color: "#e74c3c", bg: "#fdeeea" };
    if (t.includes("tyre") || t.includes("tire")) return { Icon: CircleDot, color: "#2f6fdb", bg: "#e8f3ff" };
    return { Icon: Settings, color: "var(--teal-600)", bg: "#e5f8f3" };
  };

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

      <div className="grid-2">
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
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 160 }}
              />
              <input
                placeholder="Brand/Company (e.g. Castrol)"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, width: 170 }}
              />
              <select
                value={form.driver}
                onChange={(e) => setForm({ ...form, driver: e.target.value })}
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
              >
                <option value="">Done by (Driver)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
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
                <th>Brand</th>
                <th>Last Serviced</th>
                <th>Cost</th>
                <th>Next Service Due</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{ cursor: "pointer", background: selected?.id === r.id ? "var(--bg)" : undefined }}
                >
                  <td style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Wrench size={13} color="var(--teal-600)" /> {r.vehicle}
                  </td>
                  <td>{r.service_type}</td>
                  <td>{r.brand || "—"}</td>
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
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No maintenance records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">Service Details</div>

          {!selected && (
            <div style={{ textAlign: "center", color: "var(--text-500)", padding: 40, fontSize: 13 }}>
              Click a record to see the brand used
            </div>
          )}

          {selected && (
            <div>
              {(() => {
                const { Icon, color, bg } = serviceIcon(selected.service_type);
                return (
                  <div
                    style={{
                      width: "100%", height: 120, borderRadius: 10, background: bg,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      marginBottom: 14, gap: 6,
                    }}
                  >
                    <Icon size={40} color={color} />
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{selected.service_type}</span>
                  </div>
                );
              })()}

              {selected.brand && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, background: "var(--navy-900)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Tag size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-500)" }}>Brand / Company Used</div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{selected.brand}</div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{selected.vehicle}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={15} color="var(--teal-600)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-500)" }}>Date</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{selected.date}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IndianRupee size={15} color="var(--teal-600)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-500)" }}>Cost</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>₹{selected.cost.toLocaleString("en-IN")}</div>
                  </div>
                </div>

                {selected.driver && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={15} color="var(--teal-600)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-500)" }}>Done by</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{selected.driver}</div>
                      {driverInfo(selected.driver)?.phone && (
                        <div style={{ fontSize: 11, color: "var(--text-500)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={10} /> {driverInfo(selected.driver).phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: selected.next_due_days <= 5 ? "#fdeeea" : "var(--bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Clock size={15} color={selected.next_due_days <= 5 ? "var(--red-500)" : "var(--teal-600)"} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-500)" }}>Next Service Due</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selected.next_due_days <= 5 ? "var(--red-500)" : undefined }}>
                      In {selected.next_due_days} day{selected.next_due_days !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
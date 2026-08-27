import { useEffect, useState } from "react";
import { Plus, Trash2, Phone } from "lucide-react";
import { getDrivers, createDriver, deleteDriver } from "../api";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", license_number: "" });

  const load = () => getDrivers().then(setDrivers).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await createDriver(form);
    setForm({ name: "", phone: "", license_number: "" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await deleteDriver(id);
    load();
  };

  const initials = (name) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="content">
      <div className="card">
        <div className="card-title">
          Drivers
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> Add Driver
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              placeholder="License Number"
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Phone</th>
              <th>License Number</th>
              <th>Assigned Vehicle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--navy-700)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                      }}
                    >
                      {initials(d.name)}
                    </div>
                    <span style={{ fontWeight: 700 }}>{d.name}</span>
                  </div>
                </td>
                <td>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-500)" }}>
                    <Phone size={13} /> {d.phone || "—"}
                  </span>
                </td>
                <td>{d.license_number || "—"}</td>
                <td>{d.vehicles && d.vehicles.length > 0 ? d.vehicles.map((v) => v.registration_number).join(", ") : "—"}</td>
                <td>
                  <button className="btn-sm" onClick={() => handleDelete(d.id)}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No drivers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

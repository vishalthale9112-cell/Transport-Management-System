import { useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { getVehicles, createVehicle, deleteVehicle } from "../api";

const statusClass = { Active: "status-active", Maintenance: "status-maintenance", Idle: "status-idle" };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ registration_number: "", vehicle_type: "Truck", fuel_type: "Diesel" });

  const load = (q = "") => getVehicles(q).then(setVehicles).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.registration_number) return;
    await createVehicle(form);
    setForm({ registration_number: "", vehicle_type: "Truck", fuel_type: "Diesel" });
    setShowForm(false);
    load(search);
  };

  const handleDelete = async (id) => {
    await deleteVehicle(id);
    load(search);
  };

  return (
    <div className="content">
      <div className="card">
        <div className="card-title">
          Vehicles
          <div style={{ display: "flex", gap: 10 }}>
            <div className="search-box" style={{ maxWidth: 220 }}>
              <Search size={14} />
              <input placeholder="Search registration no." value={search} onChange={handleSearch} />
            </div>
            <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
              <Plus size={14} /> Add Vehicle
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Registration Number"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <select
              value={form.vehicle_type}
              onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            >
              <option>Truck</option>
              <option>Van</option>
            </select>
            <select
              value={form.fuel_type}
              onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            >
              <option>Diesel</option>
              <option>Petrol</option>
              <option>CNG</option>
            </select>
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Registration No.</th>
              <th>Type</th>
              <th>Fuel</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Trip Progress</th>
              <th>Service Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700 }}>{v.registration_number}</td>
                <td>{v.vehicle_type}</td>
                <td>{v.fuel_type}</td>
                <td><span className={`status-pill ${statusClass[v.status] || ""}`}>{v.status}</span></td>
                <td>{v.driver ? v.driver.name : "—"}</td>
                <td>{v.trip_progress}%</td>
                <td>{v.service_due_in_days <= 5 ? <b style={{ color: "var(--red-500)" }}>{v.service_due_in_days}d</b> : `${v.service_due_in_days}d`}</td>
                <td>
                  <button className="btn-sm" onClick={() => handleDelete(v.id)}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No vehicles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

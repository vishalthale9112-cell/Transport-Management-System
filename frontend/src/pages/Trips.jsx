import { useEffect, useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { getTrips, createTrip, getVehicles } from "../api";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", origin: "", destination: "" });

  const load = () => getTrips().then(setTrips).catch(() => {});

  useEffect(() => {
    load();
    getVehicles().then(setVehicles).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.origin || !form.destination) return;
    await createTrip({ ...form, vehicle_id: Number(form.vehicle_id) });
    setForm({ vehicle_id: "", origin: "", destination: "" });
    setShowForm(false);
    load();
  };

  const vehicleName = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? v.registration_number : `#${id}`;
  };

  return (
    <div className="content">
      <div className="card">
        <div className="card-title">
          Trips
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> New Trip
          </button>
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
              placeholder="Origin"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <input
              placeholder="Destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
            <button className="btn-primary" type="submit">Save</button>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Route</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 700 }}>{vehicleName(t.vehicle_id)}</td>
                <td>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={13} color="var(--text-500)" /> {t.origin} → {t.destination}
                  </span>
                </td>
                <td>{t.progress}%</td>
                <td><span className="status-pill status-active">{t.status}</span></td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-500)", padding: 24 }}>No trips yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
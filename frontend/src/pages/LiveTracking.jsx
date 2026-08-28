import { useEffect, useState } from "react";
import { Search, Filter, Phone, MessageCircle, FileText, Truck } from "lucide-react";
import { getVehicles } from "../api";
import RealMap from "../components/RealMap";

export default function LiveTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getVehicles().then((data) => {
      setVehicles(data);
      if (data.length) setSelected(data[0]);
    }).catch(() => {});
  }, []);

  const filtered = vehicles.filter((v) =>
    v.registration_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content">
      <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            position: "absolute", top: 14, left: 16, right: 16, zIndex: 1000,
            display: "flex", gap: 10, alignItems: "center",
          }}
        >
          <div className="search-box" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <Search size={15} />
            <input
              placeholder="Search vehicle (e.g. MH12AB3456)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-sm" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <Filter size={14} />
          </button>
        </div>

        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <RealMap vehicles={filtered} onSelect={setSelected} height={520} />
          </div>

          {selected && (
            <div style={{ width: 300, padding: 18, borderLeft: "1px solid var(--border)", overflowY: "auto", maxHeight: 520 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Vehicle Details</div>

              <div
                style={{
                  width: "100%", height: 110, borderRadius: 10, background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}
              >
                <Truck size={40} color="var(--navy-700)" />
              </div>

              <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.registration_number}</div>
              <div style={{ fontSize: 12, color: "var(--text-500)", marginBottom: 12 }}>
                {selected.vehicle_type} · {selected.fuel_type}
              </div>

              {selected.driver && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: "var(--navy-700)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {selected.driver.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{selected.driver.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-500)" }}>{selected.driver.phone}</div>
                  </div>
                  <Phone size={15} color="var(--teal-600)" style={{ cursor: "pointer" }} />
                  <MessageCircle size={15} color="var(--teal-600)" style={{ cursor: "pointer" }} />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-500)" }}>Trip Progress</span>
                  <span style={{ fontWeight: 700 }}>{selected.trip_progress}%</span>
                </div>
                <div style={{ height: 6, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${selected.trip_progress}%`, background: "var(--teal-500)" }} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Documents</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Driver Docs", "RC", "Insurance", "Permit"].map((doc) => (
                  <div
                    key={doc}
                    title={doc}
                    style={{
                      flex: 1, aspectRatio: "1", borderRadius: 8, background: "var(--bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <FileText size={16} color="var(--text-500)" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
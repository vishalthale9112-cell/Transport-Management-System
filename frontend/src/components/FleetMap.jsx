import { Truck } from "lucide-react";

// Mumbai-Pune region bounding box for a simple lat/lng -> % projection
const BOUNDS = { minLat: 18.4, maxLat: 19.3, minLng: 72.7, maxLng: 73.95 };

function project(lat, lng) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { left: `${Math.min(96, Math.max(2, x))}%`, top: `${Math.min(94, Math.max(4, y))}%` };
}

const STATUS_COLOR = { Active: "#1abc9c", Maintenance: "#e74c3c", Idle: "#f5a623" };

export default function FleetMap({ vehicles = [] }) {
  return (
    <div
      style={{
        position: "relative",
        height: 320,
        margin: "14px 20px 20px",
        borderRadius: 10,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #dfe9f0 0%, #cfe0e8 40%, #bcd6d1 100%)",
      }}
    >
      {/* faux road/water lines for map texture */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <path d="M0,60 C150,120 300,40 500,100 S700,180 900,120" stroke="#8fb0c2" strokeWidth="3" fill="none" />
        <path d="M40,0 C120,150 60,250 180,320" stroke="#9cc9c0" strokeWidth="10" fill="none" opacity="0.6" />
        <path d="M0,220 C200,260 400,200 620,260 S850,300 950,240" stroke="#a9bcc9" strokeWidth="2" fill="none" />
      </svg>

      {vehicles.map((v) => {
        const pos = project(v.latitude, v.longitude);
        const color = STATUS_COLOR[v.status] || "#0b1e33";
        return (
          <div
            key={v.id}
            title={`${v.registration_number} — ${v.status}`}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: "3px 7px",
                fontSize: 10,
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                marginBottom: 3,
                whiteSpace: "nowrap",
              }}
            >
              {v.registration_number}
            </div>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50% 50% 50% 0",
                background: color,
                transform: "rotate(-45deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              }}
            >
              <Truck size={13} color="#fff" style={{ transform: "rotate(45deg)" }} />
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          fontSize: 10,
          color: "#4a5a68",
          background: "rgba(255,255,255,0.8)",
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        Stylized map view — plug in Google Maps / Mapbox for live GPS tiles
      </div>
    </div>
  );
}

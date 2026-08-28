import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLOR = { Active: "#1abc9c", Maintenance: "#e74c3c", Idle: "#f5a623" };

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);border:2px solid #fff;
    ">
      <div style="transform:rotate(45deg);width:10px;height:10px;background:#fff;border-radius:2px;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function RealMap({ vehicles = [], onSelect, height = 420 }) {
  const center = vehicles.length
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : [19.076, 72.8777];

  return (
    <div style={{ height, borderRadius: 10, overflow: "hidden" }}>
      <MapContainer center={center} zoom={9} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={makeIcon(STATUS_COLOR[v.status] || "#0b1e33")}
            eventHandlers={{ click: () => onSelect && onSelect(v) }}
          >
            <Popup>
              <b>{v.registration_number}</b>
              <br />
              {v.status} · {v.trip_progress}% trip
              <br />
              {v.driver ? v.driver.name : "Unassigned"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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

function makePinIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);border:2px solid #fff;
      font-size:11px;font-weight:800;color:#fff;
    "><span style="transform:rotate(45deg);">${label}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

export default function RealMap({ vehicles = [], onSelect, height = 420, route = null }) {
  const center = route
    ? route.origin
    : vehicles.length
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : [19.076, 72.8777];

  return (
    <div style={{ height, borderRadius: 10, overflow: "hidden" }}>
      <MapContainer center={center} zoom={route ? 7 : 9} style={{ height: "100%", width: "100%" }}>
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

        {route && (
          <>
            <Marker position={route.origin} icon={makePinIcon("#1abc9c", "A")}>
              <Popup>{route.originName}</Popup>
            </Marker>
            <Marker position={route.destination} icon={makePinIcon("#e74c3c", "B")}>
              <Popup>{route.destinationName}</Popup>
            </Marker>
            <Polyline
              positions={[route.origin, route.destination]}
              pathOptions={{ color: "#0b1e33", weight: 4, dashArray: "8 6" }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
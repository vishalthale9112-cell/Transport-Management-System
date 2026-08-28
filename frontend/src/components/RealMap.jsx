import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function makePinIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;
        height:32px;
        border-radius:50% 50% 50% 0;
        background:${color};
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,.35);
        color:white;
        font-weight:800;
      ">
        <span style="transform:rotate(45deg)">
          ${label}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/* ANY Indian village / city search */
async function geocodePlace(placeName) {
  if (!placeName) return null;

  const clean = placeName
    .replace(/,+$/, "")
    .trim();

  /* First try Photon */
  try {
    const photonURL =
      `https://photon.komoot.io/api/` +
      `?q=${encodeURIComponent(clean + ", India")}` +
      `&limit=1`;

    const response = await fetch(photonURL);

    if (response.ok) {
      const data = await response.json();

      if (
        data.features &&
        data.features.length > 0
      ) {
        const coordinates =
          data.features[0].geometry.coordinates;

        return [
          coordinates[1],
          coordinates[0],
        ];
      }
    }
  } catch (error) {
    console.log("Photon failed:", error);
  }

  /* Fallback OpenStreetMap */
  try {
    const osmURL =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json` +
      `&countrycodes=in` +
      `&limit=1` +
      `&q=${encodeURIComponent(clean)}`;

    const response = await fetch(osmURL);

    if (response.ok) {
      const data = await response.json();

      if (data.length > 0) {
        return [
          Number(data[0].lat),
          Number(data[0].lon),
        ];
      }
    }
  } catch (error) {
    console.log("OSM failed:", error);
  }

  return null;
}

function FitRoute({ roadPath }) {
  const map = useMap();

  useEffect(() => {
    if (!roadPath || roadPath.length < 2) return;

    try {
      map.fitBounds(roadPath, {
        padding: [35, 35],
      });
    } catch (error) {
      console.log(error);
    }
  }, [roadPath, map]);

  return null;
}

export default function RealMap({
  height = 420,
  route = null,
}) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] =
    useState(null);

  const [roadPath, setRoadPath] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    setOrigin(null);
    setDestination(null);
    setRoadPath(null);
    setError("");

    if (
      !route?.originName ||
      !route?.destinationName
    ) {
      return;
    }

    const loadRoute = async () => {
      setLoading(true);

      const originName =
        route.originName.trim();

      const destinationName =
        route.destinationName.trim();

      console.log(
        "Finding route:",
        originName,
        "→",
        destinationName
      );

      /* Find Origin */
      const originCoords =
        await geocodePlace(originName);

      console.log(
        "Origin coordinates:",
        originCoords
      );

      if (!originCoords) {
        if (!cancelled) {
          setError(
            `${originName} location सापडले नाही`
          );
          setLoading(false);
        }

        return;
      }

      /* Small delay for geocoder */
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      /* Find Destination */
      const destinationCoords =
        await geocodePlace(destinationName);

      console.log(
        "Destination coordinates:",
        destinationCoords
      );

      if (!destinationCoords) {
        if (!cancelled) {
          setError(
            `${destinationName} location सापडले नाही`
          );
          setLoading(false);
        }

        return;
      }

      if (cancelled) return;

      setOrigin(originCoords);
      setDestination(destinationCoords);

      const [oLat, oLng] =
        originCoords;

      const [dLat, dLng] =
        destinationCoords;

      const routeURL =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${oLng},${oLat};${dLng},${dLat}` +
        `?overview=full` +
        `&geometries=geojson`;

      console.log(
        "Requesting road route..."
      );

      try {
        const response =
          await fetch(routeURL);

        const data =
          await response.json();

        console.log(
          "OSRM response:",
          data
        );

        if (
          data.code === "Ok" &&
          data.routes &&
          data.routes.length > 0
        ) {
          const path =
            data.routes[0].geometry.coordinates.map(
              ([lng, lat]) => [
                lat,
                lng,
              ]
            );

          if (!cancelled) {
            setRoadPath(path);
            setError("");
          }
        } else {
          /* Straight line fallback */
          if (!cancelled) {
            setRoadPath([
              originCoords,
              destinationCoords,
            ]);

            setError(
              "Road route unavailable - showing direct route"
            );
          }
        }
      } catch (error) {
        console.log(
          "Route API error:",
          error
        );

        if (!cancelled) {
          setRoadPath([
            originCoords,
            destinationCoords,
          ]);
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    route?.originName,
    route?.destinationName,
  ]);

  return (
    <div
      style={{
        height,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            top: 12,
            left: "50%",
            transform:
              "translateX(-50%)",
            background: "white",
            padding: "8px 15px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
          Finding road route...
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            bottom: 15,
            left: "50%",
            transform:
              "translateX(-50%)",
            background: "white",
            padding: "8px 15px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
          {error}
        </div>
      )}

      <MapContainer
        center={[19.7515, 75.7139]}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRoute
          roadPath={roadPath}
        />

        {origin && (
          <Marker
            position={origin}
            icon={makePinIcon(
              "#16a085",
              "A"
            )}
          >
            <Popup>
              <strong>
                Starting Point
              </strong>
              <br />

              {route?.originName}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={destination}
            icon={makePinIcon(
              "#e74c3c",
              "B"
            )}
          >
            <Popup>
              <strong>
                Destination
              </strong>
              <br />

              {route?.destinationName}
            </Popup>
          </Marker>
        )}

        {roadPath &&
          roadPath.length > 1 && (
            <Polyline
              positions={roadPath}
              pathOptions={{
                color: "#2563eb",
                weight: 6,
                opacity: 0.9,
              }}
            />
          )}
      </MapContainer>
    </div>
  );
}
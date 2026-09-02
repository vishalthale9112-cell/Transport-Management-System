import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


const STATUS_COLOR = {
  Active: "#10b981",
  Running: "#10b981",
  Idle: "#f59e0b",
  Maintenance: "#ef4444",
  Stopped: "#f97316",
};


function createPin(color, text) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;
        height:34px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;
        justify-content:center;
        align-items:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
      ">
        <span style="
          transform:rotate(45deg);
          color:white;
          font-weight:800;
          font-size:12px;
        ">
          ${text}
        </span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}


function createVehicleIcon(
  color,
  selected = false
) {
  const size = selected ? 43 : 37;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        border:${selected ? 4 : 3}px solid white;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 4px 13px rgba(0,0,0,.38);
        font-size:${selected ? 21 : 18}px;
      ">
        🚚
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}


async function findLocation(place) {
  if (!place) return null;

  const cleanPlace = place
    .replace(/,+$/, "")
    .trim();

  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      "?format=json" +
      "&limit=1" +
      "&countrycodes=in" +
      `&q=${encodeURIComponent(
        `${cleanPlace}, India`
      )}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      throw new Error(
        "Geocoding request failed"
      );
    }

    const data = await response.json();

    if (
      Array.isArray(data) &&
      data.length > 0
    ) {
      return [
        Number(data[0].lat),
        Number(data[0].lon),
      ];
    }

    return null;
  } catch (error) {
    console.error(
      "Geocode error:",
      cleanPlace,
      error
    );

    return null;
  }
}


function FitMap({ path }) {
  const map = useMap();

  useEffect(() => {
    if (!path?.length) return;

    if (path.length === 1) {
      map.setView(path[0], 13);
    } else {
      map.fitBounds(path, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }

    const resizeTimer = window.setTimeout(
      () => map.invalidateSize(),
      250
    );

    return () => {
      window.clearTimeout(resizeTimer);
    };
  }, [path, map]);

  return null;
}


export default function RealMap({
  vehicles = [],
  selectedVehicle = null,
  onSelect,
  route = null,
  height = 380,
  progressPercent = 0,
  onRouteInfo,
}) {
  const [originCoords, setOriginCoords] =
    useState(null);

  const [
    destinationCoords,
    setDestinationCoords,
  ] = useState(null);

  const [roadPath, setRoadPath] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [distance, setDistance] =
    useState(null);

  const [duration, setDuration] =
    useState(null);


  const validVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          Number.isFinite(
            Number(vehicle.latitude)
          ) &&
          Number.isFinite(
            Number(vehicle.longitude)
          )
      ),
    [vehicles]
  );


  useEffect(() => {
    let cancelled = false;

    setOriginCoords(null);
    setDestinationCoords(null);
    setRoadPath(null);
    setDistance(null);
    setDuration(null);
    setError("");

    if (onRouteInfo) {
      onRouteInfo(null);
    }

    if (
      !route?.originName ||
      !route?.destinationName
    ) {
      setLoading(false);
      return;
    }

    const loadRoute = async () => {
      setLoading(true);

      const originName =
        route.originName.trim();

      const destinationName =
        route.destinationName.trim();

      const origin = await findLocation(
        originName
      );

      if (cancelled) return;

      if (!origin) {
        setError(
          `${originName} location सापडले नाही`
        );
        setLoading(false);
        return;
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 1200)
      );

      const destination =
        await findLocation(destinationName);

      if (cancelled) return;

      if (!destination) {
        setError(
          `${destinationName} location सापडले नाही`
        );
        setLoading(false);
        return;
      }

      setOriginCoords(origin);
      setDestinationCoords(destination);

      const [originLat, originLng] =
        origin;
      const [destinationLat, destinationLng] =
        destination;

      const osrmUrl =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${originLng},${originLat};` +
        `${destinationLng},${destinationLat}` +
        "?overview=full&geometries=geojson";

      try {
        const response = await fetch(osrmUrl);

        if (!response.ok) {
          throw new Error("OSRM failed");
        }

        const data = await response.json();

        if (
          data.code === "Ok" &&
          data.routes?.length
        ) {
          const osrmRoute = data.routes[0];

          const coordinates =
            osrmRoute.geometry.coordinates.map(
              ([lng, lat]) => [lat, lng]
            );

          const distanceKm =
            osrmRoute.distance / 1000;

          const durationMin =
            osrmRoute.duration / 60;

          if (!cancelled) {
            setRoadPath(coordinates);
            setDistance(distanceKm);
            setDuration(durationMin);
            setError("");

            if (onRouteInfo) {
              onRouteInfo({
                distanceKm,
                durationMin,
                originCoordinates: origin,
                destinationCoordinates:
                  destination,
              });
            }
          }
        } else if (!cancelled) {
          setRoadPath([
            origin,
            destination,
          ]);

          setError(
            "Road route मिळाला नाही. Direct line दाखवत आहे."
          );

          if (onRouteInfo) {
            onRouteInfo({
              distanceKm: 0,
              durationMin: 0,
              originCoordinates: origin,
              destinationCoordinates:
                destination,
            });
          }
        }
      } catch (routeError) {
        console.error(
          "OSRM error:",
          routeError
        );

        if (!cancelled) {
          setRoadPath([
            origin,
            destination,
          ]);

          setError(
            "Road service problem. Direct route दाखवत आहे."
          );

          if (onRouteInfo) {
            onRouteInfo({
              distanceKm: 0,
              durationMin: 0,
              originCoordinates: origin,
              destinationCoordinates:
                destination,
            });
          }
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
    onRouteInfo,
  ]);


  const fitPath = useMemo(() => {
    const path = roadPath
      ? [...roadPath]
      : [];

    const selectedLat = Number(
      selectedVehicle?.latitude
    );
    const selectedLng = Number(
      selectedVehicle?.longitude
    );

    if (
      Number.isFinite(selectedLat) &&
      Number.isFinite(selectedLng)
    ) {
      path.push([
        selectedLat,
        selectedLng,
      ]);
    }

    if (!path.length) {
      validVehicles.forEach((vehicle) => {
        path.push([
          Number(vehicle.latitude),
          Number(vehicle.longitude),
        ]);
      });
    }

    return path;
  }, [
    roadPath,
    selectedVehicle?.latitude,
    selectedVehicle?.longitude,
    validVehicles,
  ]);


  return (
    <div
      style={{
        height,
        width: "100%",
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#e5e7eb",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#ffffff",
            padding: "9px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
          Finding route...
        </div>
      )}

      {!loading && distance !== null && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 9999,
            background: "#ffffff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
          🚚 {distance.toFixed(1)} KM
          {duration !== null &&
            ` • ${(duration / 60).toFixed(1)} hrs`}
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 15,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#ffffff",
            color: "#dc2626",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            maxWidth: "90%",
            textAlign: "center",
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
          attribution="© OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMap path={fitPath} />

        {originCoords && (
          <Marker
            position={originCoords}
            icon={createPin(
              "#10b981",
              "A"
            )}
          >
            <Popup>
              <strong>Starting Point</strong>
              <br />
              {route?.originName}
            </Popup>
          </Marker>
        )}

        {destinationCoords && (
          <Marker
            position={destinationCoords}
            icon={createPin(
              "#ef4444",
              "B"
            )}
          >
            <Popup>
              <strong>Destination</strong>
              <br />
              {route?.destinationName}
            </Popup>
          </Marker>
        )}

        {roadPath?.length >= 2 && (
          <Polyline
            positions={roadPath}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.9,
            }}
          />
        )}

        {validVehicles.map((vehicle) => {
          const isSelected =
            Number(selectedVehicle?.id) ===
            Number(vehicle.id);

          const markerColor =
            vehicle.gps_status === "Online"
              ? "#10b981"
              : STATUS_COLOR[vehicle.status] ||
                "#334155";

          return (
            <Marker
              key={vehicle.id}
              position={[
                Number(vehicle.latitude),
                Number(vehicle.longitude),
              ]}
              icon={createVehicleIcon(
                markerColor,
                isSelected
              )}
              eventHandlers={{
                click: () => {
                  if (onSelect) {
                    onSelect(vehicle);
                  }
                },
              }}
            >
              <Popup>
                <strong>
                  {vehicle.registration_number}
                </strong>
                <br />
                GPS: {vehicle.gps_status || "Offline"}
                <br />
                Speed: {Math.round(
                  Number(vehicle.gps_speed || 0)
                )} km/h
                <br />
                Trip: {Math.round(
                  Number(progressPercent || 0)
                )}%
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

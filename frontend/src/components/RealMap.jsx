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


// =====================================
// PIN ICON
// =====================================

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


// =====================================
// GEOCODE LOCATION
// =====================================

async function findLocation(place) {
  if (!place) return null;

  const cleanPlace = place
    .replace(/,+$/, "")
    .trim();

  console.log(
    "Searching location:",
    cleanPlace
  );

  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=json` +
      `&limit=1` +
      `&countrycodes=in` +
      `&q=${encodeURIComponent(
        cleanPlace + ", India"
      )}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });

    console.log(
      "Geocode status:",
      response.status
    );

    if (!response.ok) {
      throw new Error(
        "Geocoding request failed"
      );
    }

    const data = await response.json();

    console.log(
      "Geocode result:",
      cleanPlace,
      data
    );

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


// =====================================
// AUTO FIT MAP
// =====================================

function FitMap({ path }) {
  const map = useMap();

  useEffect(() => {
    if (!path || path.length < 2) {
      return;
    }

    console.log(
      "Fitting map to route..."
    );

    map.fitBounds(path, {
      padding: [40, 40],
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [path, map]);

  return null;
}


// =====================================
// REAL MAP
// =====================================

export default function RealMap({
  route = null,
  height = 380,
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


  // =====================================
  // ROUTE EFFECT
  // =====================================

  useEffect(() => {
    console.log(
      "RealMap mounted / route changed:",
      route
    );

    let cancelled = false;

    setOriginCoords(null);
    setDestinationCoords(null);
    setRoadPath(null);
    setDistance(null);
    setDuration(null);
    setError("");

    if (
      !route ||
      !route.originName ||
      !route.destinationName
    ) {
      console.log(
        "RealMap: route missing"
      );

      setLoading(false);

      return;
    }


    const loadRoute = async () => {
      setLoading(true);

      const originName =
        route.originName.trim();

      const destinationName =
        route.destinationName.trim();

      console.log(
        "================================"
      );

      console.log(
        "ROUTE REQUEST:"
      );

      console.log(
        originName,
        "→",
        destinationName
      );


      // -------------------------------
      // ORIGIN
      // -------------------------------

      const origin =
        await findLocation(
          originName
        );

      if (cancelled) return;

      console.log(
        "Origin coordinates:",
        origin
      );

      if (!origin) {
        setError(
          `${originName} location सापडले नाही`
        );

        setLoading(false);

        return;
      }


      // Nominatim ला थोडा gap
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );


      // -------------------------------
      // DESTINATION
      // -------------------------------

      const destination =
        await findLocation(
          destinationName
        );

      if (cancelled) return;

      console.log(
        "Destination coordinates:",
        destination
      );

      if (!destination) {
        setError(
          `${destinationName} location सापडले नाही`
        );

        setLoading(false);

        return;
      }


      setOriginCoords(origin);

      setDestinationCoords(
        destination
      );


      // -------------------------------
      // OSRM ROAD ROUTE
      // -------------------------------

      const [oLat, oLng] = origin;

      const [dLat, dLng] =
        destination;

      const osrmUrl =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${oLng},${oLat};` +
        `${dLng},${dLat}` +
        "?overview=full" +
        "&geometries=geojson";


      console.log(
        "OSRM URL:",
        osrmUrl
      );


      try {
        const response =
          await fetch(osrmUrl);

        console.log(
          "OSRM status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            "OSRM failed"
          );
        }

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
          const routeInfo =
            data.routes[0];


          const coordinates =
            routeInfo.geometry.coordinates.map(
              ([lng, lat]) => [
                lat,
                lng,
              ]
            );


          if (!cancelled) {
            console.log(
              "Road path points:",
              coordinates.length
            );

            setRoadPath(
              coordinates
            );


            const km =
              routeInfo.distance /
              1000;

            setDistance(
              km.toFixed(1)
            );


            const hours =
              routeInfo.duration /
              3600;

            setDuration(
              hours.toFixed(1)
            );


            setError("");
          }
        } else {
          console.log(
            "No road route returned"
          );

          if (!cancelled) {
            setRoadPath([
              origin,
              destination,
            ]);

            setError(
              "Road route मिळाला नाही. Direct line दाखवत आहे."
            );
          }
        }
      } catch (error) {
        console.error(
          "OSRM ERROR:",
          error
        );


        if (!cancelled) {
          // कमीत कमी A → B line
          setRoadPath([
            origin,
            destination,
          ]);

          setError(
            "Road service problem. Direct route दाखवत आहे."
          );
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


  // =====================================
  // UI
  // =====================================

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

      {/* LOADING */}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform:
              "translateX(-50%)",
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


      {/* DISTANCE */}

      {!loading &&
        distance && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 9999,
              background:
                "#ffffff",
              padding:
                "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              boxShadow:
                "0 2px 10px rgba(0,0,0,.2)",
            }}
          >
            🚚 {distance} KM

            {duration &&
              ` • ${duration} hrs`}
          </div>
        )}


      {/* ERROR */}

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 15,
            left: "50%",
            transform:
              "translateX(-50%)",
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


      {/* MAP */}

      <MapContainer
        center={[
          19.7515,
          75.7139,
        ]}
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


        <FitMap
          path={roadPath}
        />


        {/* START */}

        {originCoords && (
          <Marker
            position={originCoords}
            icon={createPin(
              "#10b981",
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


        {/* DESTINATION */}

        {destinationCoords && (
          <Marker
            position={
              destinationCoords
            }
            icon={createPin(
              "#ef4444",
              "B"
            )}
          >
            <Popup>
              <strong>
                Destination
              </strong>

              <br />

              {
                route?.destinationName
              }
            </Popup>
          </Marker>
        )}

        {/* BLUE ROUTE */}

        {roadPath &&
          roadPath.length >= 2 && (
            <Polyline
              positions={
                roadPath
              }
              pathOptions={{
                color:
                  "#2563eb",
                weight: 6,
                opacity: 1,
              }}
            />
          )}

      </MapContainer>
    </div>
  );
}
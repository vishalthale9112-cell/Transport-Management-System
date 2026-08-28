import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
<<<<<<< Updated upstream
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function makePinIcon(color, label) {
=======

import L from "leaflet";
import "leaflet/dist/leaflet.css";


// =====================================
// PIN ICON
// =====================================

function createPin(color, text) {
>>>>>>> Stashed changes
  return L.divIcon({
    className: "",
    html: `
      <div style="
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes

  return null;
}

<<<<<<< Updated upstream
export default function RealMap({
  height = 420,
  route = null,
}) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] =
    useState(null);

=======

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

>>>>>>> Stashed changes
  const [roadPath, setRoadPath] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

<<<<<<< Updated upstream
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

=======
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


>>>>>>> Stashed changes
    const loadRoute = async () => {
      setLoading(true);

      const originName =
        route.originName.trim();

      const destinationName =
        route.destinationName.trim();

      console.log(
<<<<<<< Updated upstream
        "Finding route:",
=======
        "================================"
      );

      console.log(
        "ROUTE REQUEST:"
      );

      console.log(
>>>>>>> Stashed changes
        originName,
        "→",
        destinationName
      );

<<<<<<< Updated upstream
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
=======

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
>>>>>>> Stashed changes

        const data =
          await response.json();

        console.log(
          "OSRM response:",
          data
        );

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
        if (
          data.code === "Ok" &&
          data.routes &&
          data.routes.length > 0
        ) {
<<<<<<< Updated upstream
          const path =
            data.routes[0].geometry.coordinates.map(
=======
          const routeInfo =
            data.routes[0];


          const coordinates =
            routeInfo.geometry.coordinates.map(
>>>>>>> Stashed changes
              ([lng, lat]) => [
                lat,
                lng,
              ]
            );

<<<<<<< Updated upstream
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
=======

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
>>>>>>> Stashed changes
            );
          }
        }
      } catch (error) {
<<<<<<< Updated upstream
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

=======
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


>>>>>>> Stashed changes
      if (!cancelled) {
        setLoading(false);
      }
    };

<<<<<<< Updated upstream
    loadRoute();

=======

    loadRoute();


>>>>>>> Stashed changes
    return () => {
      cancelled = true;
    };
  }, [
    route?.originName,
    route?.destinationName,
  ]);
<<<<<<< Updated upstream
=======


  // =====================================
  // UI
  // =====================================
>>>>>>> Stashed changes

  return (
    <div
      style={{
        height,
        width: "100%",
<<<<<<< Updated upstream
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
=======
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#e5e7eb",
      }}
    >

      {/* LOADING */}

>>>>>>> Stashed changes
      {loading && (
        <div
          style={{
            position: "absolute",
<<<<<<< Updated upstream
            zIndex: 9999,
=======
>>>>>>> Stashed changes
            top: 12,
            left: "50%",
            transform:
              "translateX(-50%)",
<<<<<<< Updated upstream
            background: "white",
            padding: "8px 15px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
=======
            zIndex: 9999,
            background: "#ffffff",
            padding: "9px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
>>>>>>> Stashed changes
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
<<<<<<< Updated upstream
          Finding road route...
        </div>
      )}

=======
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

>>>>>>> Stashed changes
      {error && (
        <div
          style={{
            position: "absolute",
<<<<<<< Updated upstream
            zIndex: 9999,
=======
>>>>>>> Stashed changes
            bottom: 15,
            left: "50%",
            transform:
              "translateX(-50%)",
<<<<<<< Updated upstream
            background: "white",
            padding: "8px 15px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
=======
            zIndex: 9999,
            background: "#ffffff",
            color: "#dc2626",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            maxWidth: "90%",
            textAlign: "center",
>>>>>>> Stashed changes
            boxShadow:
              "0 2px 10px rgba(0,0,0,.2)",
          }}
        >
          {error}
        </div>
      )}

<<<<<<< Updated upstream
      <MapContainer
        center={[19.7515, 75.7139]}
=======

      {/* MAP */}

      <MapContainer
        center={[
          19.7515,
          75.7139,
        ]}
>>>>>>> Stashed changes
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
<<<<<<< Updated upstream
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
=======

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
>>>>>>> Stashed changes
              "A"
            )}
          >
            <Popup>
              <strong>
                Starting Point
              </strong>
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
              <br />

              {route?.originName}
            </Popup>
          </Marker>
        )}

<<<<<<< Updated upstream
        {destination && (
          <Marker
            position={destination}
            icon={makePinIcon(
              "#e74c3c",
=======

        {/* DESTINATION */}

        {destinationCoords && (
          <Marker
            position={
              destinationCoords
            }
            icon={createPin(
              "#ef4444",
>>>>>>> Stashed changes
              "B"
            )}
          >
            <Popup>
              <strong>
                Destination
              </strong>
<<<<<<< Updated upstream
              <br />

              {route?.destinationName}
=======

              <br />

              {
                route?.destinationName
              }
>>>>>>> Stashed changes
            </Popup>
          </Marker>
        )}

<<<<<<< Updated upstream
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
=======

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

>>>>>>> Stashed changes
      </MapContainer>
    </div>
  );
}
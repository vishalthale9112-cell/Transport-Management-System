import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  ShieldCheck,
  Truck,
  WifiOff,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

export default function DriverTracking() {
  const { token } = useParams();

  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  const stopLocalTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    setStatus("stopped");
  }, []);

  const sendLocation = useCallback(
    async (position) => {
      const now = Date.now();

      // Backend ला दर 5 सेकंदांनी location पाठवणे
      if (now - lastSentRef.current < 5000) {
        return;
      }

      lastSentRef.current = now;

      const { coords } = position;

      const speedKmph =
        coords.speed !== null
          ? Math.max(coords.speed * 3.6, 0)
          : 0;

      const gpsData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: speedKmph,
        heading:
          coords.heading !== null
            ? coords.heading
            : 0,
      };

      try {
        const response = await fetch(
          `${API_BASE}/gps/update/${token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(gpsData),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "GPS location update failed"
          );
        }

        setLocation(gpsData);
        setLastUpdated(new Date());
        setUpdateCount((count) => count + 1);
        setStatus("tracking");
        setError("");
      } catch (requestError) {
        setStatus("connection-error");

        setError(
          requestError.message ||
            "Backend connection failed"
        );
      }
    },
    [token]
  );

  const startTracking = useCallback(() => {
    setError("");

    if (!token) {
      setStatus("error");
      setError("Invalid GPS tracking link.");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("error");

      setError(
        "Your mobile browser does not support GPS."
      );

      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
    }

    setStatus("waiting-permission");

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        sendLocation,

        (gpsError) => {
          setStatus("error");

          if (gpsError.code === 1) {
            setError(
              "Location permission denied. Mobile Settings madhun Location permission Allow kara."
            );
          } else if (gpsError.code === 2) {
            setError(
              "GPS location unavailable. Mobile GPS ON kara."
            );
          } else if (gpsError.code === 3) {
            setError(
              "GPS timeout. Punha Try kara."
            );
          } else {
            setError(
              "GPS start karta ala nahi."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 20000,
        }
      );
  }, [sendLocation, token]);

  useEffect(() => {
    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, [startTracking]);

  const isTracking = status === "tracking";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg,#071a2c,#0d3044)",
        color: "#ffffff",
        padding: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          padding: 22,
          borderRadius: 22,
          background: "rgba(255,255,255,.1)",
          border: "1px solid rgba(255,255,255,.15)",
          boxShadow: "0 25px 60px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto",
            borderRadius: 18,
            background: "#12b894",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Truck size={34} />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: 23,
            marginBottom: 5,
          }}
        >
          THALE TRANSPORT
        </h1>

        <div
          style={{
            textAlign: "center",
            opacity: 0.72,
            fontSize: 13,
          }}
        >
          Driver Live GPS Tracking
        </div>

        <div
          style={{
            marginTop: 22,
            padding: 17,
            borderRadius: 15,
            background: "rgba(0,0,0,.18)",
            textAlign: "center",
          }}
        >
          {isTracking ? (
            <Radio
              size={44}
              color="#20e1b2"
            />
          ) : status === "starting" ||
            status === "waiting-permission" ? (
            <LoaderCircle
              size={44}
              style={{
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <WifiOff
              size={44}
              color="#ffb44c"
            />
          )}

          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginTop: 10,
            }}
          >
            {isTracking
              ? "Live Tracking चालू आहे"
              : status === "waiting-permission"
              ? "Location permission द्या"
              : status === "stopped"
              ? "Tracking बंद आहे"
              : "GPS connect होत आहे"}
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginTop: 5,
            }}
          >
            हा page उघडा ठेवा आणि mobile GPS ON ठेवा
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "rgba(231,76,60,.2)",
              color: "#ffd4cf",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {location && (
          <div
            style={{
              marginTop: 15,
              display: "grid",
              gap: 10,
            }}
          >
            <InfoRow
              icon={<MapPin size={17} />}
              label="Latitude"
              value={location.latitude.toFixed(6)}
            />

            <InfoRow
              icon={<Navigation size={17} />}
              label="Longitude"
              value={location.longitude.toFixed(6)}
            />

            <InfoRow
              icon={<ShieldCheck size={17} />}
              label="GPS Accuracy"
              value={`${Math.round(
                location.accuracy
              )} metres`}
            />

            <InfoRow
              icon={<Radio size={17} />}
              label="Current Speed"
              value={`${Math.round(
                location.speed
              )} km/h`}
            />

            <InfoRow
              icon={<CheckCircle2 size={17} />}
              label="Updates Sent"
              value={updateCount}
            />

            <InfoRow
              icon={<RefreshCw size={17} />}
              label="Last Updated"
              value={
                lastUpdated
                  ? lastUpdated.toLocaleTimeString(
                      "en-IN"
                    )
                  : "—"
              }
            />
          </div>
        )}

        {!isTracking ? (
          <button
            type="button"
            onClick={startTracking}
            style={buttonStyle}
          >
            <Navigation size={18} />
            Start Live Tracking
          </button>
        ) : (
          <button
            type="button"
            onClick={stopLocalTracking}
            style={{
              ...buttonStyle,
              background: "#e74c3c",
            }}
          >
            Stop Live Tracking
          </button>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: 11,
        borderRadius: 10,
        background: "rgba(255,255,255,.08)",
      }}
    >
      <div style={{ color: "#20e1b2" }}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            opacity: 0.65,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 750,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  width: "100%",
  border: 0,
  borderRadius: 12,
  padding: "13px 15px",
  marginTop: 17,
  cursor: "pointer",
  background: "#12b894",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 8,
};
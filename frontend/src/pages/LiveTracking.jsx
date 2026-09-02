import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Truck,
  Phone,
  Navigation,
  RefreshCw,
  Download,
  Share2,
  MapPin,
  User,
  Gauge,
  Fuel,
  Clock3,
  Satellite,
  Power,
  Route,
  Timer,
  Milestone,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getVehicles,
  getTrips,
  createGpsTracker,
  getLatestGpsLocations,
} from "../api";
import RealMap from "../components/RealMap";

const STATUS_COLOR = {
  Active: "#16a085",
  Running: "#16a085",
  Idle: "#f39c12",
  Maintenance: "#e74c3c",
  Stopped: "#e67e22",
};

export default function LiveTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [gpsError, setGpsError] = useState("");
  const [liveTripInfo, setLiveTripInfo] = useState(null);

  useEffect(() => {
    getVehicles()
      .then((data) => {
        setVehicles(data || []);

        if (data?.length) {
          setSelected(data[0]);
        }
      })
      .catch(console.error);

    getTrips()
      .then((data) => setTrips(data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setRouteInfo(null);
    setLiveTripInfo(null);
  }, [selected?.id]);
  useEffect(() => {
  let cancelled = false;

  const loadLiveGps = async () => {
    try {
      const gpsData =
        await getLatestGpsLocations();

      if (cancelled) return;

      const gpsByVehicle = new Map(
        (gpsData || []).map((gps) => [
          Number(gps.vehicle_id),
          gps,
        ])
      );

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) => {
          const gps = gpsByVehicle.get(
            Number(vehicle.id)
          );

          if (!gps) return vehicle;

          return {
            ...vehicle,
            latitude: Number(gps.latitude),
            longitude: Number(gps.longitude),
            gps_speed: Number(gps.speed || 0),
            gps_accuracy: gps.accuracy,
            gps_heading: gps.heading,
            gps_status: gps.gps_status,
            gps_last_updated: gps.recorded_at,
            today_km: Number(gps.today_km || 0),
            estimated_fuel_liters: Number(
              gps.estimated_fuel_liters || 0
            ),
            estimated_fuel_cost: Number(
              gps.estimated_fuel_cost || 0
            ),
            mileage_kmpl: Number(
              gps.mileage_kmpl || 0
            ),
          };
        })
      );

      setSelected((currentVehicle) => {
        if (!currentVehicle) {
          return currentVehicle;
        }

        const gps = gpsByVehicle.get(
          Number(currentVehicle.id)
        );

        if (!gps) {
          return currentVehicle;
        }

        return {
          ...currentVehicle,
          latitude: Number(gps.latitude),
          longitude: Number(gps.longitude),
          gps_speed: Number(gps.speed || 0),
          gps_accuracy: gps.accuracy,
          gps_heading: gps.heading,
          gps_status: gps.gps_status,
          gps_last_updated: gps.recorded_at,
          today_km: Number(gps.today_km || 0),
          estimated_fuel_liters: Number(
            gps.estimated_fuel_liters || 0
          ),
          estimated_fuel_cost: Number(
            gps.estimated_fuel_cost || 0
          ),
          mileage_kmpl: Number(
            gps.mileage_kmpl || 0
          ),
        };
      });

      if (gpsData?.length) {
        setLastUpdated(new Date());
      }

      setGpsError("");
    } catch (error) {
      if (!cancelled) {
        setGpsError(
          error.message ||
            "Live GPS connection failed"
        );
      }
    }
  };

  // Page उघडताच location घ्या
  loadLiveGps();

  // दर 5 सेकंदांनी नवीन location घ्या
  const gpsInterval = window.setInterval(
    loadLiveGps,
    5000
  );

  return () => {
    cancelled = true;
    window.clearInterval(gpsInterval);
  };
}, []);

  const filteredVehicles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return vehicles;

    return vehicles.filter((vehicle) =>
      (vehicle.registration_number || "")
        .toLowerCase()
        .includes(value)
    );
  }, [vehicles, search]);

  const mapVehicles = filteredVehicles.filter(
    (v) =>
      Number.isFinite(Number(v.latitude)) &&
      Number.isFinite(Number(v.longitude))
  );

  const selectedTrip = useMemo(() => {
    if (!selected) return null;

    const vehicleTrips = trips.filter(
      (trip) => Number(trip.vehicle_id) === Number(selected.id)
    );

    if (!vehicleTrips.length) return null;

    return (
      vehicleTrips.find((trip) =>
        ["ongoing", "active", "running", "in progress"].includes(
          String(trip.status || "").toLowerCase()
        )
      ) || vehicleTrips[0]
    );
  }, [selected, trips]);

  const routeData = useMemo(() => {
    if (!selectedTrip?.origin || !selectedTrip?.destination) {
      return null;
    }

    return {
      originName: selectedTrip.origin,
      destinationName: selectedTrip.destination,
    };
  }, [
    selectedTrip?.origin,
    selectedTrip?.destination,
  ]);

  const savedProgress = Math.max(
    0,
    Math.min(
      100,
      Number(
        selectedTrip?.progress ??
          selectedTrip?.trip_progress ??
          selected?.trip_progress ??
          0
      )
    )
  );

  useEffect(() => {
    const destination =
      routeInfo?.destinationCoordinates;

    const currentLatitude = Number(
      selected?.latitude
    );
    const currentLongitude = Number(
      selected?.longitude
    );

    const destinationLatitude = Number(
      destination?.[0]
    );
    const destinationLongitude = Number(
      destination?.[1]
    );

    const totalKm = Number(
      routeInfo?.distanceKm || 0
    );

    if (
      !selected?.gps_last_updated ||
      !Number.isFinite(currentLatitude) ||
      !Number.isFinite(currentLongitude) ||
      !Number.isFinite(destinationLatitude) ||
      !Number.isFinite(destinationLongitude) ||
      totalKm <= 0
    ) {
      setLiveTripInfo(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    const calculateLiveTrip = async () => {
      const osrmUrl =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${currentLongitude},${currentLatitude};` +
        `${destinationLongitude},${destinationLatitude}` +
        "?overview=false&steps=false";

      try {
        const response = await fetch(osrmUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "Remaining route request failed"
          );
        }

        const data = await response.json();
        const remainingRoute = data.routes?.[0];

        if (!remainingRoute || cancelled) {
          return;
        }

        const remainingKm = Math.max(
          remainingRoute.distance / 1000,
          0
        );

        const remainingMinutes = Math.max(
          remainingRoute.duration / 60,
          0
        );

        const coveredKm = Math.max(
          Math.min(totalKm - remainingKm, totalKm),
          0
        );

        let calculatedProgress = Math.max(
          0,
          Math.min(
            100,
            (coveredKm / totalKm) * 100
          )
        );

        // Within 200 metres means destination reached.
        if (remainingKm <= 0.2) {
          calculatedProgress = 100;
        }

        setLiveTripInfo({
          totalKm,
          coveredKm,
          remainingKm,
          remainingMinutes,
          progress: Math.round(
            calculatedProgress
          ),
        });
      } catch (error) {
        if (
          error.name !== "AbortError" &&
          !cancelled
        ) {
          console.error(
            "Live trip calculation failed:",
            error
          );
        }
      }
    };

    calculateLiveTrip();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    selected?.id,
    selected?.latitude,
    selected?.longitude,
    selected?.gps_last_updated,
    routeInfo?.distanceKm,
    routeInfo?.destinationCoordinates,
  ]);

  const progress =
    liveTripInfo?.progress ?? savedProgress;

  const simulated = useMemo(() => {
    if (!selected) {
      return {
        speed: 0,
        fuelLevel: 0,
        engineStatus: "Off",
        gpsStatus: "Offline",
        driverRest: "—",
      };
    }

    const seed = Number(selected.id) || 1;

    const running =
      ["active", "running"].includes(
        String(selected.status || "").toLowerCase()
      ) || progress > 0;

    return {
      speed:
        selected.gps_speed !== undefined
          ? Math.round(Number(selected.gps_speed) || 0)
          : running
          ? 42 + ((seed * 7) % 24)
          : 0,
      fuelLevel: 34 + ((seed * 13) % 57),
      engineStatus: running ? "Running" : "Off",
      gpsStatus: selected.gps_status || "Offline",
      driverRest: `${30 + ((seed * 11) % 70)} min`,
    };
  }, [selected, progress]);

  const distance = useMemo(() => {
    const totalKm =
      Number(routeInfo?.distanceKm) ||
      Number(selectedTrip?.total_distance) ||
      Number(selectedTrip?.distance) ||
      0;

    const coveredKm =
      liveTripInfo?.coveredKm ??
      totalKm * (progress / 100);

    const remainingKm =
      liveTripInfo?.remainingKm ??
      Math.max(totalKm - coveredKm, 0);

    const totalMinutes =
      Number(routeInfo?.durationMin) ||
      Number(selectedTrip?.duration_min) ||
      0;

    const remainingMinutes =
      liveTripInfo?.remainingMinutes ??
      totalMinutes * ((100 - progress) / 100);

    return {
      totalKm,
      coveredKm,
      remainingKm,
      totalMinutes,
      remainingMinutes,
    };
  }, [
    routeInfo,
    selectedTrip,
    progress,
    liveTripInfo,
  ]);

  const hasLiveGps = Boolean(
    selected?.gps_last_updated
  );

  const todayKm = Number(
    selected?.today_km || 0
  );

  const estimatedFuelCost = hasLiveGps
    ? Number(selected?.estimated_fuel_cost || 0)
    : distance.totalKm > 0
    ? (distance.totalKm / 12) * 92
    : 0;

  const vehiclePhoto =
    selected?.photo_url ||
    selected?.image_url ||
    selected?.vehicle_image ||
    selected?.photo ||
    "";

  const driverPhoto =
    selected?.driver?.photo_url ||
    selected?.driver?.image_url ||
    selected?.driver?.photo ||
    "";

  const driverName =
    selected?.driver?.name ||
    selected?.driver_name ||
    "Driver not assigned";

  const driverPhone =
    selected?.driver?.phone ||
    selected?.driver_phone ||
    "";

  const driverLicense =
    selected?.driver?.license_number ||
    selected?.driver?.license_no ||
    selected?.driver?.license ||
    "—";

  const currentLocation = hasLiveGps
    ? `${Number(selected?.latitude).toFixed(5)}, ${Number(
        selected?.longitude
      ).toFixed(5)}`
    : selected?.current_location ||
    (selectedTrip
      ? progress === 0
        ? selectedTrip.origin
        : progress >= 100
        ? selectedTrip.destination
        : `En route to ${selectedTrip.destination}`
      : "Location unavailable");

  const formatKm = (value) =>
    value > 0 ? `${value.toFixed(1)} km` : "—";

  const formatEta = (minutes) => {
    if (!minutes || minutes <= 0) return "—";

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (!hours) return `${mins} min`;

    return `${hours}h ${mins}m`;
  };

  const refreshLocation = () => {
    setLastUpdated(new Date());
  };

  const callDriver = () => {
    if (!driverPhone) return;

    window.location.href = `tel:${driverPhone}`;
  };

  const openNavigation = () => {
    if (!selectedTrip) return;

    const origin = encodeURIComponent(selectedTrip.origin);
    const destination = encodeURIComponent(
      selectedTrip.destination
    );

    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
      "_blank"
    );
  };

  const copyDriverGpsLink = async () => {
    if (!selected) return;

    try {
      const tracker = await createGpsTracker(
        selected.id
      );

      const trackingLink =
        `${window.location.origin}` +
        `${tracker.driver_tracking_path}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          trackingLink
        );

        alert(
          "Driver GPS link copied successfully."
        );
      } else {
        window.prompt(
          "Copy this driver GPS link:",
          trackingLink
        );
      }
    } catch (error) {
      alert(
        error.message ||
          "Driver GPS link could not be created."
      );
    }
  };

  const shareTracking = async () => {
    const text = selectedTrip
      ? `${selected.registration_number}: ${selectedTrip.origin} to ${selectedTrip.destination} - ${progress}% completed.`
      : `${selected.registration_number} live tracking`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Live Vehicle Tracking",
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `${text}\n${window.location.href}`
        );

        alert("Live tracking link copied.");
      }
    } catch {
      // User cancelled sharing
    }
  };

  const downloadReport = () => {
    if (!selected) return;

    const report = `
THALE TRANSPORT
LIVE TRACKING REPORT

Vehicle: ${selected.registration_number}
Status: ${selected.status || "—"}

Driver: ${driverName}
Driver Mobile: ${driverPhone || "—"}
License Number: ${driverLicense}

Pickup: ${selectedTrip?.origin || "—"}
Destination: ${selectedTrip?.destination || "—"}
Current Location: ${currentLocation}

Trip Progress: ${progress}%
Total Distance: ${formatKm(distance.totalKm)}
Covered Distance: ${formatKm(distance.coveredKm)}
Remaining Distance: ${formatKm(distance.remainingKm)}
ETA: ${formatEta(distance.remainingMinutes)}

Current Speed: ${simulated.speed} km/h
Fuel Level: ${simulated.fuelLevel}%
Engine: ${simulated.engineStatus}
GPS: ${simulated.gpsStatus}
Driver Rest: ${simulated.driverRest}

Today's KM: ${formatKm(todayKm)}
Estimated Fuel Cost: ₹${Math.round(
      estimatedFuelCost
    ).toLocaleString("en-IN")}

Last Updated:
${lastUpdated.toLocaleString("en-IN")}
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `${selected.registration_number}-tracking-report.txt`;

    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="content">
      {/* TOP SEARCH */}

      <div
        className="card"
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Live Fleet Tracking
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              marginTop: 3,
            }}
          >
            Track all transport vehicles across India
          </div>
        </div>

        <div
          className="search-box"
          style={{
            width: 280,
          }}
        >
          <Search size={15} />

          <input
            placeholder="Search vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {gpsError && (
        <div
          style={{
            marginBottom: 12,
            padding: "9px 12px",
            borderRadius: 8,
            background: "#fff3f1",
            border: "1px solid #ffd1cb",
            color: "#b42318",
            fontSize: 11,
            fontWeight: 650,
          }}
        >
          GPS connection: {gpsError}
        </div>
      )}

      {/* MAIN AREA */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "250px minmax(400px, 1fr) 340px",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        {/* LEFT - VEHICLE LIST */}

        <div
          className="card"
          style={{
            padding: 14,
            maxHeight: 610,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            All Vehicles ({filteredVehicles.length})
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
            }}
          >
            {filteredVehicles.map((vehicle) => {
              const active =
                selected?.id === vehicle.id;

              const photo =
                vehicle.photo_url ||
                vehicle.image_url ||
                vehicle.vehicle_image ||
                vehicle.photo;

              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelected(vehicle)}
                  style={{
                    cursor: "pointer",
                    borderRadius: 10,
                    padding: 10,
                    border: active
                      ? "1.5px solid var(--teal-500)"
                      : "1px solid var(--border)",
                    background: active
                      ? "#eaf9f5"
                      : "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "center",
                    }}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={vehicle.registration_number}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 9,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 9,
                          background:
                            STATUS_COLOR[
                              vehicle.status
                            ] || "#123",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Truck
                          size={21}
                          color="#fff"
                        />
                      </div>
                    )}

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 800,
                        }}
                      >
                        {vehicle.registration_number}
                      </div>

                      <div
                        style={{
                          fontSize: 10.5,
                          color: "var(--text-500)",
                          marginTop: 2,
                        }}
                      >
                        {vehicle.driver?.name ||
                          "Unassigned"}
                      </div>

                      <div
                        style={{
                          fontSize: 10.5,
                          color:
                            STATUS_COLOR[
                              vehicle.status
                            ] || "#666",
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                      >
                        ● {vehicle.status || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER MAP */}

        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <RealMap
            vehicles={mapVehicles}
            selectedVehicle={selected}
            onSelect={setSelected}
            height={610}
            route={routeData}
            progressPercent={progress}
            onRouteInfo={setRouteInfo}
          />
        </div>

        {/* RIGHT DETAILS */}

        <div
          className="card"
          style={{
            padding: 16,
            maxHeight: 610,
            overflowY: "auto",
          }}
        >
          {!selected ? (
            <div
              style={{
                textAlign: "center",
                padding: 50,
                color: "var(--text-500)",
              }}
            >
              Select a vehicle
            </div>
          ) : (
            <>
              {/* VEHICLE PHOTO */}

              {vehiclePhoto ? (
                <img
                  src={vehiclePhoto}
                  alt={selected.registration_number}
                  style={{
                    width: "100%",
                    height: 140,
                    borderRadius: 12,
                    objectFit: "cover",
                    marginBottom: 12,
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 125,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg,#eaf9f5,#eef4ff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Truck
                    size={55}
                    color="var(--teal-600)"
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                    }}
                  >
                    {selected.registration_number}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-500)",
                      marginTop: 3,
                    }}
                  >
                    {selected.vehicle_type || "Vehicle"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    padding: "5px 9px",
                    height: "fit-content",
                    borderRadius: 20,
                    background: "#eaf9f5",
                    color:
                      STATUS_COLOR[selected.status] ||
                      "var(--teal-600)",
                    fontWeight: 800,
                  }}
                >
                  ● {selected.status || "Unknown"}
                </div>
              </div>

              {/* DRIVER */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginTop: 15,
                  padding: 10,
                  background: "var(--bg)",
                  borderRadius: 10,
                }}
              >
                {driverPhoto ? (
                  <img
                    src={driverPhoto}
                    alt={driverName}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "var(--navy-900)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={19} />
                  </div>
                )}

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                    }}
                  >
                    {driverName}
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--text-500)",
                    }}
                  >
                    {driverPhone || "Mobile unavailable"}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-500)",
                    }}
                  >
                    License: {driverLicense}
                  </div>
                </div>
              </div>

              {/* ROUTE */}

              <SectionTitle title="Current Trip" />

              <InfoRow
                icon={<MapPin size={14} />}
                label="Current Location"
                value={currentLocation}
              />

              <InfoRow
                icon={<Route size={14} />}
                label="Pickup"
                value={selectedTrip?.origin || "No active trip"}
              />

              <InfoRow
                icon={<Navigation size={14} />}
                label="Destination"
                value={selectedTrip?.destination || "—"}
              />

              {/* PROGRESS */}

              <div
                style={{
                  marginTop: 13,
                  marginBottom: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  <span>
                    Trip Progress
                    {liveTripInfo ? " (Live GPS)" : ""}
                  </span>

                  <strong>{progress}%</strong>
                </div>

                <div
                  style={{
                    height: 7,
                    background: "#e8edf2",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "var(--teal-500)",
                    }}
                  />
                </div>
              </div>

              {/* DISTANCE */}

              <SectionTitle title="Trip Information" />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <MiniStat
                  label="Total KM"
                  value={formatKm(distance.totalKm)}
                />

                <MiniStat
                  label="Covered"
                  value={formatKm(distance.coveredKm)}
                />

                <MiniStat
                  label="Remaining"
                  value={formatKm(distance.remainingKm)}
                />

                <MiniStat
                  label="ETA"
                  value={formatEta(
                    distance.remainingMinutes
                  )}
                />
              </div>

              {/* TELEMATICS */}

              <SectionTitle title="Live Vehicle Status" />

              <InfoRow
                icon={<Gauge size={14} />}
                label="Current Speed"
                value={`${simulated.speed} km/h`}
              />

              <InfoRow
                icon={<Fuel size={14} />}
                label="Fuel Level"
                value={`${simulated.fuelLevel}%`}
              />

              <InfoRow
                icon={<Power size={14} />}
                label="Engine Status"
                value={simulated.engineStatus}
              />

              <InfoRow
                icon={<Satellite size={14} />}
                label="GPS Status"
                value={simulated.gpsStatus}
              />

              <InfoRow
                icon={<Timer size={14} />}
                label="Driver Rest"
                value={simulated.driverRest}
              />

              <InfoRow
                icon={<Milestone size={14} />}
                label="Today's Total KM"
                value={
                  hasLiveGps
                    ? `${todayKm.toFixed(2)} km`
                    : "—"
                }
              />

              <InfoRow
                icon={<Fuel size={14} />}
                label="Estimated Fuel Cost"
                value={
                  hasLiveGps || estimatedFuelCost
                    ? `₹${Math.round(
                        estimatedFuelCost
                      ).toLocaleString("en-IN")}`
                    : "—"
                }
              />

              <InfoRow
                icon={<Clock3 size={14} />}
                label="Last Updated"
                value={lastUpdated.toLocaleTimeString(
                  "en-IN"
                )}
              />

              {/* BUTTONS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 7,
                  marginTop: 15,
                }}
              >
                <ActionButton
                  icon={<Phone size={13} />}
                  text="Call Driver"
                  onClick={callDriver}
                />

                <ActionButton
                  icon={<RefreshCw size={13} />}
                  text="Refresh"
                  onClick={refreshLocation}
                />

                <ActionButton
                  icon={<Navigation size={13} />}
                  text="Navigate"
                  onClick={openNavigation}
                />

                <ActionButton
                  icon={<Share2 size={13} />}
                  text="Share Live"
                  onClick={shareTracking}
                />
              </div>

              <button
                type="button"
                onClick={copyDriverGpsLink}
                style={{
                  width: "100%",
                  marginTop: 8,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 8px",
                  cursor: "pointer",
                  background: "#16a085",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <Satellite size={14} />
                Copy Driver GPS Link
              </button>

              <button
                onClick={downloadReport}
                className="btn-primary"
                style={{
                  width: "100%",
                  marginTop: 8,
                  justifyContent: "center",
                }}
              >
                <Download size={13} />
                Download Tracking Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM */}

      {selected && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 14,
            marginTop: 16,
          }}
        >
          {/* TIMELINE */}

          <div className="card">
            <div className="card-title">
              Route History / Trip Timeline
            </div>

            {!selectedTrip ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-500)",
                }}
              >
                No trip assigned to this vehicle.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 15,
                  alignItems: "center",
                  paddingTop: 8,
                }}
              >
                <TimelineItem
                  title={selectedTrip.origin}
                  subtitle="Trip started"
                  done
                />

                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background:
                      progress > 0
                        ? "var(--teal-500)"
                        : "#dce3e9",
                  }}
                />

                <TimelineItem
                  title="Current Position"
                  subtitle={`${progress}% completed`}
                  done={progress > 0}
                />

                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background:
                      progress >= 100
                        ? "var(--teal-500)"
                        : "#dce3e9",
                  }}
                />

                <TimelineItem
                  title={selectedTrip.destination}
                  subtitle={
                    progress >= 100
                      ? "Reached"
                      : "Destination"
                  }
                  done={progress >= 100}
                />
              </div>
            )}
          </div>

          {/* ALERTS */}

          <div className="card">
            <div className="card-title">
              Live Alerts
            </div>

            <AlertRow
              good={simulated.gpsStatus === "Online"}
              text={`GPS connection ${simulated.gpsStatus.toLowerCase()}`}
            />

            <AlertRow
              good={
                simulated.engineStatus === "Running"
              }
              text={`Engine ${simulated.engineStatus}`}
            />

            <AlertRow
              good={simulated.fuelLevel > 20}
              text={
                simulated.fuelLevel > 20
                  ? `Fuel level normal (${simulated.fuelLevel}%)`
                  : "Low fuel warning"
              }
            />

            <AlertRow
              good={simulated.speed <= 80}
              text={
                simulated.speed <= 80
                  ? "Vehicle speed normal"
                  : "Overspeed detected"
              }
            />
          </div>
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          color: "var(--text-500)",
          marginTop: 8,
        }}
      >
        GPS location, GPS status and speed use driver mobile data.
        Fuel level, engine status and driver-rest values are currently
        demo telemetry.
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        marginTop: 15,
        marginBottom: 8,
        color: "var(--text-500)",
        textTransform: "uppercase",
        letterSpacing: ".4px",
      }}
    >
      {title}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 29,
          height: 29,
          borderRadius: 7,
          background: "var(--bg)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--teal-600)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            color: "var(--text-500)",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div
      style={{
        padding: 9,
        borderRadius: 8,
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: "var(--text-500)",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({ icon, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid var(--border)",
        background: "#fff",
        borderRadius: 8,
        padding: "8px 6px",
        cursor: "pointer",
        fontSize: 10.5,
        fontWeight: 700,
        display: "flex",
        gap: 5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

function TimelineItem({
  title,
  subtitle,
  done,
}) {
  return (
    <div
      style={{
        minWidth: 120,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          margin: "0 auto 7px",
          background: done
            ? "var(--teal-500)"
            : "#dce3e9",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MapPin size={13} />
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 9.5,
          color: "var(--text-500)",
          marginTop: 2,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function AlertRow({ good, text }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {good ? (
        <CheckCircle2
          size={15}
          color="#16a085"
        />
      ) : (
        <AlertTriangle
          size={15}
          color="#e74c3c"
        />
      )}

      {text}
    </div>
  );
}

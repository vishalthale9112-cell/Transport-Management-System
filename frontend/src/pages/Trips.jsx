import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  MapPin,
} from "lucide-react";

import {
  getTrips,
  createTrip,
  getVehicles,
} from "../api";

import RealMap from "../components/RealMap";

export default function Trips() {
  const [trips, setTrips] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] =
    useState({
      vehicle_id: "",
      origin: "",
      destination: "",
    });

  // ================================
  // LOAD TRIPS
  // ================================

  const loadTrips = async (
    preferredTripId = null
  ) => {
    try {
      const data =
        await getTrips();

      const list =
        Array.isArray(data)
          ? data
          : [];

      setTrips(list);

      if (list.length === 0) {
        setSelectedTrip(null);
        return;
      }

      // Newly created trip select
      if (preferredTripId) {
        const found =
          list.find(
            (trip) =>
              trip.id ===
              preferredTripId
          );

        if (found) {
          setSelectedTrip(found);
          return;
        }
      }

      // Keep currently selected trip
      if (selectedTrip) {
        const existing =
          list.find(
            (trip) =>
              trip.id ===
              selectedTrip.id
          );

        if (existing) {
          setSelectedTrip(existing);
          return;
        }
      }

      // Otherwise first trip
      setSelectedTrip(list[0]);
    } catch (error) {
      console.error(
        "Trips load error:",
        error
      );
    }
  };

  // ================================
  // INITIAL LOAD
  // ================================

  useEffect(() => {
    loadTrips();

    getVehicles()
      .then((data) => {
        setVehicles(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((error) => {
        console.error(
          "Vehicles load error:",
          error
        );
      });
  }, []);

  // ================================
  // CREATE NEW TRIP
  // ================================

  const handleAdd = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.vehicle_id) {
      setFormError(
        "Please select vehicle."
      );
      return;
    }

    if (!form.origin.trim()) {
      setFormError(
        "Please enter origin."
      );
      return;
    }

    if (!form.destination.trim()) {
      setFormError(
        "Please enter destination."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vehicle_id:
          Number(form.vehicle_id),

        origin:
          form.origin.trim(),

        destination:
          form.destination.trim(),
      };

      console.log(
        "Creating trip:",
        payload
      );

      const createdTrip =
        await createTrip(payload);

      console.log(
        "Created trip:",
        createdTrip
      );

      setForm({
        vehicle_id: "",
        origin: "",
        destination: "",
      });

      setShowForm(false);

      await loadTrips(
        createdTrip?.id || null
      );

      // If API doesn't return ID,
      // get latest trip and select matching one
      if (!createdTrip?.id) {
        try {
          const latestTrips =
            await getTrips();

          if (
            Array.isArray(
              latestTrips
            )
          ) {
            setTrips(latestTrips);

            const matchingTrip =
              [...latestTrips]
                .reverse()
                .find(
                  (trip) =>
                    trip.origin
                      ?.trim()
                      .toLowerCase() ===
                      payload.origin
                        .toLowerCase() &&
                    trip.destination
                      ?.trim()
                      .toLowerCase() ===
                      payload.destination
                        .toLowerCase()
                );

            if (matchingTrip) {
              setSelectedTrip(
                matchingTrip
              );
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.error(
        "Create trip error:",
        error
      );

      setFormError(
        "Trip save झाला नाही. Backend check करा."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // VEHICLE NAME
  // ================================

  const vehicleName = (id) => {
    const vehicle =
      vehicles.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );

    if (vehicle) {
      return (
        vehicle.registration_number ||
        `Vehicle #${id}`
      );
    }

    return `Vehicle #${id}`;
  };

  // ================================
  // ROUTE DATA
  // ================================

  const routeFor = (trip) => {
    if (!trip) {
      return null;
    }

    return {
      originName:
        trip.origin || "",

      destinationName:
        trip.destination || "",
    };
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="content">
      <div className="grid-2">

        {/* ========================= */}
        {/* ROUTE MAP */}
        {/* ========================= */}

        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="card-title"
            style={{
              padding:
                "16px 20px 0",
            }}
          >
            {selectedTrip
              ? `${selectedTrip.origin} → ${selectedTrip.destination}`
              : "Route Map"}
          </div>

          <div
            style={{
              margin:
                "14px 20px 20px",
            }}
          >
            <RealMap
              key={
                selectedTrip?.id ||
                "no-trip"
              }
              route={
                selectedTrip
                  ? routeFor(
                      selectedTrip
                    )
                  : null
              }
              height={380}
            />
          </div>
        </div>

        {/* ========================= */}
        {/* TRIPS LIST */}
        {/* ========================= */}

        <div className="card">

          <div className="card-title">
            <span>
              Trips
            </span>

            <button
              className="btn-primary"
              onClick={() => {
                setShowForm(
                  (current) =>
                    !current
                );

                setFormError("");
              }}
            >
              <Plus size={14} />

              New Trip
            </button>
          </div>

          {/* ======================= */}
          {/* NEW TRIP FORM */}
          {/* ======================= */}

          {showForm && (
            <form
              onSubmit={handleAdd}
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 10,
                marginBottom: 18,
                padding: 14,
                border:
                  "1px solid var(--border)",
                borderRadius: 10,
                background:
                  "#fafbfc",
              }}
            >

              {/* Vehicle */}

              <select
                value={
                  form.vehicle_id
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    vehicle_id:
                      e.target.value,
                  })
                }
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border:
                    "1px solid var(--border)",
                  fontSize: 13,
                  background:
                    "white",
                }}
              >
                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={
                        vehicle.id
                      }
                      value={
                        vehicle.id
                      }
                    >
                      {vehicle.registration_number}
                    </option>
                  )
                )}
              </select>

              {/* Origin */}

              <input
                type="text"
                placeholder="Origin - e.g. Jalna"
                value={
                  form.origin
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    origin:
                      e.target.value,
                  })
                }
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border:
                    "1px solid var(--border)",
                  fontSize: 13,
                }}
              />

              {/* Destination */}

              <input
                type="text"
                placeholder="Destination - e.g. Akole"
                value={
                  form.destination
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    destination:
                      e.target.value,
                  })
                }
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border:
                    "1px solid var(--border)",
                  fontSize: 13,
                }}
              />

              {/* Error */}

              {formError && (
                <div
                  style={{
                    color:
                      "#dc2626",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Trip"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(
                      false
                    );

                    setFormError(
                      ""
                    );
                  }}
                  style={{
                    padding:
                      "8px 14px",
                    borderRadius: 8,
                    border:
                      "1px solid var(--border)",
                    background:
                      "white",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* ======================= */}
          {/* TRIP ITEMS */}
          {/* ======================= */}

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 8,
            }}
          >
            {trips.map((trip) => {
              const isSelected =
                selectedTrip?.id ===
                trip.id;

              return (
                <div
                  key={trip.id}
                  onClick={() =>
                    setSelectedTrip(
                      trip
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    padding:
                      "12px 14px",
                    borderRadius: 10,
                    cursor:
                      "pointer",

                    border:
                      isSelected
                        ? "1.5px solid #1abc9c"
                        : "1px solid var(--border)",

                    background:
                      isSelected
                        ? "#e5f8f3"
                        : "#ffffff",

                    transition:
                      "0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight:
                          700,
                        fontSize:
                          13,
                        marginBottom:
                          5,
                      }}
                    >
                      {vehicleName(
                        trip.vehicle_id
                      )}
                    </div>

                    <div
                      style={{
                        fontSize:
                          12,
                        color:
                          "var(--text-500)",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 5,
                      }}
                    >
                      <MapPin
                        size={13}
                      />

                      {trip.origin}

                      {" → "}

                      {trip.destination}
                    </div>
                  </div>

                  <span
                    className="status-pill status-active"
                  >
                    {trip.status ||
                      "Active"}
                  </span>
                </div>
              );
            })}

            {trips.length ===
              0 && (
              <div
                style={{
                  textAlign:
                    "center",
                  color:
                    "var(--text-500)",
                  padding: 30,
                  fontSize: 13,
                }}
              >
                No trips yet.
                <br />
                New Trip वरून
                trip तयार करा.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
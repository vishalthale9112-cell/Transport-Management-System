<<<<<<< Updated upstream
import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  MapPin,
=======
import { useEffect, useState } from "react";
import {
  Plus,
  MapPin,
  Trash2,
>>>>>>> Stashed changes
} from "lucide-react";

import {
  getTrips,
  createTrip,
  getVehicles,
<<<<<<< Updated upstream
=======
  deleteTrip,
>>>>>>> Stashed changes
} from "../api";

import RealMap from "../components/RealMap";

export default function Trips() {
<<<<<<< Updated upstream
  const [trips, setTrips] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState(null);
=======
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [selectedTrip, setSelectedTrip] =
    useState(null);
>>>>>>> Stashed changes

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

<<<<<<< Updated upstream
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
=======
  const [deletingId, setDeletingId] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    vehicle_id: "",
    origin: "",
    destination: "",
  });

  // ==========================================
  // LOAD TRIPS
  // ==========================================
>>>>>>> Stashed changes

  const loadTrips = async (
    preferredTripId = null
  ) => {
    try {
<<<<<<< Updated upstream
      const data =
        await getTrips();

      const list =
        Array.isArray(data)
          ? data
          : [];
=======
      const data = await getTrips();

      const list = Array.isArray(data)
        ? data
        : [];

      console.log("Trips loaded:", list);
>>>>>>> Stashed changes

      setTrips(list);

      if (list.length === 0) {
        setSelectedTrip(null);
        return;
      }

<<<<<<< Updated upstream
      // Newly created trip select
      if (preferredTripId) {
        const found =
          list.find(
            (trip) =>
              trip.id ===
              preferredTripId
          );
=======
      if (preferredTripId) {
        const found = list.find(
          (trip) =>
            Number(trip.id) ===
            Number(preferredTripId)
        );
>>>>>>> Stashed changes

        if (found) {
          setSelectedTrip(found);
          return;
        }
      }

<<<<<<< Updated upstream
      // Keep currently selected trip
      if (selectedTrip) {
        const existing =
          list.find(
            (trip) =>
              trip.id ===
              selectedTrip.id
          );
=======
      if (selectedTrip) {
        const existing = list.find(
          (trip) =>
            Number(trip.id) ===
            Number(selectedTrip.id)
        );
>>>>>>> Stashed changes

        if (existing) {
          setSelectedTrip(existing);
          return;
        }
      }

<<<<<<< Updated upstream
      // Otherwise first trip
=======
>>>>>>> Stashed changes
      setSelectedTrip(list[0]);
    } catch (error) {
      console.error(
        "Trips load error:",
        error
      );
    }
  };

<<<<<<< Updated upstream
  // ================================
  // INITIAL LOAD
  // ================================
=======
  // ==========================================
  // INITIAL LOAD
  // ==========================================
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
      });
  }, []);

  // ================================
  // CREATE NEW TRIP
  // ================================
=======

        setVehicles([]);
      });
  }, []);

  // ==========================================
  // CREATE TRIP
  // ==========================================
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
    if (
      form.origin.trim().toLowerCase() ===
      form.destination.trim().toLowerCase()
    ) {
      setFormError(
        "Origin and destination cannot be same."
      );
      return;
    }

>>>>>>> Stashed changes
    try {
      setSaving(true);

      const payload = {
<<<<<<< Updated upstream
        vehicle_id:
          Number(form.vehicle_id),

        origin:
          form.origin.trim(),

        destination:
          form.destination.trim(),
=======
        vehicle_id: Number(
          form.vehicle_id
        ),
        origin: form.origin.trim(),
        destination:
          form.destination.trim(),
        progress: 0,
        status: "Ongoing",
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

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
=======
>>>>>>> Stashed changes
    } catch (error) {
      console.error(
        "Create trip error:",
        error
      );

      setFormError(
<<<<<<< Updated upstream
        "Trip save झाला नाही. Backend check करा."
=======
        error?.response?.data?.detail
          ? String(
              error.response.data.detail
            )
          : "Trip save झाला नाही."
>>>>>>> Stashed changes
      );
    } finally {
      setSaving(false);
    }
  };

<<<<<<< Updated upstream
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
=======
  // ==========================================
  // DELETE TRIP
  // ==========================================

  const handleDeleteTrip = async (
    trip
  ) => {
    const confirmDelete =
      window.confirm(
        `${trip.origin} → ${trip.destination} हा trip delete करायचा आहे का?`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(trip.id);

      await deleteTrip(trip.id);

      console.log(
        "Trip deleted:",
        trip.id
      );

      const updatedTrips =
        trips.filter(
          (item) =>
            Number(item.id) !==
            Number(trip.id)
        );

      setTrips(updatedTrips);

      if (
        Number(selectedTrip?.id) ===
        Number(trip.id)
      ) {
        setSelectedTrip(
          updatedTrips.length > 0
            ? updatedTrips[0]
            : null
        );
      }
    } catch (error) {
      console.error(
        "Delete trip error:",
        error
      );

      alert(
        "Trip delete झाला नाही."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // VEHICLE NAME
  // ==========================================

  const vehicleName = (
    vehicleId
  ) => {
    const vehicle =
      vehicles.find(
        (item) =>
          Number(item.id) ===
          Number(vehicleId)
      );

    if (!vehicle) {
      return `Vehicle #${vehicleId}`;
    }

    return (
      vehicle.registration_number ||
      `Vehicle #${vehicleId}`
    );
  };

  // ==========================================
  // ROUTE
  // ==========================================
>>>>>>> Stashed changes

  const routeFor = (trip) => {
    if (!trip) {
      return null;
    }

    return {
      originName:
        trip.origin || "",
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
      destinationName:
        trip.destination || "",
    };
  };

<<<<<<< Updated upstream
  // ================================
  // UI
  // ================================
=======
  // ==========================================
  // UI
  // ==========================================
>>>>>>> Stashed changes

  return (
    <div className="content">
      <div className="grid-2">

<<<<<<< Updated upstream
        {/* ========================= */}
        {/* ROUTE MAP */}
        {/* ========================= */}
=======
        {/* MAP */}
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
                selectedTrip?.id ||
                "no-trip"
=======
                selectedTrip
                  ? `trip-${selectedTrip.id}-${selectedTrip.origin}-${selectedTrip.destination}`
                  : "no-trip"
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
        {/* TRIPS */}

        <div className="card">
          <div className="card-title">
            <span>Trips</span>

            <button
              type="button"
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

          {/* NEW TRIP FORM */}

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
                    "#ffffff",
                }}
              >
                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {
                        vehicle.registration_number
                      }
                    </option>
                  )
                )}
              </select>

              <input
                type="text"
                placeholder="Origin - e.g. Jalna"
                value={form.origin}
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
                  type="submit"
                  className="btn-primary"
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
                      "#ffffff",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TRIP LIST */}

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
                Number(
                  selectedTrip?.id
                ) ===
                Number(trip.id);

              return (
                <div
                  key={trip.id}
                  onClick={() => {
                    console.log(
                      "Trip selected:",
                      trip
                    );

                    setSelectedTrip({
                      ...trip,
                    });
                  }}
                  style={{
                    width: "100%",
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
                        ? "2px solid #1abc9c"
                        : "1px solid var(--border)",

                    background:
                      isSelected
                        ? "#e5f8f3"
                        : "#ffffff",

                    transition:
                      "all 0.2s ease",
                  }}
                >
                  {/* LEFT */}

                  <div>
                    <div
                      style={{
                        fontWeight:
                          700,
                        fontSize: 13,
                        marginBottom:
                          5,
                        color:
                          "#1f2937",
                      }}
                    >
                      {vehicleName(
                        trip.vehicle_id
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#64748b",
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

                      <span>
                        {trip.origin}
                        {" → "}
                        {
                          trip.destination
                        }
                      </span>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className="status-pill status-active"
                    >
                      {trip.status ||
                        "Ongoing"}
                    </span>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        trip.id
                      }
                      onClick={(e) => {
                        e.stopPropagation();

                        handleDeleteTrip(
                          trip
                        );
                      }}
                      title="Delete Trip"
                      style={{
                        width: 34,
                        height: 34,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        border:
                          "1px solid #fecaca",
                        background:
                          "#fff1f2",
                        color:
                          "#dc2626",
                        borderRadius: 8,
                        cursor:
                          deletingId ===
                          trip.id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          deletingId ===
                          trip.id
                            ? 0.5
                            : 1,
                      }}
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              );
            })}

            {trips.length === 0 && (
>>>>>>> Stashed changes
              <div
                style={{
                  textAlign:
                    "center",
                  color:
<<<<<<< Updated upstream
                    "var(--text-500)",
=======
                    "#64748b",
>>>>>>> Stashed changes
                  padding: 30,
                  fontSize: 13,
                }}
              >
                No trips yet.
                <br />
<<<<<<< Updated upstream
                New Trip वरून
=======
                New Trip वर click करून
>>>>>>> Stashed changes
                trip तयार करा.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
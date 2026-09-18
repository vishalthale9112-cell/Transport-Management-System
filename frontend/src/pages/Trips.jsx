import { useEffect, useState } from "react";
import {
  Gauge,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createTrip,
  deleteTrip,
  getTrips,
  getVehicles,
  updateTrip,
} from "../api";

import RealMap from "../components/RealMap";

const EMPTY_FORM = {
  vehicle_id: "",
  origin: "",
  destination: "",
  distance_km: "",
  progress: 0,
  status: "Ongoing",
};

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] =
    useState([]);

  const [selectedTrip, setSelectedTrip] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingTripId, setEditingTripId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] =
    useState(EMPTY_FORM);

  // =====================================================
  // LOAD TRIPS
  // =====================================================

  const loadTrips = async (
    preferredTripId = null
  ) => {
    try {
      const data = await getTrips();

      const list = Array.isArray(data)
        ? data
        : [];

      setTrips(list);

      setSelectedTrip(
        (currentSelectedTrip) => {
          if (list.length === 0) {
            return null;
          }

          if (preferredTripId) {
            const preferredTrip =
              list.find(
                (trip) =>
                  Number(trip.id) ===
                  Number(preferredTripId)
              );

            if (preferredTrip) {
              return preferredTrip;
            }
          }

          if (currentSelectedTrip) {
            const existingTrip =
              list.find(
                (trip) =>
                  Number(trip.id) ===
                  Number(
                    currentSelectedTrip.id
                  )
              );

            if (existingTrip) {
              return existingTrip;
            }
          }

          return list[0];
        }
      );
    } catch (error) {
      console.error(
        "Trips load error:",
        error
      );

      setTrips([]);
      setSelectedTrip(null);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

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

        setVehicles([]);
      });
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
    });

    setFormError("");
    setEditingTripId(null);
    setShowForm(false);
  };

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const openCreateForm = () => {
    setForm({
      ...EMPTY_FORM,
    });

    setFormError("");
    setEditingTripId(null);
    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const openEditForm = (trip) => {
    setForm({
      vehicle_id: String(
        trip.vehicle_id || ""
      ),

      origin:
        trip.origin || "",

      destination:
        trip.destination || "",

      distance_km:
        trip.distance_km > 0
          ? String(trip.distance_km)
          : "",

      progress:
        Number(trip.progress || 0),

      status:
        trip.status || "Ongoing",
    });

    setEditingTripId(trip.id);
    setSelectedTrip(trip);
    setFormError("");
    setShowForm(true);
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (!form.vehicle_id) {
      return "Please select vehicle.";
    }

    if (!form.origin.trim()) {
      return "Please enter origin.";
    }

    if (!form.destination.trim()) {
      return "Please enter destination.";
    }

    if (
      form.origin.trim().toLowerCase()
      ===
      form.destination.trim().toLowerCase()
    ) {
      return (
        "Origin and destination " +
        "cannot be same."
      );
    }

    const distanceKm = Number(
      form.distance_km
    );

    if (
      !Number.isFinite(distanceKm)
      || distanceKm <= 0
    ) {
      return (
        "Please enter valid trip " +
        "distance in KM."
      );
    }

    return "";
  };

  // =====================================================
  // CREATE OR UPDATE TRIP
  // =====================================================

  const handleSave = async (event) => {
    event.preventDefault();

    setFormError("");

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const distanceKm = Number(
      form.distance_km
    );

    try {
      setSaving(true);

      let savedTrip;

      if (editingTripId) {
        savedTrip = await updateTrip(
          editingTripId,
          {
            origin:
              form.origin.trim(),

            destination:
              form.destination.trim(),

            distance_km:
              distanceKm,

            progress:
              Number(
                form.progress || 0
              ),

            status:
              form.status || "Ongoing",
          }
        );
      } else {
        savedTrip = await createTrip({
          vehicle_id: Number(
            form.vehicle_id
          ),

          origin:
            form.origin.trim(),

          destination:
            form.destination.trim(),

          distance_km:
            distanceKm,

          progress: 0,
          status: "Ongoing",
        });
      }

      resetForm();

      await loadTrips(
        savedTrip?.id || null
      );
    } catch (error) {
      console.error(
        "Trip save error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      setFormError(
        detail
          ? String(detail)
          : "Trip save झाला नाही."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE TRIP
  // =====================================================

  const handleDeleteTrip = async (
    trip
  ) => {
    const confirmDelete =
      window.confirm(
        `${trip.origin} → ` +
        `${trip.destination} ` +
        "हा trip delete करायचा आहे का?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(trip.id);

      await deleteTrip(trip.id);

      const updatedTrips =
        trips.filter(
          (item) =>
            Number(item.id) !==
            Number(trip.id)
        );

      setTrips(updatedTrips);

      if (
        Number(selectedTrip?.id)
        === Number(trip.id)
      ) {
        setSelectedTrip(
          updatedTrips.length > 0
            ? updatedTrips[0]
            : null
        );
      }

      if (
        Number(editingTripId)
        === Number(trip.id)
      ) {
        resetForm();
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

  // =====================================================
  // VEHICLE NAME
  // =====================================================

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
      vehicle.registration_number
      || `Vehicle #${vehicleId}`
    );
  };

  // =====================================================
  // ROUTE FOR MAP
  // =====================================================

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

  // =====================================================
  // INPUT STYLE
  // =====================================================

  const inputStyle = {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border:
      "1px solid var(--border)",
    fontSize: 13,
    background: "#ffffff",
    boxSizing: "border-box",
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="content">
      <div className="grid-2">

        {/* ROUTE MAP */}

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
            <span>
              {selectedTrip
                ? (
                    `${selectedTrip.origin} → ` +
                    selectedTrip.destination
                  )
                : "Route Map"}
            </span>

            {selectedTrip && (
              <span
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 5,
                  color:
                    "#0f766e",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Gauge size={15} />

                {Number(
                  selectedTrip.distance_km
                  || 0
                ).toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}{" "}
                KM
              </span>
            )}
          </div>

          <div
            style={{
              margin:
                "14px 20px 20px",
            }}
          >
            <RealMap
              key={
                selectedTrip
                  ? (
                      `trip-` +
                      `${selectedTrip.id}-` +
                      `${selectedTrip.origin}-` +
                      selectedTrip.destination
                    )
                  : "no-trip"
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

        {/* TRIP LIST */}

        <div className="card">
          <div className="card-title">
            <span>Trips</span>

            <button
              type="button"
              className="btn-primary"
              onClick={
                openCreateForm
              }
            >
              <Plus size={14} />
              New Trip
            </button>
          </div>

          {/* CREATE / EDIT FORM */}

          {showForm && (
            <form
              onSubmit={handleSave}
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
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#0b1e33",
                }}
              >
                {editingTripId
                  ? "Update Trip"
                  : "Create New Trip"}
              </div>

              <select
                value={
                  form.vehicle_id
                }

                disabled={
                  Boolean(
                    editingTripId
                  )
                }

                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicle_id:
                      event.target.value,
                  })
                }

                style={{
                  ...inputStyle,

                  cursor:
                    editingTripId
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    editingTripId
                      ? 0.7
                      : 1,
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
                placeholder={
                  "Origin - e.g. Jalna"
                }
                value={form.origin}

                onChange={(event) =>
                  setForm({
                    ...form,
                    origin:
                      event.target.value,
                  })
                }

                style={inputStyle}
              />

              <input
                type="text"
                placeholder={
                  "Destination - e.g. Akole"
                }
                value={
                  form.destination
                }

                onChange={(event) =>
                  setForm({
                    ...form,
                    destination:
                      event.target.value,
                  })
                }

                style={inputStyle}
              />

              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder={
                  "Trip Distance in KM"
                }
                value={
                  form.distance_km
                }

                onChange={(event) =>
                  setForm({
                    ...form,
                    distance_km:
                      event.target.value,
                  })
                }

                style={inputStyle}
              />

              {editingTripId && (
                <>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder={
                      "Trip Progress %"
                    }
                    value={
                      form.progress
                    }

                    onChange={(event) =>
                      setForm({
                        ...form,
                        progress:
                          event.target.value,
                      })
                    }

                    style={inputStyle}
                  />

                  <select
                    value={
                      form.status
                    }

                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target.value,
                      })
                    }

                    style={inputStyle}
                  >
                    <option value="Ongoing">
                      Ongoing
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </>
              )}

              {formError && (
                <div
                  style={{
                    color: "#dc2626",
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
                    : editingTripId
                      ? "Update Trip"
                      : "Save Trip"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding:
                      "8px 14px",
                    borderRadius: 8,
                    border:
                      "1px solid var(--border)",
                    background:
                      "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TRIPS */}

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
                )
                === Number(trip.id);

              return (
                <div
                  key={trip.id}

                  onClick={() => {
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
                    cursor: "pointer",
                    boxSizing:
                      "border-box",

                    border:
                      isSelected
                        ? (
                            "2px solid " +
                            "#1abc9c"
                          )
                        : (
                            "1px solid " +
                            "var(--border)"
                          ),

                    background:
                      isSelected
                        ? "#e5f8f3"
                        : "#ffffff",

                    transition:
                      "all 0.2s ease",
                  }}
                >
                  {/* LEFT */}

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 5,
                        color: "#1f2937",
                      }}
                    >
                      {vehicleName(
                        trip.vehicle_id
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 5,
                      }}
                    >
                      <MapPin size={13} />

                      <span>
                        {trip.origin}
                        {" → "}
                        {trip.destination}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 5,
                        fontSize: 12,
                        color: "#0f766e",
                        fontWeight: 700,
                      }}
                    >
                      <Gauge size={13} />

                      {Number(
                        trip.distance_km
                        || 0
                      ).toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )}{" "}
                      KM
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 8,
                      marginLeft: 10,
                    }}
                  >
                    <span
                      className={
                        trip.status
                        === "Completed"
                          ? "status-pill"
                          : (
                              "status-pill " +
                              "status-active"
                            )
                      }
                    >
                      {trip.status
                        || "Ongoing"}
                    </span>

                    <button
                      type="button"
                      title="Edit Trip"

                      onClick={(event) => {
                        event.stopPropagation();
                        openEditForm(trip);
                      }}

                      style={{
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        border:
                          "1px solid #bfdbfe",
                        background:
                          "#eff6ff",
                        color: "#2563eb",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      title="Delete Trip"

                      disabled={
                        deletingId
                        === trip.id
                      }

                      onClick={(event) => {
                        event.stopPropagation();

                        handleDeleteTrip(
                          trip
                        );
                      }}

                      style={{
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        border:
                          "1px solid #fecaca",
                        background:
                          "#fff1f2",
                        color: "#dc2626",
                        borderRadius: 8,

                        cursor:
                          deletingId
                          === trip.id
                            ? "not-allowed"
                            : "pointer",

                        opacity:
                          deletingId
                          === trip.id
                            ? 0.5
                            : 1,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

            {trips.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  padding: 30,
                  fontSize: 13,
                }}
              >
                No trips yet.
                <br />
                New Trip वर click करून
                trip तयार करा.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  createVehicle,
  deleteVehicle,
  getDrivers,
  getVehicles,
  updateVehicle,
} from "../api";

const statusClass = {
  Active: "status-active",
  Maintenance: "status-maintenance",
  Idle: "status-idle",
};

const emptyForm = {
  registration_number: "",
  vehicle_type: "Truck",
  fuel_type: "Diesel",
  driver_id: "",
};

export default function Vehicles() {
  const [vehicles, setVehicles] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [
    updatingVehicleId,
    setUpdatingVehicleId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  // ==========================================
  // LOAD VEHICLES AND DRIVERS
  // ==========================================

  const load = async (query = "") => {
    try {
      setError("");

      const [
        vehicleData,
        driverData,
      ] = await Promise.all([
        getVehicles(query),
        getDrivers(),
      ]);

      setVehicles(
        Array.isArray(vehicleData)
          ? vehicleData
          : []
      );

      setDrivers(
        Array.isArray(driverData)
          ? driverData
          : []
      );
    } catch (loadError) {
      console.error(
        "Vehicles load error:",
        loadError
      );

      setError(
        loadError?.response?.data?.detail ||
          "Vehicles data load झाली नाही."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (event) => {
    const value = event.target.value;

    setSearch(value);
    load(value);
  };

  // ==========================================
  // GET DRIVER NAME
  // ==========================================

  const getDriver = (driverId) => {
    return drivers.find(
      (driver) =>
        Number(driver.id) ===
        Number(driverId)
    );
  };

  // ==========================================
  // CHECK DRIVER AVAILABILITY
  // ==========================================

  const driverIsAssigned = (
    driverId,
    currentVehicleId = null
  ) => {
    return vehicles.some(
      (vehicle) =>
        Number(vehicle.driver_id) ===
          Number(driverId) &&
        Number(vehicle.id) !==
          Number(currentVehicleId)
    );
  };

  // ==========================================
  // ADD VEHICLE
  // ==========================================

  const handleAdd = async (event) => {
    event.preventDefault();

    const registrationNumber =
      form.registration_number
        .trim()
        .toUpperCase();

    if (!registrationNumber) {
      setError(
        "Registration number टाका."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        registration_number:
          registrationNumber,

        vehicle_type:
          form.vehicle_type,

        fuel_type:
          form.fuel_type,

        driver_id: form.driver_id
          ? Number(form.driver_id)
          : null,
      };

      await createVehicle(payload);

      setForm(emptyForm);
      setShowForm(false);

      await load(search);
    } catch (saveError) {
      console.error(
        "Vehicle save error:",
        saveError
      );

      setError(
        saveError?.response?.data?.detail ||
          "Vehicle save झाला नाही."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ASSIGN OR CHANGE DRIVER
  // ==========================================

  const handleDriverChange = async (
    vehicleId,
    driverId
  ) => {
    try {
      setUpdatingVehicleId(vehicleId);
      setError("");

      await updateVehicle(
        vehicleId,
        {
          driver_id: driverId
            ? Number(driverId)
            : null,
        }
      );

      await load(search);
    } catch (updateError) {
      console.error(
        "Driver assignment error:",
        updateError
      );

      setError(
        updateError?.response?.data?.detail ||
          "Driver assign झाला नाही."
      );
    } finally {
      setUpdatingVehicleId(null);
    }
  };

  // ==========================================
  // DELETE VEHICLE
  // ==========================================

  const handleDelete = async (
    vehicleId
  ) => {
    const confirmed =
      window.confirm(
        "हा vehicle delete करायचा आहे का?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteVehicle(vehicleId);
      await load(search);
    } catch (deleteError) {
      console.error(
        "Vehicle delete error:",
        deleteError
      );

      setError(
        deleteError?.response?.data?.detail ||
          "Vehicle delete झाला नाही."
      );
    }
  };

  return (
    <div className="content">
      <div className="card">
        {/* HEADER */}

        <div className="card-title">
          <span>Vehicles</span>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              className="search-box"
              style={{
                maxWidth: 260,
              }}
            >
              <Search size={14} />

              <input
                placeholder="Search registration no."
                value={search}
                onChange={handleSearch}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setShowForm(
                  (current) => !current
                );

                setError("");
              }}
            >
              <Plus size={14} />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 15,
              padding: "11px 13px",
              border:
                "1px solid #efb4bd",
              borderRadius: 9,
              background: "#fff0f2",
              color: "#b52f42",
              fontSize: 12,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ADD VEHICLE FORM */}

        {showForm && (
          <form
            onSubmit={handleAdd}
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(190px, 1.4fr) 130px 130px minmax(190px, 1fr) 100px",
              gap: 10,
              marginBottom: 18,
              padding: 14,
              border:
                "1px solid var(--border)",
              borderRadius: 12,
              background: "#f8fafc",
            }}
          >
            <input
              placeholder="Registration Number"
              value={
                form.registration_number
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  registration_number:
                    event.target.value,
                })
              }
              style={{
                minWidth: 0,
                padding: "10px 12px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                fontSize: 13,
              }}
            />

            <select
              value={form.vehicle_type}
              onChange={(event) =>
                setForm({
                  ...form,

                  vehicle_type:
                    event.target.value,
                })
              }
              style={{
                minWidth: 0,
                padding: "10px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                fontSize: 13,
              }}
            >
              <option value="Truck">
                Truck
              </option>

              <option value="Van">
                Van
              </option>

              <option value="Mini Truck">
                Mini Truck
              </option>

              <option value="Trailer">
                Trailer
              </option>
            </select>

            <select
              value={form.fuel_type}
              onChange={(event) =>
                setForm({
                  ...form,

                  fuel_type:
                    event.target.value,
                })
              }
              style={{
                minWidth: 0,
                padding: "10px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                fontSize: 13,
              }}
            >
              <option value="Diesel">
                Diesel
              </option>

              <option value="Petrol">
                Petrol
              </option>

              <option value="CNG">
                CNG
              </option>

              <option value="Electric">
                Electric
              </option>
            </select>

            <select
              value={form.driver_id}
              onChange={(event) =>
                setForm({
                  ...form,

                  driver_id:
                    event.target.value,
                })
              }
              style={{
                minWidth: 0,
                padding: "10px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                fontSize: 13,
              }}
            >
              <option value="">
                No Driver
              </option>

              {drivers.map((driver) => {
                const assigned =
                  driverIsAssigned(
                    driver.id
                  );

                return (
                  <option
                    key={driver.id}
                    value={driver.id}
                    disabled={assigned}
                  >
                    {driver.name}
                    {assigned
                      ? " - Assigned"
                      : ""}
                  </option>
                );
              })}
            </select>

            <button
              className="btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>
          </form>
        )}

        {/* VEHICLES TABLE */}

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Type</th>
                <th>Fuel</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Trip Progress</th>
                <th>Service Due</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => {
                const assignedDriver =
                  vehicle.driver ||
                  getDriver(
                    vehicle.driver_id
                  );

                const isUpdating =
                  Number(
                    updatingVehicleId
                  ) ===
                  Number(vehicle.id);

                return (
                  <tr key={vehicle.id}>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {
                        vehicle.registration_number
                      }
                    </td>

                    <td>
                      {vehicle.vehicle_type}
                    </td>

                    <td>
                      {vehicle.fuel_type}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          statusClass[
                            vehicle.status
                          ] || ""
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </td>

                    {/* DRIVER DROPDOWN */}

                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 7,
                        }}
                      >
                        <UserRound
                          size={15}
                          style={{
                            color:
                              assignedDriver
                                ? "#17a98b"
                                : "#94a3b8",
                            flex: "0 0 auto",
                          }}
                        />

                        <select
                          value={
                            vehicle.driver_id ||
                            ""
                          }
                          disabled={
                            isUpdating
                          }
                          onChange={(
                            event
                          ) =>
                            handleDriverChange(
                              vehicle.id,
                              event.target
                                .value
                            )
                          }
                          style={{
                            minWidth: 145,
                            maxWidth: 190,
                            padding:
                              "7px 8px",
                            border:
                              "1px solid var(--border)",
                            borderRadius:
                              7,
                            background:
                              "#fff",
                            fontSize: 11,
                          }}
                        >
                          <option value="">
                            Not Assigned
                          </option>

                          {drivers.map(
                            (driver) => {
                              const assignedToOther =
                                driverIsAssigned(
                                  driver.id,
                                  vehicle.id
                                );

                              return (
                                <option
                                  key={
                                    driver.id
                                  }
                                  value={
                                    driver.id
                                  }
                                  disabled={
                                    assignedToOther
                                  }
                                >
                                  {
                                    driver.name
                                  }
                                  {assignedToOther
                                    ? " - Assigned"
                                    : ""}
                                </option>
                              );
                            }
                          )}
                        </select>

                        {isUpdating && (
                          <span
                            style={{
                              color:
                                "var(--text-500)",
                              fontSize:
                                10,
                            }}
                          >
                            Saving...
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {Number(
                        vehicle.trip_progress ||
                          0
                      )}
                      %
                    </td>

                    <td>
                      {Number(
                        vehicle.service_due_in_days
                      ) <= 5 ? (
                        <b
                          style={{
                            color:
                              "var(--red-500)",
                          }}
                        >
                          {
                            vehicle.service_due_in_days
                          }
                          d
                        </b>
                      ) : (
                        `${vehicle.service_due_in_days}d`
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        title="Delete vehicle"
                        onClick={() =>
                          handleDelete(
                            vehicle.id
                          )
                        }
                      >
                        <Trash2
                          size={13}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {vehicles.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign:
                        "center",
                      color:
                        "var(--text-500)",
                      padding: 24,
                    }}
                  >
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
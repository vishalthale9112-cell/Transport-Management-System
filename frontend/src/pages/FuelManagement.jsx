import { useEffect, useMemo, useState } from "react";
import { Fuel, Plus, X, AlertCircle } from "lucide-react";
import { getFuelLogs, createFuelLog, getVehicles } from "../api";

export default function FuelManagement() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const [form, setForm] = useState({
    vehicle_id: "",
    fuel_type: "Diesel",
    liters: "",
    price_per_liter: "",
    odometer: "",
    station_name: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // Load vehicles
  const loadVehicles = async () => {
    try {
      const data = await getVehicles();

      if (Array.isArray(data)) {
        setVehicles(data);
      } else if (Array.isArray(data?.vehicles)) {
        setVehicles(data.vehicles);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error("Vehicle loading error:", error);
      setVehicles([]);
    }
  };

  // Load fuel logs
  const loadFuelLogs = async () => {
    try {
      setLoading(true);
      setApiError("");

      const data = await getFuelLogs();

      if (Array.isArray(data)) {
        setFuelLogs(data);
      } else if (Array.isArray(data?.fuel_logs)) {
        setFuelLogs(data.fuel_logs);
      } else {
        setFuelLogs([]);
      }
    } catch (error) {
      setFuelLogs([]);

      if (error?.response?.status === 404) {
        setApiError(
          "Fuel backend API is not available yet. Backend developer needs to add GET /api/fuel-logs and POST /api/fuel-logs."
        );
      } else {
        console.error("Unable to load fuel records:", error);
        setApiError("Unable to load fuel records.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadFuelLogs();
  }, []);

  // Total liters
  const totalLiters = useMemo(() => {
    return fuelLogs.reduce(
      (sum, item) => sum + Number(item.liters || 0),
      0
    );
  }, [fuelLogs]);

  // Total expense
  const totalFuelCost = useMemo(() => {
    return fuelLogs.reduce((sum, item) => {
      const total =
        item.total_cost ??
        item.amount ??
        Number(item.liters || 0) *
          Number(item.price_per_liter || 0);

      return sum + Number(total || 0);
    }, 0);
  }, [fuelLogs]);

  // Average fuel price
  const averagePrice = useMemo(() => {
    if (!totalLiters) return 0;
    return totalFuelCost / totalLiters;
  }, [totalFuelCost, totalLiters]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save fuel entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.vehicle_id) {
      alert("Please select vehicle.");
      return;
    }

    if (!form.liters || Number(form.liters) <= 0) {
      alert("Please enter valid liters.");
      return;
    }

    if (
      !form.price_per_liter ||
      Number(form.price_per_liter) <= 0
    ) {
      alert("Please enter valid price per liter.");
      return;
    }

    const liters = Number(form.liters);
    const price = Number(form.price_per_liter);

    const payload = {
      vehicle_id: Number(form.vehicle_id),
      fuel_type: form.fuel_type,
      liters: liters,
      price_per_liter: price,
      total_cost: liters * price,
      odometer: form.odometer
        ? Number(form.odometer)
        : 0,
      station_name: form.station_name,
      date: form.date,
    };

    try {
      setSaving(true);
      setApiError("");

      await createFuelLog(payload);

      setForm({
        vehicle_id: "",
        fuel_type: "Diesel",
        liters: "",
        price_per_liter: "",
        odometer: "",
        station_name: "",
        date: new Date().toISOString().slice(0, 10),
      });

      setShowForm(false);

      await loadFuelLogs();
    } catch (error) {
      if (error?.response?.status === 404) {
        setApiError(
          "Fuel backend API is missing. POST /api/fuel-logs is required."
        );
      } else {
        console.error("Unable to save fuel entry:", error);

        setApiError(
          error?.response?.data?.detail ||
            "Unable to save fuel record."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(
      (v) => Number(v.id) === Number(vehicleId)
    );

    return (
      vehicle?.vehicle_number ||
      vehicle?.registration_number ||
      vehicle?.name ||
      `Vehicle #${vehicleId}`
    );
  };

  return (
    <div className="content">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              color: "var(--text-900)",
            }}
          >
            Fuel Management
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-500)",
              fontSize: 14,
            }}
          >
            Track vehicle fuel usage and expenses
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Add Fuel
        </button>
      </div>

      {/* Backend message */}
      {apiError && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            marginBottom: 18,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            fontSize: 13,
          }}
        >
          <AlertCircle size={18} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <div style={cardLabelStyle}>Total Fuel</div>

          <div style={cardValueStyle}>
            {totalLiters.toFixed(1)} L
          </div>
        </div>

        <div className="card">
          <div style={cardLabelStyle}>
            Total Fuel Expense
          </div>

          <div style={cardValueStyle}>
            ₹
            {totalFuelCost.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="card">
          <div style={cardLabelStyle}>
            Average Fuel Price
          </div>

          <div style={cardValueStyle}>
            ₹{averagePrice.toFixed(2)}/L
          </div>
        </div>
      </div>

      {/* Add fuel form */}
      {showForm && (
        <div
          className="card"
          style={{ marginBottom: 20 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              Add Fuel Entry
            </div>

            <button
              type="button"
              className="btn-sm"
              onClick={() => setShowForm(false)}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>
                  Vehicle
                </label>

                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select Vehicle
                  </option>

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.vehicle_number ||
                        vehicle.registration_number ||
                        vehicle.name ||
                        `Vehicle #${vehicle.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Fuel Type
                </label>

                <select
                  name="fuel_type"
                  value={form.fuel_type}
                  onChange={handleChange}
                  style={inputStyle}
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
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Liters
                </label>

                <input
                  type="number"
                  step="0.01"
                  name="liters"
                  value={form.liters}
                  onChange={handleChange}
                  placeholder="Example: 40"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Price / Liter
                </label>

                <input
                  type="number"
                  step="0.01"
                  name="price_per_liter"
                  value={form.price_per_liter}
                  onChange={handleChange}
                  placeholder="Example: 92.50"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Odometer KM
                </label>

                <input
                  type="number"
                  name="odometer"
                  value={form.odometer}
                  onChange={handleChange}
                  placeholder="Example: 45200"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Fuel Station
                </label>

                <input
                  type="text"
                  name="station_name"
                  value={form.station_name}
                  onChange={handleChange}
                  placeholder="Fuel station name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Total Amount
                </label>

                <input
                  type="text"
                  readOnly
                  value={`₹${(
                    Number(form.liters || 0) *
                    Number(form.price_per_liter || 0)
                  ).toFixed(2)}`}
                  style={{
                    ...inputStyle,
                    background: "#f8fafc",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="btn-sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Fuel Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fuel history */}
      <div className="card">
        <div
          className="card-title"
          style={{ marginBottom: 15 }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Fuel size={18} />
            Fuel History
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Fuel</th>
                <th>Liters</th>
                <th>Price/L</th>
                <th>Total</th>
                <th>Odometer</th>
                <th>Station</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: 30,
                    }}
                  >
                    Loading fuel records...
                  </td>
                </tr>
              ) : fuelLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: 35,
                      color: "var(--text-500)",
                    }}
                  >
                    No fuel records available
                  </td>
                </tr>
              ) : (
                fuelLogs.map((item) => {
                  const total =
                    item.total_cost ??
                    item.amount ??
                    Number(item.liters || 0) *
                      Number(
                        item.price_per_liter || 0
                      );

                  return (
                    <tr key={item.id}>
                      <td
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {item.vehicle_number ||
                          getVehicleName(
                            item.vehicle_id
                          )}
                      </td>

                      <td>
                        {item.fuel_type ||
                          "Diesel"}
                      </td>

                      <td>
                        {Number(
                          item.liters || 0
                        ).toFixed(2)}{" "}
                        L
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.price_per_liter ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        ₹
                        {Number(
                          total || 0
                        ).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>

                      <td>
                        {item.odometer
                          ? `${Number(
                              item.odometer
                            ).toLocaleString(
                              "en-IN"
                            )} km`
                          : "—"}
                      </td>

                      <td>
                        {item.station_name ||
                          "—"}
                      </td>

                      <td>
                        {item.date ||
                          item.created_at ||
                          "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  color: "var(--text-500)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  outline: "none",
  fontSize: 13,
  background: "#fff",
};

const cardLabelStyle = {
  color: "var(--text-500)",
  fontSize: 13,
  marginBottom: 8,
};

const cardValueStyle = {
  fontSize: 25,
  fontWeight: 700,
};
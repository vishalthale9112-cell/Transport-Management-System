import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import {
  AlertTriangle,
  Bell,
  Bot,
  FileText,
  Filter,
  Fuel,
  History,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Truck,
  User,
  Wrench,
} from "lucide-react";

import {
  askAIAssistant,
  getDashboard,
  getDrivers,
  getVehicles,
} from "../api";

import RealMap from "../components/RealMap";
import "./Dashboard.css";

const FUEL_COLORS = {
  Diesel: "#10243e",
  Petrol: "#17b897",
  CNG: "#f5a623",
  Electric: "#5577ee",
};

const ALERT_COLORS = {
  info: {
    color: "#315ed8",
    background: "#e9efff",
    icon: Bell,
  },
  warning: {
    color: "#db850d",
    background: "#fff3dc",
    icon: AlertTriangle,
  },
  critical: {
    color: "#df4457",
    background: "#ffe9ed",
    icon: AlertTriangle,
  },
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;

const alertTime = (minutes) => {
  const value = Number(minutes || 0);

  if (value < 1) {
    return "Just now";
  }

  if (value < 60) {
    return `${value} minutes ago`;
  }

  if (value < 1440) {
    return `${Math.floor(
      value / 60
    )} hours ago`;
  }

  return `${Math.floor(
    value / 1440
  )} days ago`;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] =
    useState([]);
  const [drivers, setDrivers] =
    useState([]);

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [aiMessage, setAiMessage] =
    useState("");

  const [aiAnswer, setAiAnswer] =
    useState(
      "Hi, I am your Transport AI Assistant. Ask me about vehicles, drivers, trips, fuel, maintenance or reports."
    );

  const [aiLoading, setAiLoading] =
    useState(false);

  // ==========================================
  // LOAD LIVE DASHBOARD DATA
  // ==========================================

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoadError("");

        const [
          dashboardData,
          vehicleData,
          driverData,
        ] = await Promise.all([
          getDashboard(),
          getVehicles(),
          getDrivers(),
        ]);

        setStats(dashboardData || {});

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
      } catch (error) {
        console.error(
          "Dashboard load error:",
          error
        );

        setLoadError(
          error?.response?.data?.detail ||
            "Dashboard data load झाली नाही."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();

    const timer = window.setInterval(
      loadDashboard,
      30000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [loadDashboard]);

  // ==========================================
  // SELECT DEFAULT VEHICLE
  // ==========================================

  useEffect(() => {
    if (!vehicles.length) {
      setSelectedVehicleId("");
      return;
    }

    const selectedExists = vehicles.some(
      (vehicle) =>
        String(vehicle.id) ===
        String(selectedVehicleId)
    );

    if (!selectedExists) {
      setSelectedVehicleId(
        String(vehicles[0].id)
      );
    }
  }, [vehicles, selectedVehicleId]);

  // ==========================================
  // SELECTED VEHICLE AND DRIVER
  // ==========================================

  const selectedVehicle = vehicles.find(
    (vehicle) =>
      String(vehicle.id) ===
      String(selectedVehicleId)
  );

  const selectedDriver = drivers.find(
    (driver) =>
      Number(driver.id) ===
      Number(selectedVehicle?.driver_id)
  );

  // ==========================================
  // CHART DATA
  // ==========================================

  const monthlyData = useMemo(() => {
    const records = Array.isArray(
      stats?.monthly_finance
    )
      ? stats.monthly_finance
      : [];

    return records.map((record) => ({
      month: record.month,

      revenue: Number(
        record.revenue || 0
      ),

      expenses: Number(
        record.expenses || 0
      ),
    }));
  }, [stats]);

  const fuelData = useMemo(() => {
    return Object.entries(
      stats?.fuel_breakdown || {}
    )
      .map(([name, value]) => ({
        name,
        value: Number(value || 0),
      }))
      .filter(
        (item) => item.value > 0
      );
  }, [stats]);

  const costData = useMemo(() => {
    return Object.entries(
      stats?.cost_per_km || {}
    ).map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }));
  }, [stats]);

  const pieData = fuelData.length
    ? fuelData
    : [
        {
          name: "No Data",
          value: 1,
        },
      ];

  const totalFuel = fuelData.reduce(
    (total, item) =>
      total + Number(item.value || 0),
    0
  );

  // ==========================================
  // WHATSAPP MESSAGE
  // ==========================================

  const handleWhatsAppMessage = () => {
    if (!selectedVehicle) {
      window.alert(
        "Please select a vehicle."
      );
      return;
    }

    if (!selectedDriver) {
      window.alert(
        "या vehicleला driver assign केलेला नाही."
      );
      return;
    }

    if (!selectedDriver.phone) {
      window.alert(
        "Driverचा phone number उपलब्ध नाही."
      );
      return;
    }

    let phoneNumber = String(
      selectedDriver.phone
    ).replace(/\D/g, "");

    if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`;
    } else if (
      phoneNumber.length === 11 &&
      phoneNumber.startsWith("0")
    ) {
      phoneNumber = `91${phoneNumber.slice(
        1
      )}`;
    }

    if (phoneNumber.length < 10) {
      window.alert(
        "Driverचा phone number योग्य नाही."
      );
      return;
    }

    const message = [
      `Hello ${selectedDriver.name},`,
      "",
      `Vehicle: ${
        selectedVehicle.registration_number
      }`,
      `Vehicle Type: ${
        selectedVehicle.vehicle_type ||
        "Not available"
      }`,
      `Status: ${
        selectedVehicle.status ||
        "Not available"
      }`,
      `Trip Progress: ${Number(
        selectedVehicle.trip_progress ||
          0
      )}%`,
      "",
      "Please check and confirm.",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${phoneNumber}` +
      `?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==========================================
  // AI ASSISTANT
  // ==========================================

  const handleAskAI = async (event) => {
    event.preventDefault();

    const message = aiMessage.trim();

    if (!message || aiLoading) {
      return;
    }

    try {
      setAiLoading(true);
      setAiAnswer("Thinking...");

      const result =
        await askAIAssistant(message);

      setAiAnswer(
        result?.answer ||
          "मला उत्तर मिळाले नाही."
      );

      setAiMessage("");
    } catch (error) {
      console.error(
        "Dashboard AI error:",
        error
      );

      setAiAnswer(
        error?.response?.data?.detail ||
          "AI Assistant सध्या उपलब्ध नाही."
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="professional-loading">
        Loading live dashboard...
      </div>
    );
  }

  return (
    <div className="professional-dashboard">
      {loadError && (
        <div className="professional-error">
          <AlertTriangle size={17} />
          <span>{loadError}</span>
        </div>
      )}

      <div className="professional-layout">
        <main className="professional-main">
          {/* TOP CHARTS */}

          <section className="professional-charts">
            {/* REVENUE CHART */}

            <article className="professional-card revenue-card">
              <div className="professional-card-title">
                <h3>Monthly Revenue</h3>

                <div className="revenue-legend">
                  <span>
                    <i className="revenue-color" />
                    Revenue
                  </span>

                  <span>
                    <i className="expense-color" />
                    Monthly Expenses
                  </span>
                </div>
              </div>

              <div className="revenue-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 10,
                      bottom: 0,
                      left: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e1e7ee"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      tick={{
                        fontSize: 9,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `₹${Math.round(
                          Number(value) /
                            1000
                        )}k`
                      }
                    />

                    <Tooltip
                      formatter={(
                        value,
                        name
                      ) => [
                        currency(value),
                        name === "revenue"
                          ? "Revenue"
                          : "Expenses",
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border:
                          "1px solid #dce3e8",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10243e"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#f5a623"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* FUEL CHART */}

            <article className="professional-card fuel-card">
              <div className="professional-card-title">
                <h3>
                  Fuel Type Breakdown
                </h3>
              </div>

              <div className="fuel-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={47}
                      outerRadius={73}
                      stroke="none"
                      paddingAngle={
                        fuelData.length
                          ? 3
                          : 0
                      }
                    >
                      {pieData.map(
                        (item) => (
                          <Cell
                            key={item.name}
                            fill={
                              item.name ===
                              "No Data"
                                ? "#e4e9ee"
                                : FUEL_COLORS[
                                    item.name
                                  ] ||
                                  "#8c9aaa"
                            }
                          />
                        )
                      )}
                    </Pie>

                    {fuelData.length >
                      0 && (
                      <Tooltip
                        formatter={(
                          value
                        ) => [
                          `${Number(
                            value
                          ).toFixed(
                            2
                          )} L`,
                          "Fuel",
                        ]}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>

                <div className="fuel-center">
                  <Fuel size={16} />

                  <strong>
                    {totalFuel.toFixed(0)}
                  </strong>

                  <span>Litres</span>
                </div>
              </div>

              <div className="fuel-legend">
                {fuelData.length ? (
                  fuelData.map(
                    (item) => (
                      <span key={item.name}>
                        <i
                          style={{
                            background:
                              FUEL_COLORS[
                                item.name
                              ] ||
                              "#8c9aaa",
                          }}
                        />

                        {item.name}
                      </span>
                    )
                  )
                ) : (
                  <span>
                    No fuel records
                  </span>
                )}
              </div>
            </article>

            {/* COST PER KM */}

            <article className="professional-card cost-card">
              <div className="professional-card-title">
                <h3>Cost per KM</h3>
              </div>

              <div className="cost-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={costData}
                    margin={{
                      top: 10,
                      right: 5,
                      bottom: 10,
                      left: 5,
                    }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-22}
                      height={47}
                      textAnchor="end"
                      tick={{
                        fontSize: 8,
                      }}
                    />

                    <YAxis hide />

                    <Tooltip
                      formatter={(
                        value
                      ) => [
                        `₹${Number(
                          value
                        ).toFixed(
                          2
                        )}/km`,
                        "Cost",
                      ]}
                    />

                    <Bar
                      dataKey="value"
                      fill="#17b897"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          {/* LIVE GPS MAP */}

          <section className="professional-card map-card">
            <div className="map-toolbar">
              <div className="live-map-title">
                <i />

                <span>
                  Live GPS Fleet Map
                </span>
              </div>

              <div className="map-actions">
                <div className="vehicle-search">
                  <Search size={15} />

                  <select
                    value={
                      selectedVehicleId
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedVehicleId(
                        event.target
                          .value
                      )
                    }
                  >
                    {vehicles.length ? (
                      vehicles.map(
                        (vehicle) => (
                          <option
                            value={
                              vehicle.id
                            }
                            key={
                              vehicle.id
                            }
                          >
                            {
                              vehicle.registration_number
                            }
                          </option>
                        )
                      )
                    ) : (
                      <option value="">
                        No vehicles
                      </option>
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  className="map-filter-button"
                >
                  <Filter size={15} />
                  Filter
                </button>
              </div>
            </div>

            <div className="map-content-layout">
              <div className="live-map-container">
                <RealMap
                  vehicles={vehicles}
                  height={470}
                />
              </div>

              {/* VEHICLE DETAILS */}

              <aside className="vehicle-details-panel">
                <div className="vehicle-details-heading">
                  <h3>
                    Vehicle Details
                  </h3>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/vehicles"
                        )
                      }
                    >
                      Add Vehicle
                    </button>

                    <button
                      type="button"
                      className="create-trip-button"
                      onClick={() =>
                        navigate("/trips")
                      }
                    >
                      Create Trip
                    </button>
                  </div>
                </div>

                {selectedVehicle ? (
                  <>
                    <div className="vehicle-profile">
                      <div className="vehicle-photo">
                        <Truck size={43} />
                      </div>

                      <div className="vehicle-profile-info">
                        <span>
                          Registration
                          Number
                        </span>

                        <h3>
                          {
                            selectedVehicle.registration_number
                          }
                        </h3>

                        <p>
                          {selectedVehicle.vehicle_type ||
                            "Transport Vehicle"}
                        </p>

                        <strong>
                          {selectedVehicle.status ||
                            "Unknown"}
                        </strong>
                      </div>
                    </div>

                    {/* DRIVER DETAILS */}

                    <div className="driver-profile">
                      <div className="driver-avatar">
                        <User size={19} />
                      </div>

                      {selectedDriver ? (
                        <div className="driver-information">
                          <span>
                            Assigned Driver
                          </span>

                          <strong>
                            {
                              selectedDriver.name
                            }
                          </strong>

                          <small>
                            Phone:{" "}
                            {selectedDriver.phone ||
                              "Not available"}
                          </small>

                          <small>
                            Licence:{" "}
                            {selectedDriver.license_number ||
                              "Not available"}
                          </small>

                          <button
                            type="button"
                            className="driver-whatsapp-button"
                            onClick={
                              handleWhatsAppMessage
                            }
                            disabled={
                              !selectedDriver.phone
                            }
                          >
                            <MessageCircle
                              size={15}
                            />

                            WhatsApp Message
                          </button>
                        </div>
                      ) : (
                        <div className="driver-information">
                          <span>
                            Driver
                          </span>

                          <strong>
                            Not Assigned
                          </strong>

                          <small>
                            Assign driver
                            from Vehicles
                            page.
                          </small>
                        </div>
                      )}
                    </div>

                    {/* TRIP PROGRESS */}

                    <div className="trip-progress">
                      <div>
                        <span>
                          Trip Progress
                        </span>

                        <strong>
                          {Number(
                            selectedVehicle.trip_progress ||
                              0
                          )}
                          %
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          style={{
                            width: `${Math.min(
                              Number(
                                selectedVehicle.trip_progress ||
                                  0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* DOCUMENTS */}

                    <h4 className="details-section-title">
                      Documents
                    </h4>

                    <div className="document-shortcuts">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/documents"
                          )
                        }
                      >
                        <FileText
                          size={20}
                        />
                        Driver Documents
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/documents"
                          )
                        }
                      >
                        <ShieldCheck
                          size={20}
                        />
                        Vehicle Documents
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/maintenance"
                          )
                        }
                      >
                        <Wrench
                          size={20}
                        />
                        Service History
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/documents"
                          )
                        }
                      >
                        <FileText
                          size={20}
                        />
                        Permit
                      </button>
                    </div>

                    {/* SERVICE HISTORY */}

                    <h4 className="details-section-title">
                      Service History
                    </h4>

                    <button
                      type="button"
                      className="service-history-button"
                      onClick={() =>
                        navigate(
                          "/maintenance"
                        )
                      }
                    >
                      <History size={16} />

                      <span>
                        View service
                        records
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="no-vehicle-selected">
                    <Truck size={34} />

                    <p>
                      No vehicle selected
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </main>

        {/* RIGHT COLUMN */}

        <aside className="professional-right-column">
          {/* ALERTS */}

          <section className="professional-card alerts-card">
            <div className="professional-card-title">
              <h3>
                Live Alerts and Critical
                Notifications
              </h3>
            </div>

            <div className="alerts-list">
              {Array.isArray(
                stats?.alerts
              ) &&
              stats.alerts.length ? (
                stats.alerts
                  .slice(0, 6)
                  .map((alert) => {
                    const severity =
                      String(
                        alert.severity ||
                          "info"
                      ).toLowerCase();

                    const style =
                      ALERT_COLORS[
                        severity
                      ] ||
                      ALERT_COLORS.info;

                    const AlertIcon =
                      style.icon;

                    return (
                      <div
                        className="alert-record"
                        key={alert.id}
                      >
                        <div
                          className="alert-record-icon"
                          style={{
                            color:
                              style.color,
                            background:
                              style.background,
                          }}
                        >
                          <AlertIcon
                            size={15}
                          />
                        </div>

                        <div className="alert-record-text">
                          <strong>
                            {alert.title}
                          </strong>

                          <p>
                            {alert.message ||
                              alert.notification_type ||
                              "Transport notification"}
                          </p>

                          <span>
                            {alertTime(
                              alert.minutes_ago
                            )}
                          </span>
                        </div>

                        <i
                          style={{
                            background:
                              style.color,
                          }}
                        />
                      </div>
                    );
                  })
              ) : (
                <div className="right-empty-state">
                  <Bell size={26} />

                  <strong>
                    No alerts
                  </strong>

                  <span>
                    No critical
                    notifications.
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* AI ASSISTANT */}

          <section className="professional-card assistant-card">
            <div className="assistant-heading">
              <div>
                <Bot size={18} />
                <h3>AI Assistant</h3>
              </div>

              <span className="assistant-online">
                Online
              </span>
            </div>

            <div className="assistant-chat">
              <div className="assistant-message">
                <Bot size={16} />

                <p>{aiAnswer}</p>
              </div>

              <button
                type="button"
                className="assistant-suggestion"
                onClick={() =>
                  setAiMessage(
                    "Give me today's fleet report"
                  )
                }
              >
                Try asking: “Give me
                today's fleet report”
              </button>
            </div>

            <form
              className="assistant-form"
              onSubmit={handleAskAI}
            >
              <input
                value={aiMessage}
                onChange={(event) =>
                  setAiMessage(
                    event.target.value
                  )
                }
                placeholder="Type a message..."
                disabled={aiLoading}
              />

              <button
                type="submit"
                disabled={
                  aiLoading ||
                  !aiMessage.trim()
                }
              >
                <Send size={15} />
              </button>
            </form>
          </section>

          <button
            type="button"
            className="add-order-shortcut"
            onClick={() =>
              navigate("/orders")
            }
          >
            <Plus size={17} />
            Create New Order
          </button>
        </aside>
      </div>

      <div className="dashboard-live-note">
        <MapPin size={14} />

        Dashboard updates automatically
        every 30 seconds.
      </div>
    </div>
  );
}
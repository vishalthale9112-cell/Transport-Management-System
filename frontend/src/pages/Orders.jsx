import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CalendarDays,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  Truck,
  User,
  Weight,
  X,
} from "lucide-react";

import {
  createOrder,
  deleteOrder,
  getCustomers,
  getOrders,
  getVehicles,
} from "../api";
import RealMap from "../components/RealMap";


const STATUS_COLORS = {
  New: "status-active",
  Pending: "status-idle",
  "In Transit": "status-idle",
  Delivered: "status-active",
  Cancelled: "status-maintenance",
};


function createInitialForm() {
  return {
    order_code: "",
    customer_id: "",
    vehicle_id: "",
    goods_name: "",
    quantity: "",
    weight_kg: "",
    receiver_name: "",
    receiver_phone: "",
    origin: "",
    destination: "",
    status: "Pending",
    amount: "",
    created_at: new Date().toISOString().slice(0, 10),
  };
}


function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}


export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [orderRows, customerRows, vehicleRows] =
        await Promise.all([
          getOrders(),
          getCustomers(),
          getVehicles(),
        ]);

      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setCustomers(
        Array.isArray(customerRows) ? customerRows : []
      );
      setVehicles(
        Array.isArray(vehicleRows) ? vehicleRows : []
      );

      setSelectedOrder((current) => {
        if (!current) return null;
        return (
          orderRows.find((item) => item.id === current.id) ||
          null
        );
      });
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Orders data load failed.")
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  useEffect(() => {
    setRouteInfo(null);
  }, [selectedOrder?.id]);


  const formVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) => Number(vehicle.id) === Number(form.vehicle_id)
      ) || null,
    [vehicles, form.vehicle_id]
  );


  const detailVehicle = useMemo(() => {
    if (!selectedOrder) return null;

    return (
      selectedOrder.vehicle ||
      vehicles.find(
        (vehicle) =>
          Number(vehicle.id) === Number(selectedOrder.vehicle_id)
      ) ||
      null
    );
  }, [selectedOrder, vehicles]);


  const detailCustomer = useMemo(() => {
    if (!selectedOrder) return null;

    return (
      customers.find(
        (customer) =>
          Number(customer.id) === Number(selectedOrder.customer_id)
      ) || null
    );
  }, [selectedOrder, customers]);


  const selectedRoute = selectedOrder
    ? {
        originName: selectedOrder.origin,
        destinationName: selectedOrder.destination,
      }
    : null;


  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const openNewOrder = () => {
    setForm(createInitialForm());
    setError("");
    setShowForm(true);
  };


  const handleAdd = async (event) => {
    event.preventDefault();
    setError("");

    const requiredFields = [
      [form.order_code, "Order code"],
      [form.customer_id, "Customer"],
      [form.vehicle_id, "Vehicle"],
      [form.goods_name, "Goods name"],
      [form.receiver_name, "Receiver name"],
      [form.receiver_phone, "Receiver phone"],
      [form.origin, "Pickup location"],
      [form.destination, "Destination"],
    ];

    const missing = requiredFields.find(
      ([value]) => !String(value || "").trim()
    );

    if (missing) {
      setError(`${missing[1]} is required.`);
      return;
    }

    if (
      form.origin.trim().toLowerCase() ===
      form.destination.trim().toLowerCase()
    ) {
      setError("Pickup and destination cannot be the same.");
      return;
    }

    const customer = customers.find(
      (item) => Number(item.id) === Number(form.customer_id)
    );

    if (!customer) {
      setError("Selected customer not found.");
      return;
    }

    setSaving(true);

    try {
      const createdOrder = await createOrder({
        order_code: form.order_code.trim(),
        customer_id: Number(form.customer_id),
        customer_name: customer.name,
        vehicle_id: Number(form.vehicle_id),
        goods_name: form.goods_name.trim(),
        quantity: form.quantity.trim(),
        weight_kg: Number(form.weight_kg || 0),
        receiver_name: form.receiver_name.trim(),
        receiver_phone: form.receiver_phone.trim(),
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        status: form.status,
        amount: Number(form.amount || 0),
        created_at: form.created_at || null,
      });

      setForm(createInitialForm());
      setShowForm(false);
      await loadData();
      setSelectedOrder(createdOrder);
    } catch (saveError) {
      setError(
        getErrorMessage(saveError, "Order could not be created.")
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (event, orderId) => {
    event.stopPropagation();

    if (!window.confirm("Delete this order?")) return;

    try {
      await deleteOrder(orderId);

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      await loadData();
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Order could not be deleted.")
      );
    }
  };


  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          <div>
            <div style={{ fontSize: 21, fontWeight: 900 }}>
              Orders Management
            </div>
            <div
              style={{
                marginTop: 4,
                color: "var(--text-500)",
                fontSize: 12,
              }}
            >
              Customer, goods, receiver, vehicle and route management
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-sm"
              onClick={loadData}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={openNewOrder}
            >
              <Plus size={14} /> New Order
            </button>
          </div>
        </div>
      </div>


      {error && (
        <div style={errorStyle}>{error}</div>
      )}


      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <span>Create New Order</span>
            <button
              type="button"
              className="btn-sm"
              onClick={() => setShowForm(false)}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleAdd}>
            <div style={formGridStyle}>
              <Field label="Order Code *">
                <input
                  name="order_code"
                  value={form.order_code}
                  onChange={handleChange}
                  placeholder="ORD-1001"
                  style={inputStyle}
                />
              </Field>

              <Field label="Customer / Sender *">
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` • ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vehicle *">
                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} • {vehicle.status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assigned Driver">
                <div style={readonlyStyle}>
                  {formVehicle?.driver?.name || "Driver not assigned"}
                  {formVehicle?.driver?.phone
                    ? ` • ${formVehicle.driver.phone}`
                    : ""}
                </div>
              </Field>

              <Field label="Goods Name *">
                <input
                  name="goods_name"
                  value={form.goods_name}
                  onChange={handleChange}
                  placeholder="Cotton, Onion, Furniture..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Quantity">
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="50 Bags / 20 Boxes"
                  style={inputStyle}
                />
              </Field>

              <Field label="Weight (KG)">
                <input
                  name="weight_kg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={handleChange}
                  placeholder="2500"
                  style={inputStyle}
                />
              </Field>

              <Field label="Receiver Name *">
                <input
                  name="receiver_name"
                  value={form.receiver_name}
                  onChange={handleChange}
                  placeholder="Receiver full name"
                  style={inputStyle}
                />
              </Field>

              <Field label="Receiver Mobile *">
                <input
                  name="receiver_phone"
                  value={form.receiver_phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  style={inputStyle}
                />
              </Field>

              <Field label="Pickup Location *">
                <input
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="Jalna, Maharashtra"
                  style={inputStyle}
                />
              </Field>

              <Field label="Destination *">
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Pune, Maharashtra"
                  style={inputStyle}
                />
              </Field>

              <Field label="Transport Amount">
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="25000"
                  style={inputStyle}
                />
              </Field>

              <Field label="Order Date">
                <input
                  name="created_at"
                  type="date"
                  value={form.created_at}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option>New</option>
                  <option>Pending</option>
                  <option>In Transit</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </Field>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 16,
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
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "Save Order & Create Trip"}
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="card">
        <div className="card-title">
          <span>All Orders ({orders.length})</span>
          <span style={{ color: "var(--text-500)", fontSize: 11 }}>
            Click an order to view full route
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Goods</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStyle}>No orders yet</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const vehicle =
                    order.vehicle ||
                    vehicles.find(
                      (item) =>
                        Number(item.id) === Number(order.vehicle_id)
                    );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: 800 }}>
                        {order.order_code}
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{order.goods_name || "—"}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {order.origin || "—"}
                        </div>
                        <div style={{ color: "var(--text-500)", fontSize: 10 }}>
                          → {order.destination || "—"}
                        </div>
                      </td>
                      <td>
                        {vehicle?.registration_number || "—"}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            STATUS_COLORS[order.status] || ""
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        ₹{Number(order.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn-sm"
                            onClick={() => setSelectedOrder(order)}
                            title="View order"
                          >
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-sm"
                            onClick={(event) => handleDelete(event, order.id)}
                            title="Delete order"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {selectedOrder && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {selectedOrder.order_code} • Order Details
              </div>
              <div style={{ color: "var(--text-500)", fontSize: 11 }}>
                {selectedOrder.origin} → {selectedOrder.destination}
              </div>
            </div>
            <button
              type="button"
              className="btn-sm"
              onClick={() => setSelectedOrder(null)}
            >
              <X size={15} />
            </button>
          </div>

          <div style={detailGridStyle}>
            <div>
              <Section title="Sender / Customer">
                <DetailRow
                  icon={<User size={15} />}
                  label="Customer"
                  value={selectedOrder.customer_name}
                />
                <DetailRow
                  icon={<Phone size={15} />}
                  label="Sender Mobile"
                  value={detailCustomer?.phone || "—"}
                />
              </Section>

              <Section title="Goods Information">
                <DetailRow
                  icon={<Package size={15} />}
                  label="Goods"
                  value={selectedOrder.goods_name || "—"}
                />
                <DetailRow
                  icon={<Box size={15} />}
                  label="Quantity"
                  value={selectedOrder.quantity || "—"}
                />
                <DetailRow
                  icon={<Weight size={15} />}
                  label="Weight"
                  value={
                    Number(selectedOrder.weight_kg || 0) > 0
                      ? `${selectedOrder.weight_kg} kg`
                      : "—"
                  }
                />
              </Section>

              <Section title="Receiver">
                <DetailRow
                  icon={<User size={15} />}
                  label="Receiver Name"
                  value={selectedOrder.receiver_name || "—"}
                />
                <DetailRow
                  icon={<Phone size={15} />}
                  label="Receiver Mobile"
                  value={selectedOrder.receiver_phone || "—"}
                />
              </Section>

              <Section title="Vehicle & Driver">
                <DetailRow
                  icon={<Truck size={15} />}
                  label="Vehicle"
                  value={detailVehicle?.registration_number || "—"}
                />
                <DetailRow
                  icon={<User size={15} />}
                  label="Driver"
                  value={detailVehicle?.driver?.name || "Not assigned"}
                />
                <DetailRow
                  icon={<Phone size={15} />}
                  label="Driver Mobile"
                  value={detailVehicle?.driver?.phone || "—"}
                />
              </Section>

              <Section title="Order Summary">
                <DetailRow
                  icon={<CalendarDays size={15} />}
                  label="Date"
                  value={selectedOrder.created_at || "—"}
                />
                <DetailRow
                  icon={<Route size={15} />}
                  label="Distance / Time"
                  value={
                    routeInfo?.distanceKm
                      ? `${routeInfo.distanceKm.toFixed(1)} km • ${Math.round(
                          routeInfo.durationMin
                        )} min`
                      : "Calculating route..."
                  }
                />
                <DetailRow
                  icon={<Package size={15} />}
                  label="Amount"
                  value={`₹${Number(
                    selectedOrder.amount || 0
                  ).toLocaleString("en-IN")}`}
                />
              </Section>
            </div>

            <div>
              <div style={routeHeaderStyle}>
                <div>
                  <MapPin size={15} color="#10b981" />
                  <span>
                    <small>Pickup</small>
                    <strong>{selectedOrder.origin}</strong>
                  </span>
                </div>
                <div>
                  <MapPin size={15} color="#ef4444" />
                  <span>
                    <small>Destination</small>
                    <strong>{selectedOrder.destination}</strong>
                  </span>
                </div>
              </div>

              <RealMap
                vehicles={detailVehicle ? [detailVehicle] : []}
                selectedVehicle={detailVehicle}
                route={selectedRoute}
                height={540}
                progressPercent={0}
                onRouteInfo={setRouteInfo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Field({ label, children }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      {children}
    </label>
  );
}


function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}


function DetailRow({ icon, label, value }) {
  return (
    <div style={detailRowStyle}>
      <div style={detailIconStyle}>{icon}</div>
      <div>
        <div style={{ color: "var(--text-500)", fontSize: 10 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 750 }}>
          {value}
        </div>
      </div>
    </div>
  );
}


const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: "var(--text-500)",
  fontSize: 11,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "10px 11px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "#fff",
  color: "var(--text-900)",
  fontSize: 13,
  outline: "none",
};

const readonlyStyle = {
  ...inputStyle,
  minHeight: 39,
  background: "#eef3f7",
  color: "var(--text-500)",
};

const errorStyle = {
  padding: "11px 13px",
  marginBottom: 16,
  border: "1px solid #fecaca",
  borderRadius: 9,
  background: "#fff1f2",
  color: "#be123c",
  fontSize: 12,
  fontWeight: 650,
};

const emptyStyle = {
  padding: 30,
  textAlign: "center",
  color: "var(--text-500)",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 340px) minmax(420px, 1fr)",
  gap: 18,
  alignItems: "start",
};

const sectionTitleStyle = {
  marginBottom: 8,
  color: "var(--text-500)",
  fontSize: 10,
  fontWeight: 850,
  letterSpacing: ".5px",
  textTransform: "uppercase",
};

const detailRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "8px 0",
  borderBottom: "1px solid var(--border)",
};

const detailIconStyle = {
  width: 31,
  height: 31,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  background: "#eaf9f5",
  color: "var(--teal-600)",
};

const routeHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 10,
};


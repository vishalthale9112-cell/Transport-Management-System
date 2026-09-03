import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
});


// =========================================================
// DASHBOARD
// =========================================================

export const getDashboard = () =>
  api.get("/dashboard").then((response) => response.data);


// =========================================================
// VEHICLES
// =========================================================

export const getVehicles = (search = "") =>
  api
    .get(`/vehicles${search ? `?search=${search}` : ""}`)
    .then((response) => response.data);

export const getVehicle = (id) =>
  api.get(`/vehicles/${id}`).then((response) => response.data);

export const createVehicle = (data) =>
  api.post("/vehicles", data).then((response) => response.data);

export const deleteVehicle = (id) =>
  api.delete(`/vehicles/${id}`).then((response) => response.data);


// =========================================================
// DRIVERS
// =========================================================

export const getDrivers = () =>
  api.get("/drivers").then((response) => response.data);

export const createDriver = (data) =>
  api.post("/drivers", data).then((response) => response.data);

export const deleteDriver = (id) =>
  api.delete(`/drivers/${id}`).then((response) => response.data);


// =========================================================
// ORDERS
// =========================================================

export const getOrders = () =>
  api.get("/orders").then((response) => response.data);

export const createOrder = (data) =>
  api.post("/orders", data).then((response) => response.data);

export const deleteOrder = (id) =>
  api.delete(`/orders/${id}`).then((response) => response.data);


// =========================================================
// TRIPS
// =========================================================

export const getTrips = () =>
  api.get("/trips").then((response) => response.data);

export const createTrip = (data) =>
  api.post("/trips", data).then((response) => response.data);

export const deleteTrip = (id) =>
  api.delete(`/trips/${id}`).then((response) => response.data);


// =========================================================
// ALERTS
// =========================================================

export const getAlerts = () =>
  api.get("/alerts").then((response) => response.data);


// =========================================================
// FUEL
// =========================================================

export const getFuelLogs = (vehicleId = null) =>
  api
    .get(`/fuel-logs${vehicleId ? `?vehicle_id=${vehicleId}` : ""}`)
    .then((response) => response.data);

export const createFuelLog = (data) =>
  api.post("/fuel-logs", data).then((response) => response.data);

export const deleteFuelLog = (id) =>
  api.delete(`/fuel-logs/${id}`).then((response) => response.data);


// =========================================================
// MAINTENANCE
// =========================================================

export const getMaintenance = (vehicleId = null) =>
  api
    .get(`/maintenance${vehicleId ? `?vehicle_id=${vehicleId}` : ""}`)
    .then((response) => response.data);

export const createMaintenance = (data) =>
  api.post("/maintenance", data).then((response) => response.data);

export const deleteMaintenance = (id) =>
  api.delete(`/maintenance/${id}`).then((response) => response.data);


// =========================================================
// REAL GPS TRACKING
// =========================================================

export async function createGpsTracker(vehicleId) {
  const response = await fetch(
    `${API_BASE}/gps/tracker/${vehicleId}`,
    { method: "POST" }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "GPS tracking link तयार झाला नाही");
  }

  return data;
}

export async function getLatestGpsLocations() {
  const response = await fetch(`${API_BASE}/gps/latest`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Live GPS locations मिळाल्या नाहीत");
  }

  return data;
}

export async function getLatestVehicleGps(vehicleId) {
  const response = await fetch(
    `${API_BASE}/gps/latest/${vehicleId}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Vehicle GPS location मिळाली नाही");
  }

  return data;
}

export async function getVehicleGpsHistory(vehicleId) {
  const response = await fetch(
    `${API_BASE}/gps/history/${vehicleId}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "GPS route history मिळाली नाही");
  }

  return data;
}


// =========================================================
// CUSTOMERS
// =========================================================

export const getCustomers = (search = "", status = "") => {
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search.trim());
  if (status.trim()) params.set("status", status.trim());

  const query = params.toString();

  return api
    .get(`/customers${query ? `?${query}` : ""}`)
    .then((response) => response.data);
};

export const createCustomer = (data) =>
  api.post("/customers", data).then((response) => response.data);

export const updateCustomer = (id, data) =>
  api.put(`/customers/${id}`, data).then((response) => response.data);

export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then((response) => response.data);


// =========================================================
// INCOME / PAYMENTS
// =========================================================

export const getIncome = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.customerId) {
    params.set("customer_id", filters.customerId);
  }

  if (filters.orderId) {
    params.set("order_id", filters.orderId);
  }

  if (filters.paymentStatus) {
    params.set("payment_status", filters.paymentStatus);
  }

  const query = params.toString();

  return api
    .get(`/income${query ? `?${query}` : ""}`)
    .then((response) => response.data);
};

export const getIncomeSummary = () =>
  api.get("/income/summary").then((response) => response.data);

export const createIncome = (data) =>
  api.post("/income", data).then((response) => response.data);

export const updateIncome = (id, data) =>
  api.put(`/income/${id}`, data).then((response) => response.data);

export const deleteIncome = (id) =>
  api.delete(`/income/${id}`).then((response) => response.data);

// =========================================================
// EXPENSE MANAGEMENT API
// =========================================================

export const getExpenses = (
  category = "",
  status = "",
  vehicleId = null
) => {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (status) {
    params.set("status", status);
  }

  if (vehicleId) {
    params.set("vehicle_id", vehicleId);
  }

  const query = params.toString();

  return api
    .get(`/expenses${query ? `?${query}` : ""}`)
    .then((response) => response.data);
};


export const getExpenseSummary = () =>
  api
    .get("/expenses/summary")
    .then((response) => response.data);


export const createExpense = (data) =>
  api
    .post("/expenses", data)
    .then((response) => response.data);


export const updateExpense = (
  expenseId,
  data
) =>
  api
    .put(`/expenses/${expenseId}`, data)
    .then((response) => response.data);


export const deleteExpense = (expenseId) =>
  api
    .delete(`/expenses/${expenseId}`)
    .then((response) => response.data);

// =========================================================
// REPORTS API
// =========================================================

export const getReportsDashboard = (
  month = ""
) => {
  const query = month
    ? `?month=${encodeURIComponent(month)}`
    : "";

  return api
    .get(`/reports/dashboard${query}`)
    .then((response) => response.data);
};
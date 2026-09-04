import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
});

// =========================================================
// DASHBOARD API
// =========================================================

export const getDashboard = () =>
  api
    .get("/dashboard")
    .then((response) => response.data);

// =========================================================
// VEHICLES API
// =========================================================

export const getVehicles = (search = "") =>
  api
    .get(
      `/vehicles${
        search ? `?search=${search}` : ""
      }`
    )
    .then((response) => response.data);

export const getVehicle = (vehicleId) =>
  api
    .get(`/vehicles/${vehicleId}`)
    .then((response) => response.data);

export const createVehicle = (vehicleData) =>
  api
    .post("/vehicles", vehicleData)
    .then((response) => response.data);

export const deleteVehicle = (vehicleId) =>
  api
    .delete(`/vehicles/${vehicleId}`)
    .then((response) => response.data);

// =========================================================
// DRIVERS API
// =========================================================

export const getDrivers = () =>
  api
    .get("/drivers")
    .then((response) => response.data);

export const createDriver = (driverData) =>
  api
    .post("/drivers", driverData)
    .then((response) => response.data);

export const deleteDriver = (driverId) =>
  api
    .delete(`/drivers/${driverId}`)
    .then((response) => response.data);

// =========================================================
// ORDERS API
// =========================================================

export const getOrders = () =>
  api
    .get("/orders")
    .then((response) => response.data);

export const createOrder = (orderData) =>
  api
    .post("/orders", orderData)
    .then((response) => response.data);

export const deleteOrder = (orderId) =>
  api
    .delete(`/orders/${orderId}`)
    .then((response) => response.data);

// =========================================================
// ALERTS API
// =========================================================

export const getAlerts = () =>
  api
    .get("/alerts")
    .then((response) => response.data);

// =========================================================
// TRIPS API
// =========================================================

export const getTrips = () =>
  api
    .get("/trips")
    .then((response) => response.data);

export const createTrip = (tripData) =>
  api
    .post("/trips", tripData)
    .then((response) => response.data);

export const deleteTrip = (tripId) =>
  api
    .delete(`/trips/${tripId}`)
    .then((response) => response.data);

// =========================================================
// FUEL LOGS API
// =========================================================

export const getFuelLogs = (
  vehicleId = null
) =>
  api
    .get(
      `/fuel-logs${
        vehicleId
          ? `?vehicle_id=${vehicleId}`
          : ""
      }`
    )
    .then((response) => response.data);

export const createFuelLog = (fuelData) =>
  api
    .post("/fuel-logs", fuelData)
    .then((response) => response.data);

// =========================================================
// MAINTENANCE API
// =========================================================

export const getMaintenance = (
  vehicleId = null
) =>
  api
    .get(
      `/maintenance${
        vehicleId
          ? `?vehicle_id=${vehicleId}`
          : ""
      }`
    )
    .then((response) => response.data);

export const createMaintenance = (
  maintenanceData
) =>
  api
    .post("/maintenance", maintenanceData)
    .then((response) => response.data);

export const deleteMaintenance = (
  maintenanceId
) =>
  api
    .delete(`/maintenance/${maintenanceId}`)
    .then((response) => response.data);

// =========================================================
// REAL GPS TRACKING API
// =========================================================

const GPS_API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

export async function createGpsTracker(
  vehicleId
) {
  const response = await fetch(
    `${GPS_API_BASE}/gps/tracker/${vehicleId}`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "GPS tracking link तयार झाला नाही"
    );
  }

  return data;
}

export async function getLatestGpsLocations() {
  const response = await fetch(
    `${GPS_API_BASE}/gps/latest`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Live GPS locations मिळाल्या नाहीत"
    );
  }

  return data;
}

export async function getLatestVehicleGps(
  vehicleId
) {
  const response = await fetch(
    `${GPS_API_BASE}/gps/latest/${vehicleId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Vehicle GPS location मिळाली नाही"
    );
  }

  return data;
}

export async function getVehicleGpsHistory(
  vehicleId
) {
  const response = await fetch(
    `${GPS_API_BASE}/gps/history/${vehicleId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "GPS route history मिळाली नाही"
    );
  }

  return data;
}

// =========================================================
// CUSTOMERS API
// =========================================================

export async function getCustomers(
  search = "",
  status = ""
) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (status.trim()) {
    params.set("status", status.trim());
  }

  const query = params.toString();

  const response = await fetch(
    `${GPS_API_BASE}/customers${
      query ? `?${query}` : ""
    }`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Customers मिळाले नाहीत"
    );
  }

  return data;
}

export async function createCustomer(
  customerData
) {
  const response = await fetch(
    `${GPS_API_BASE}/customers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Customer add झाला नाही"
    );
  }

  return data;
}

export async function updateCustomer(
  customerId,
  customerData
) {
  const response = await fetch(
    `${GPS_API_BASE}/customers/${customerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Customer update झाला नाही"
    );
  }

  return data;
}

export async function deleteCustomer(
  customerId
) {
  const response = await fetch(
    `${GPS_API_BASE}/customers/${customerId}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Customer delete झाला नाही"
    );
  }

  return data;
}

// =========================================================
// NOTIFICATIONS API
// =========================================================

export const getNotifications = ({
  search = "",
  notificationType = "",
  priority = "",
  unreadOnly = false,
} = {}) =>
  api
    .get("/notifications", {
      params: {
        search: search || undefined,
        notification_type:
          notificationType || undefined,
        priority: priority || undefined,
        unread_only: unreadOnly,
      },
    })
    .then((response) => response.data);

export const getNotificationsSummary = () =>
  api
    .get("/notifications/summary")
    .then((response) => response.data);

export const markNotificationRead = (
  notificationId
) =>
  api
    .patch(
      `/notifications/${notificationId}/read`
    )
    .then((response) => response.data);

export const markAllNotificationsRead = () =>
  api
    .patch("/notifications/read-all")
    .then((response) => response.data);

export const clearReadNotifications = () =>
  api
    .delete("/notifications/clear-read")
    .then((response) => response.data);

export const deleteNotification = (
  notificationId
) =>
  api
    .delete(`/notifications/${notificationId}`)
    .then((response) => response.data);
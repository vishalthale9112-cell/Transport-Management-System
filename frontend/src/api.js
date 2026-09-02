import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_BASE });

export const getDashboard = () => api.get("/dashboard").then((r) => r.data);
export const getVehicles = (search = "") =>
  api.get(`/vehicles${search ? `?search=${search}` : ""}`).then((r) => r.data);
export const getVehicle = (id) => api.get(`/vehicles/${id}`).then((r) => r.data);
export const createVehicle = (data) => api.post("/vehicles", data).then((r) => r.data);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`).then((r) => r.data);
export const getDrivers = () => api.get("/drivers").then((r) => r.data);
export const createDriver = (data) => api.post("/drivers", data).then((r) => r.data);
export const deleteDriver = (id) => api.delete(`/drivers/${id}`).then((r) => r.data);
export const getOrders = () => api.get("/orders").then((r) => r.data);
export const createOrder = (data) => api.post("/orders", data).then((r) => r.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then((r) => r.data);
export const getAlerts = () => api.get("/alerts").then((r) => r.data);
export const getTrips = () => api.get("/trips").then((r) => r.data);
export const createTrip = (data) => api.post("/trips", data).then((r) => r.data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`).then((r) => r.data);
export const getFuelLogs = (vehicleId = null) =>
  api.get(`/fuel-logs${vehicleId ? `?vehicle_id=${vehicleId}` : ""}`).then((r) => r.data);
export const createFuelLog = (data) => api.post("/fuel-logs", data).then((r) => r.data);
export const getMaintenance = (vehicleId = null) =>
  api.get(`/maintenance${vehicleId ? `?vehicle_id=${vehicleId}` : ""}`).then((r) => r.data);
export const createMaintenance = (data) => api.post("/maintenance", data).then((r) => r.data);
export const deleteMaintenance = (id) => api.delete(`/maintenance/${id}`).then((r) => r.data);
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
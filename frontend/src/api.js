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
export const getAlerts = () => api.get("/alerts").then((r) => r.data);
export const getTrips = () => api.get("/trips").then((r) => r.data);
export const createTrip = (data) => api.post("/trips", data).then((r) => r.data);
export const deleteTrip = async (id) => {
  const response = await api.delete(`/api/trips/${id}`);
  return response.data;
};
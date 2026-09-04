import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
});

const getData = (response) => response.data;

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    )
  );

// =========================================================
// DASHBOARD API
// =========================================================

export const getDashboard = () =>
  api.get("/dashboard").then(getData);

// =========================================================
// VEHICLES API
// =========================================================

export const getVehicles = (search = "") =>
  api
    .get("/vehicles", {
      params: cleanParams({ search }),
    })
    .then(getData);

export const getVehicle = (vehicleId) =>
  api
    .get(`/vehicles/${vehicleId}`)
    .then(getData);

export const createVehicle = (vehicleData) =>
  api
    .post("/vehicles", vehicleData)
    .then(getData);

export const deleteVehicle = (vehicleId) =>
  api
    .delete(`/vehicles/${vehicleId}`)
    .then(getData);

// =========================================================
// DRIVERS API
// =========================================================

export const getDrivers = (search = "") =>
  api
    .get("/drivers", {
      params: cleanParams({ search }),
    })
    .then(getData);

export const createDriver = (driverData) =>
  api
    .post("/drivers", driverData)
    .then(getData);

export const deleteDriver = (driverId) =>
  api
    .delete(`/drivers/${driverId}`)
    .then(getData);

// =========================================================
// ORDERS API
// =========================================================

export const getOrders = (search = "") =>
  api
    .get("/orders", {
      params: cleanParams({ search }),
    })
    .then(getData);

export const createOrder = (orderData) =>
  api
    .post("/orders", orderData)
    .then(getData);

export const deleteOrder = (orderId) =>
  api
    .delete(`/orders/${orderId}`)
    .then(getData);

// =========================================================
// ALERTS API
// =========================================================

export const getAlerts = () =>
  api.get("/alerts").then(getData);

// =========================================================
// TRIPS API
// =========================================================

export const getTrips = () =>
  api.get("/trips").then(getData);

export const createTrip = (tripData) =>
  api
    .post("/trips", tripData)
    .then(getData);

export const deleteTrip = (tripId) =>
  api
    .delete(`/trips/${tripId}`)
    .then(getData);

// =========================================================
// FUEL LOGS API
// =========================================================

export const getFuelLogs = (
  vehicleId = null
) =>
  api
    .get("/fuel-logs", {
      params: cleanParams({
        vehicle_id: vehicleId,
      }),
    })
    .then(getData);

export const createFuelLog = (fuelData) =>
  api
    .post("/fuel-logs", fuelData)
    .then(getData);

export const deleteFuelLog = (fuelLogId) =>
  api
    .delete(`/fuel-logs/${fuelLogId}`)
    .then(getData);

// =========================================================
// MAINTENANCE API
// =========================================================

export const getMaintenance = (
  vehicleId = null
) =>
  api
    .get("/maintenance", {
      params: cleanParams({
        vehicle_id: vehicleId,
      }),
    })
    .then(getData);

export const createMaintenance = (
  maintenanceData
) =>
  api
    .post("/maintenance", maintenanceData)
    .then(getData);

export const deleteMaintenance = (
  maintenanceId
) =>
  api
    .delete(`/maintenance/${maintenanceId}`)
    .then(getData);

// =========================================================
// REAL GPS TRACKING API
// =========================================================

export const createGpsTracker = (
  vehicleId
) =>
  api
    .post(`/gps/tracker/${vehicleId}`)
    .then(getData);

export const getLatestGpsLocations = () =>
  api.get("/gps/latest").then(getData);

export const getLatestVehicleGps = (
  vehicleId
) =>
  api
    .get(`/gps/latest/${vehicleId}`)
    .then(getData);

export const getVehicleGpsHistory = (
  vehicleId
) =>
  api
    .get(`/gps/history/${vehicleId}`)
    .then(getData);

// =========================================================
// CUSTOMERS API
// =========================================================

export const getCustomers = (
  search = "",
  status = ""
) =>
  api
    .get("/customers", {
      params: cleanParams({
        search,
        status,
      }),
    })
    .then(getData);

export const createCustomer = (
  customerData
) =>
  api
    .post("/customers", customerData)
    .then(getData);

export const updateCustomer = (
  customerId,
  customerData
) =>
  api
    .put(
      `/customers/${customerId}`,
      customerData
    )
    .then(getData);

export const deleteCustomer = (
  customerId
) =>
  api
    .delete(`/customers/${customerId}`)
    .then(getData);

// =========================================================
// INCOME API
// =========================================================

export const getIncome = (
  filters = {}
) => {
  const params =
    typeof filters === "string"
      ? { month: filters }
      : filters;

  return api
    .get("/income", {
      params: cleanParams(params),
    })
    .then(getData);
};

export const getIncomeSummary = (
  month = ""
) =>
  api
    .get("/income/summary", {
      params: cleanParams({ month }),
    })
    .then(getData);

export const createIncome = (
  incomeData
) =>
  api
    .post("/income", incomeData)
    .then(getData);

export const updateIncome = (
  incomeId,
  incomeData
) =>
  api
    .put(`/income/${incomeId}`, incomeData)
    .then(getData);

export const deleteIncome = (
  incomeId
) =>
  api
    .delete(`/income/${incomeId}`)
    .then(getData);

// Compatibility name
export const getIncomeEntries = getIncome;

// =========================================================
// EXPENSES API
// =========================================================

export const getExpenses = (
  filters = {}
) => {
  const params =
    typeof filters === "string"
      ? { month: filters }
      : filters;

  return api
    .get("/expenses", {
      params: cleanParams(params),
    })
    .then(getData);
};

export const getExpensesSummary = (
  month = ""
) =>
  api
    .get("/expenses/summary", {
      params: cleanParams({ month }),
    })
    .then(getData);

export const createExpense = (
  expenseData
) =>
  api
    .post("/expenses", expenseData)
    .then(getData);

export const updateExpense = (
  expenseId,
  expenseData
) =>
  api
    .put(
      `/expenses/${expenseId}`,
      expenseData
    )
    .then(getData);

export const deleteExpense = (
  expenseId
) =>
  api
    .delete(`/expenses/${expenseId}`)
    .then(getData);

// Compatibility names
export const getExpenseSummary =
  getExpensesSummary;

export const getExpenseLogs =
  getExpenses;

// =========================================================
// REPORTS API
// =========================================================

export const getReportsDashboard = (
  month = ""
) =>
  api
    .get("/reports/dashboard", {
      params: cleanParams({ month }),
    })
    .then(getData);

export const getReports = (
  month = ""
) =>
  getReportsDashboard(month);

// =========================================================
// DOCUMENTS API
// =========================================================

export const getDocuments = ({
  search = "",
  documentType = "",
  status = "",
  vehicleId = null,
  driverId = null,
} = {}) =>
  api
    .get("/documents", {
      params: cleanParams({
        search,
        document_type: documentType,
        status,
        vehicle_id: vehicleId,
        driver_id: driverId,
      }),
    })
    .then(getData);

export const getDocumentsSummary = () =>
  api
    .get("/documents/summary")
    .then(getData);

export const uploadDocument = (
  documentData
) =>
  api
    .post(
      "/documents/upload",
      documentData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    )
    .then(getData);

export const updateDocument = (
  documentId,
  documentData
) =>
  api
    .put(
      `/documents/${documentId}`,
      documentData
    )
    .then(getData);

export const deleteDocument = (
  documentId
) =>
  api
    .delete(`/documents/${documentId}`)
    .then(getData);

export const downloadDocument = (
  documentId
) =>
  api
    .get(
      `/documents/${documentId}/download`,
      {
        responseType: "blob",
      }
    )
    .then(getData);

export const getDocumentDownloadUrl = (
  documentId
) =>
  `${API_BASE}/documents/${documentId}/download`;

export const getDocumentFileUrl = (
  fileUrl
) => {
  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  const backendBase =
    API_BASE.replace(/\/api\/?$/, "");

  return `${backendBase}${
    fileUrl.startsWith("/")
      ? fileUrl
      : `/${fileUrl}`
  }`;
};

// Documents.jsx या नावाने function import करते
export const getDocumentViewUrl =
  getDocumentFileUrl;

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
      params: cleanParams({
        search,
        notification_type:
          notificationType,
        priority,
        unread_only: unreadOnly,
      }),
    })
    .then(getData);

export const getNotificationsSummary = () =>
  api
    .get("/notifications/summary")
    .then(getData);

export const markNotificationRead = (
  notificationId
) =>
  api
    .patch(
      `/notifications/${notificationId}/read`
    )
    .then(getData);

export const markAllNotificationsRead = () =>
  api
    .patch("/notifications/read-all")
    .then(getData);

export const clearReadNotifications = () =>
  api
    .delete("/notifications/clear-read")
    .then(getData);

export const deleteNotification = (
  notificationId
) =>
  api
    .delete(`/notifications/${notificationId}`)
    .then(getData);

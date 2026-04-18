/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

/* eslint-disable no-unused-vars */
/* global AdminAPI */

const api = new AdminAPI();

let state = {
  admin: null,
  products: [],
  users: [],
  orders: [],
  vouchers: [],
  admins: [],
  audit: [],
  archivedProducts: [],
  archivedUsers: [],
  archivedOrders: [],
  notifications: [],
  currentOrderId: null,
};

let productFilter = "all";
let orderFilter = "all";
let auditFilter = "all";

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const paginationState = {
  products: 1,
  users: 1,
  orders: 1,
  vouchers: 1,
  admins: 1,
  audit: 1,
  "arch-products": 1,
  "arch-users": 1,
  "arch-orders": 1,
};
const pageSizeState = {
  products: 10,
  users: 10,
  orders: 10,
  vouchers: 10,
  admins: 10,
  audit: 10,
  "arch-products": 10,
  "arch-users": 10,
  "arch-orders": 10,
};

const PROVINCES = ["Vigan", "Baguio", "Tagaytay", "Bohol", "Boracay"];
const SUBCATS = ["Clothes", "Handicrafts", "Delicacies", "Decorations", "Homeware"];
const ORDER_STATUSES = [
  "online_payment_requested",
  "online_payment_processed",
  "cash_on_delivery_requested",
  "cash_on_delivery_approved",
  "processing",
  "waiting_for_courier",
  "shipped",
  "to_be_delivered",
  "delivered",
  "cancelled",
];
const ORDER_FILTER_STATUS_MAP = {
  completed: ["delivered"],
  pending_payment: ["online_payment_requested", "pending"],
  payment_confirmed: ["online_payment_processed", "confirmed"],
  cod_requested: ["cash_on_delivery_requested"],
  cod_confirmed: ["cash_on_delivery_approved"],
  out_for_delivery: ["to_be_delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
  waiting_for_courier: ["waiting_for_courier"],
  shipped: ["shipped"],
  processing: ["processing"],
  "cod requested": ["cash_on_delivery_requested"],
  online_requested: ["online_payment_requested", "pending"],
  "online requested": ["online_payment_requested", "pending"],
  cod_approved: ["cash_on_delivery_approved"],
  "cod approved": ["cash_on_delivery_approved"],
  pending: ["online_payment_requested", "pending"],
};

const ORDER_STATUS_META = {
  online_payment_requested: {
    label: "Pending Payment",
    description: "Order created and waiting for online payment verification.",
    badgeClass: "badge-pending",
    dropdownClass: "status-pending-payment",
    workflowStep: 1,
  },
  pending: {
    label: "Pending Payment",
    description: "Order created and waiting for online payment verification.",
    badgeClass: "badge-pending",
    dropdownClass: "status-pending-payment",
    workflowStep: 1,
  },
  online_payment_processed: {
    label: "Payment Confirmed",
    description: "Online payment has been verified successfully.",
    badgeClass: "badge-processing",
    dropdownClass: "status-payment-confirmed",
    workflowStep: 2,
  },
  confirmed: {
    label: "Payment Confirmed",
    description: "Payment confirmation completed.",
    badgeClass: "badge-processing",
    dropdownClass: "status-payment-confirmed",
    workflowStep: 2,
  },
  cash_on_delivery_requested: {
    label: "COD Requested",
    description: "Cash on Delivery selected and waiting for admin confirmation.",
    badgeClass: "badge-pending",
    dropdownClass: "status-cod-requested",
    workflowStep: 1,
  },
  cash_on_delivery_approved: {
    label: "COD Confirmed",
    description: "Cash on Delivery order is confirmed and ready for preparation.",
    badgeClass: "badge-processing",
    dropdownClass: "status-cod-confirmed",
    workflowStep: 2,
  },
  processing: {
    label: "Processing",
    description: "Order is being prepared and packed.",
    badgeClass: "badge-processing",
    dropdownClass: "status-processing",
    workflowStep: 3,
  },
  waiting_for_courier: {
    label: "Waiting for Courier",
    description: "Order is packed and ready for courier pickup.",
    badgeClass: "badge-processing",
    dropdownClass: "status-waiting-for-courier",
    workflowStep: 4,
  },
  shipped: {
    label: "Shipped",
    description: "Order has been handed over to the courier.",
    badgeClass: "badge-shipped",
    dropdownClass: "status-shipped",
    workflowStep: 5,
  },
  to_be_delivered: {
    label: "Out for Delivery",
    description: "Order is with the rider for final delivery.",
    badgeClass: "badge-shipped",
    dropdownClass: "status-out-for-delivery",
    workflowStep: 6,
  },
  delivered: {
    label: "Delivered",
    description: "Order was successfully delivered to the customer.",
    badgeClass: "badge-completed",
    dropdownClass: "status-delivered",
    workflowStep: 7,
  },
  cancelled: {
    label: "Cancelled",
    description: "Order was cancelled and fulfillment is stopped.",
    badgeClass: "badge-cancelled",
    dropdownClass: "status-cancelled",
    workflowStep: null,
  },
};

const ORDER_TERMINAL_STATUSES = ["delivered", "cancelled"];

function normalizeOrderStatus(status) {
  return String(status || "").toLowerCase().trim();
}

function getOrderStatusMeta(status, paymentMethod = "") {
  const normalizedStatus = normalizeOrderStatus(status);
  const normalizedMethod = String(paymentMethod || "").toLowerCase();
  const baseMeta = ORDER_STATUS_META[normalizedStatus];

  if (!baseMeta) {
    return {
      code: normalizedStatus,
      label: toTitleCase(normalizedStatus),
      description: "Status recorded by the system.",
      badgeClass: "badge-inactive",
      dropdownClass: "status-processing",
      workflowStep: null,
      isKnown: false,
    };
  }

  if (normalizedStatus === "confirmed" && normalizedMethod === "cod") {
    return {
      ...baseMeta,
      code: normalizedStatus,
      label: "COD Confirmed",
      description: "Cash on Delivery order is confirmed and ready for preparation.",
      dropdownClass: "status-cod-confirmed",
      isKnown: true,
    };
  }

  return {
    ...baseMeta,
    code: normalizedStatus,
    isKnown: true,
  };
}

function getOrderFilterStatuses(filter) {
  const normalizedFilter = String(filter || "all").toLowerCase();
  const configured = ORDER_FILTER_STATUS_MAP[normalizedFilter];

  if (!configured) {
    return normalizedFilter === "all" ? [] : [normalizedFilter];
  }

  return Array.isArray(configured)
    ? configured.map(normalizeOrderStatus).filter(Boolean)
    : [normalizeOrderStatus(configured)];
}

function getNextOrderStatus(order) {
  const current = normalizeOrderStatus(order?.status);
  const paymentMethod = resolveOrderPaymentMethod(order?.payment_method, current);

  if (current === "online_payment_requested" || current === "pending") {
    return "online_payment_processed";
  }

  if (current === "online_payment_processed" || (current === "confirmed" && paymentMethod !== "cod")) {
    return "processing";
  }

  if (current === "cash_on_delivery_requested") {
    return "cash_on_delivery_approved";
  }

  if (current === "cash_on_delivery_approved" || (current === "confirmed" && paymentMethod === "cod")) {
    return "processing";
  }

  if (current === "processing") {
    return "waiting_for_courier";
  }

  if (current === "waiting_for_courier") {
    return "shipped";
  }

  if (current === "shipped") {
    return "to_be_delivered";
  }

  if (current === "to_be_delivered") {
    return "delivered";
  }

  return null;
}

function getAllowedOrderStatusTransitions(order) {
  const current = normalizeOrderStatus(order?.status);
  if (!current) return [];

  if (ORDER_TERMINAL_STATUSES.includes(current)) {
    return [current];
  }

  const allowed = [current];
  const next = getNextOrderStatus(order);
  if (next) allowed.push(next);
  allowed.push("cancelled");

  return Array.from(new Set(allowed));
}

function getOrderStatusSelectOptions(order) {
  return getAllowedOrderStatusTransitions(order)
    .map(normalizeOrderStatus)
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toTitleCase(value) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeRoleToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function normalizeAdminRole(value) {
  const role = normalizeRoleToken(value);
  // `role` keeps canonical underscore format; `compactRole` also accepts joined forms (e.g. "shopowner").
  const compactRole = role.replace(/_/g, "");
  if (role === "admin" || role === "shop_owner" || compactRole === "shopowner") return "shop_owner";
  if (role === "staff" || role === "inventory_manager" || compactRole === "inventorymanager") return "inventory_manager";
  if (role === "super_admin" || compactRole === "superadmin") return "super_admin";
  return "unknown";
}

function normalizeCreatableAdminRole(value) {
  const role = normalizeRoleToken(value);
  const compactRole = role.replace(/_/g, "");
  if (role === "admin" || role === "shop_owner" || compactRole === "shopowner") return "shop_owner";
  if (role === "staff" || role === "inventory_manager" || compactRole === "inventorymanager") return "inventory_manager";
  return "";
}

function adminRoleLabel(value) {
  const normalizedRole = normalizeAdminRole(value);
  if (normalizedRole === "shop_owner") return "Admin";
  if (normalizedRole === "inventory_manager") return "Staff";
  if (normalizedRole === "unknown") return "Unknown";
  return toTitleCase(normalizedRole);
}

/**
 * Extracts admin role value from known payload shapes:
 * profile API (`role`) and legacy/auth payloads (`role_name`, `user_role`).
 */
function getAdminRoleValue(admin) {
  if (!admin || typeof admin !== "object") return "";
  const roleKeys = ["role", "role_name", "user_role", "roleName", "userRole", "admin_role"];
  for (const key of roleKeys) {
    const value = admin[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function isSuperAdminSession() {
  const activeRole = normalizeAdminRole(getAdminRoleValue(state.admin));
  if (activeRole === "super_admin") return true;
  if (activeRole !== "unknown") return false;

  const storedRole = normalizeAdminRole(getAdminRoleValue(api.getStoredAdmin()));
  return storedRole === "super_admin";
}

function applySuperAdminAccess() {
  const isSuperAdmin = isSuperAdminSession();
  const navSection = document.getElementById("super-admin-nav-section");
  const navItem = document.getElementById("super-admin-nav-item");
  const addAdminBtn = document.getElementById("add-admin-btn");

  if (navSection) navSection.style.display = isSuperAdmin ? "" : "none";
  if (navItem) navItem.style.display = isSuperAdmin ? "" : "none";
  if (addAdminBtn) addAdminBtn.style.display = isSuperAdmin ? "" : "none";

  if (!isSuperAdmin && getActivePanel() === "admins") {
    const dashboardNav = document.getElementById("dashboard-nav-item");
    switchPanel("dashboard", dashboardNav || null);
  }
}

function resolveOrderPaymentMethod(rawMethod, rawStatus) {
  const method = String(rawMethod || "").toLowerCase();
  if (method) return method;

  const status = String(rawStatus || "").toLowerCase();
  if (status.includes("cash_on_delivery")) return "cod";
  if (status.includes("online_payment")) return "online";
  return "";
}

function formatOrderPaymentMethodLabel(value) {
  const method = String(value || "").toLowerCase();
  if (!method) return "Not specified";

  const map = {
    gcash: "GCash",
    credit_card: "Card",
    debit_card: "Card",
    card: "Card",
    bank_transfer: "Bank Transfer",
    bank: "Bank Transfer",
    paypal: "PayPal",
    cod: "Cash On Delivery",
    online: "Online Payment",
  };

  return map[method] || toTitleCase(method);
}

function getOrderPaymentStatusLabel({ paymentMethod, paymentStatus, orderStatus }) {
  const method = String(paymentMethod || "").toLowerCase();
  const status = String(paymentStatus || "").toLowerCase();
  const order = String(orderStatus || "").toLowerCase();

  if (method === "cod" || order.includes("cash_on_delivery")) {
    return "To be paid";
  }

  if (status === "failed" || status === "refunded") {
    return toTitleCase(status);
  }

  const isOnline = (method && method !== "cod") || order.includes("online_payment");
  if (isOnline) {
    if (["online_payment_requested", "pending"].includes(order)) {
      return "Awaiting Payment";
    }

    if (["pending", "processing"].includes(status)) {
      return "Awaiting Payment";
    }

    return "Paid";
  }

  return status ? toTitleCase(status) : "Not specified";
}

function getOrderPaymentStatusBadge(label) {
  const normalized = String(label || "").toLowerCase();
  let badgeClass = "badge-inactive";

  if (normalized === "paid") badgeClass = "badge-completed";
  else if (normalized === "awaiting payment") badgeClass = "badge-pending";
  else if (normalized === "to be paid") badgeClass = "badge-pending";
  else if (normalized === "failed" || normalized === "refunded") badgeClass = "badge-cancelled";

  return `<span class="badge ${badgeClass}">${escapeHtml(label || "Not specified")}</span>`;
}

function toCurrency(value) {
  const n = Number(value || 0);
  return `₱${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function splitFullName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function getStatusBadge(status) {
  const s = normalizeOrderStatus(status);
  const orderMeta = ORDER_STATUS_META[s];
  if (orderMeta) {
    return `<span class="badge ${orderMeta.badgeClass}">${escapeHtml(orderMeta.label)}</span>`;
  }

  const badgeMap = {
    active: "badge-active",
    inactive: "badge-inactive",
    completed: "badge-completed",
  };
  return `<span class="badge ${badgeMap[s] || "badge-inactive"}">${escapeHtml(toTitleCase(s))}</span>`;
}

function getInventoryStatusBadge(stock) {
  const quantity = Number(stock || 0);

  if (quantity <= 0) {
    return '<span class="badge badge-cancelled">Out of Stock</span>';
  }

  if (quantity <= 3) {
    return '<span class="badge badge-critical">Critical</span>';
  }

  if (quantity <= 10) {
    return '<span class="badge badge-pending">Low Stock</span>';
  }

  return '<span class="badge badge-active">In Stock</span>';
}

function resetPaginationPage(key) {
  if (Object.prototype.hasOwnProperty.call(paginationState, key)) {
    paginationState[key] = 1;
  }
}

function getPageSize(key) {
  const configured = Number(pageSizeState[key] || PAGE_SIZE_OPTIONS[0]);
  return PAGE_SIZE_OPTIONS.includes(configured) ? configured : PAGE_SIZE_OPTIONS[0];
}

function paginateRows(key, rows) {
  const pageSize = getPageSize(key);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let page = paginationState[key] || 1;

  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  paginationState[key] = page;

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  return {
    items: rows.slice(startIndex, endIndex),
    total,
    page,
    totalPages,
    start: total ? startIndex + 1 : 0,
    end: endIndex,
  };
}

function updateTableFooter(footerId, label, meta) {
  const el = document.getElementById(footerId);
  if (!el) return;

  if (!meta.total) {
    el.textContent = `Showing 0 ${label}`;
    return;
  }

  el.textContent = `Showing ${meta.start}-${meta.end} of ${meta.total} ${label}`;
}

function renderTablePagination(key, containerId, total) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pageSize = getPageSize(key);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(paginationState[key] || 1, 1), totalPages);
  paginationState[key] = page;

  container.style.display = "block";

  const prevDisabled = page <= 1 ? "disabled" : "";
  const nextDisabled = page >= totalPages ? "disabled" : "";
  const optionsHtml = PAGE_SIZE_OPTIONS
    .map(size => `<option value="${size}" ${pageSize === size ? "selected" : ""}>${size}</option>`)
    .join("");

  container.innerHTML = `
    <div class="table-pagination-controls">
      <div class="table-page-left">
        <label class="table-page-size">Rows
          <select class="table-page-select" onchange="setTablePageSize('${key}', this.value)">
            ${optionsHtml}
          </select>
        </label>
      </div>
      <button class="btn btn-sm btn-outline" onclick="changeTablePage('${key}', -1)" ${prevDisabled}>Prev</button>
      <span class="table-page-info">Page ${page} of ${totalPages}</span>
      <button class="btn btn-sm btn-outline" onclick="changeTablePage('${key}', 1)" ${nextDisabled}>Next</button>
    </div>
  `;
}

function setTablePageSize(key, value) {
  const nextSize = Number(value);
  if (!PAGE_SIZE_OPTIONS.includes(nextSize)) return;

  pageSizeState[key] = nextSize;
  paginationState[key] = 1;

  const activePanel = getActivePanel();
  if (activePanel !== key) return;

  const query = String(document.getElementById("global-search")?.value || "").trim();
  if (query && ["products", "users", "orders", "vouchers", "admins", "audit"].includes(activePanel)) {
    globalSearch(query, { preservePage: true });
    return;
  }

  renderByPanel(activePanel);
}

function changeTablePage(key, delta) {
  paginationState[key] = Math.max(1, (paginationState[key] || 1) + Number(delta || 0));

  const activePanel = getActivePanel();
  if (activePanel !== key) return;

  const query = String(document.getElementById("global-search")?.value || "").trim();
  if (query && ["products", "users", "orders", "vouchers", "admins", "audit"].includes(activePanel)) {
    globalSearch(query, { preservePage: true });
    return;
  }

  renderByPanel(activePanel);
}

function getActivePanel() {
  const active = document.querySelector(".panel.active");
  return active ? active.id.replace("panel-", "") : "dashboard";
}

function setLoginMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "global-msg " + type;
}

function setLoginFieldErr(errId, text) {
  const el = document.getElementById(errId);
  if (el) el.textContent = text;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 2800);
}

function addNotif(msg) {
  state.notifications.unshift({ id: null, msg, time: new Date().toLocaleTimeString(), read: false });
  renderNotifs();
}

function formatNotifTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function normalizeAdminNotif(row) {
  return {
    id: Number(row.id || 0),
    msg: row.title ? `${row.title}: ${row.message || ""}` : (row.message || ""),
    time: formatNotifTime(row.created_at),
    read: !!row.is_read,
  };
}

async function refreshNotifs() {
  if (!api.isAuthenticated()) {
    state.notifications = [];
    renderNotifs();
    return;
  }

  try {
    const res = await api.getNotifications({ limit: 30 });
    state.notifications = (res.data || []).map(normalizeAdminNotif);
    renderNotifs();
  } catch (err) {
    console.error("Notifications error:", err);
  }
}

async function markNotifRead(id) {
  const notifId = Number(id || 0);
  if (!notifId) return;

  state.notifications = state.notifications.map(n =>
    Number(n.id) === notifId ? { ...n, read: true } : n
  );
  renderNotifs();

  try {
    await api.markNotificationRead(notifId);
  } catch (err) {
    console.error("Mark notification read error:", err);
    await refreshNotifs();
  }
}

function renderNotifs() {
  const count = state.notifications.filter(n => !n.read).length;
  const total = state.notifications.length;
  const countEl = document.getElementById("notif-count");
  const bodyEl = document.getElementById("notif-body");
  if (countEl) countEl.textContent = String(count);
  if (!bodyEl) return;

  bodyEl.innerHTML = total
    ? state.notifications
      .map(n => {
        const unreadClass = n.read ? "" : " unread";
        const onclick = n.id ? ` onclick="markNotifRead('${n.id}')"` : "";
        return `<div class="notif-item${unreadClass}"${onclick}><div class="ni-label">${escapeHtml(n.msg)}</div><div class="ni-time">${escapeHtml(n.time)}</div></div>`;
      })
      .join("")
    : '<div class="notif-empty">No notifications</div>';
}

function toggleNotif() {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;

  const isOpen = panel.classList.toggle("open");
  if (isOpen) {
    refreshNotifs();
  }
}

async function clearNotifs() {
  if (api.isAuthenticated()) {
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error("Clear notifications error:", err);
      showToast(err.message || "Failed to update notifications");
    }
  }

  state.notifications = state.notifications.map(n => ({ ...n, read: true }));
  renderNotifs();

  const panel = document.getElementById("notif-panel");
  if (panel) panel.classList.remove("open");
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";
}

function showLoginScreen() {
  document.getElementById("app").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
}

function showLoginError(msg) {
  setLoginMsg("login-msg", msg, "error");
}

function normalizeLoginErrorMessage(err) {
  const raw = String(err?.message || "").trim();
  const lowered = raw.toLowerCase();

  if (
    lowered.includes("reading 'token'") ||
    lowered.includes('reading "token"') ||
    lowered.includes("cannot read properties of null")
  ) {
    return "Login response was invalid. Hard refresh the page (Ctrl+F5), then verify runtime-config.js adminApiBaseUrl and disable interfering browser extensions.";
  }

  if (
    lowered.includes("unexpected response") ||
    lowered.includes("received html instead of json")
  ) {
    return "Admin API URL is misconfigured. Verify runtime-config.js adminApiBaseUrl points to your api-admin host.";
  }

  if (
    lowered.includes("failed to fetch") ||
    lowered.includes("err_cert_common_name_invalid") ||
    lowered.includes("certificate")
  ) {
    return "Cannot reach Admin API. SSL certificate/domain mismatch detected. Use a valid HTTPS API host in runtime-config.js or serve API from the same domain.";
  }

  return raw || "Login failed.";
}

function setDatabaseStatus(stateLabel, detail = "") {
  const statusEl = document.getElementById("db-status");
  const dotEl = document.getElementById("db-dot");
  const textEl = document.getElementById("db-status-text");
  if (!statusEl || !dotEl || !textEl) return;

  dotEl.classList.remove("checking", "disconnected");
  statusEl.classList.remove("disconnected");

  if (stateLabel === "checking") {
    dotEl.classList.add("checking");
    textEl.textContent = "Database: Checking...";
    return;
  }

  if (stateLabel === "disconnected") {
    dotEl.classList.add("disconnected");
    statusEl.classList.add("disconnected");
    textEl.textContent = detail
      ? `Database: Disconnected (${detail})`
      : "Database: Disconnected";
    return;
  }

  textEl.textContent = "Database: Connected";
}

async function refreshDatabaseStatus() {
  setDatabaseStatus("checking");

  try {
    const res = await api.getHealth();
    const connected = !!res?.data?.database?.connected;
    if (connected) {
      setDatabaseStatus("connected");
    } else {
      setDatabaseStatus("disconnected", res?.data?.database?.error || "Health check failed");
    }
    return connected;
  } catch (err) {
    setDatabaseStatus("disconnected", err.message || "Request failed");
    return false;
  }
}

async function doLogin() {
  const em = document.getElementById("login-email").value.trim();
  const pw = document.getElementById("login-password").value;

  let valid = true;
  if (!em) {
    setLoginFieldErr("login-email-err", "Email is required.");
    valid = false;
  } else {
    setLoginFieldErr("login-email-err", "");
  }

  if (!pw) {
    setLoginFieldErr("login-password-err", "Password is required.");
    valid = false;
  } else {
    setLoginFieldErr("login-password-err", "");
  }

  if (!valid) return;

  setLoginMsg("login-msg", "Logging in...", "");

  try {
    const res = await api.login(em, pw);
    if (!res.success) {
      showLoginError(res.message || "Incorrect email or password.");
      return;
    }

    setLoginMsg("login-msg", "Login successful! Loading dashboard...", "success");
    await refreshDatabaseStatus();
    showApp();
    await loadSecurity();
    await refreshAll();
    await refreshNotifs();
  } catch (err) {
    showLoginError(normalizeLoginErrorMessage(err));
  }
}

async function doLogout() {
  try {
    if (api.isAuthenticated()) {
      await api.revokeAllSessions();
    }
  } catch (err) {
    console.warn("Failed to revoke sessions:", err);
  }

  api.logout();
  showLoginScreen();
  await refreshDatabaseStatus();
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  setLoginMsg("login-msg", "", "");
}

function setupLoginEvents() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") doLogin();
    });
  }

  if (emailInput) {
    emailInput.addEventListener("keydown", e => {
      if (e.key === "Enter") doLogin();
    });
  }

  const toggleBtn = document.getElementById("toggle-login-pw");
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        passwordInput.type = "password";
        toggleBtn.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }
}

function switchPanel(name, el) {
  if (name === "admins" && !isSuperAdminSession()) {
    showToast("Forbidden — super admin access required");
    return;
  }

  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const panel = document.getElementById("panel-" + name);
  if (panel) panel.classList.add("active");
  if (el) el.classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    products: "Product Management",
    users: "User Management",
    orders: "Order Management",
    vouchers: "Voucher Management",
    "arch-products": "Archived Products",
    "arch-users": "Archived Users",
    "arch-orders": "Archived Orders",
    admins: "Admin Management",
    audit: "Audit Trail",
    security: "Security & Settings",
  };

  document.getElementById("topbar-title").textContent = titles[name] || toTitleCase(name);
  renderByPanel(name);
}

function renderByPanel(name) {
  if (name === "dashboard") renderDashboard();
  else if (name === "products") renderProducts();
  else if (name === "users") renderUsers();
  else if (name === "orders") renderOrders();
  else if (name === "vouchers") renderVouchers();
  else if (name === "admins") renderAdmins();
  else if (name === "audit") renderAudit();
  else if (name === "arch-products") renderArchProducts();
  else if (name === "arch-users") renderArchUsers();
  else if (name === "arch-orders") renderArchOrders();
  else if (name === "security") loadSecurity();
}

async function refreshAll() {
  const tasks = [
    renderDashboard(),
    renderProducts(),
    renderUsers(),
    renderOrders(),
    renderVouchers(),
    renderAudit(),
    renderArchProducts(),
    renderArchUsers(),
    renderArchOrders(),
  ];

  if (isSuperAdminSession()) {
    tasks.push(renderAdmins());
  }

  await Promise.allSettled(tasks);
  updateSidebarAdmin();
}

async function renderDashboard() {
  try {
    const [statsRes, auditRes] = await Promise.all([
      api.getDashboardStats(),
      api.getAuditLogs({ limit: 8, page: 1 }),
    ]);

    const d = statsRes.data || {};

    document.getElementById("stat-products").textContent = String(d.total_products || 0);
    document.getElementById("stat-stock").textContent = String(d.total_stock || 0);
    document.getElementById("stat-orders").textContent = String(d.total_orders || 0);
    document.getElementById("stat-pending-sub").textContent = `${d.pending_orders || 0} in fulfillment`;
    document.getElementById("stat-revenue").textContent = toCurrency(d.total_revenue || 0);
    document.getElementById("stat-users").textContent = String(d.total_users || 0);
    document.getElementById("stat-lowstock").textContent = String(d.low_stock_count || 0);

    const categories = d.products_by_category || [];
    document.getElementById("cat-breakdown").innerHTML = categories.length
      ? categories
        .map(c => `<div class="cat-row"><span class="cat-name">${escapeHtml(c.category)}</span><span class="cat-count">${escapeHtml(c.count)}</span></div>`)
        .join("")
      : '<div style="color:var(--text-muted);font-size:13px">No products</div>';

    const statusMap = {};
    (d.orders_by_status || []).forEach(s => {
      statusMap[String(s.status || "").toLowerCase()] = Number(s.count || 0);
    });

    const statusBuckets = [
      { key: "pending_payment", statuses: ["online_payment_requested", "pending"], label: "Pending Payment" },
      { key: "payment_confirmed", statuses: ["online_payment_processed", "confirmed"], label: "Payment Confirmed" },
      { key: "cod_requested", statuses: ["cash_on_delivery_requested"], label: "COD Requested" },
      { key: "cod_confirmed", statuses: ["cash_on_delivery_approved"], label: "COD Confirmed" },
      { key: "processing", statuses: ["processing"], label: "Processing" },
      { key: "waiting_for_courier", statuses: ["waiting_for_courier"], label: "Waiting for Courier" },
      { key: "shipped", statuses: ["shipped"], label: "Shipped" },
      { key: "out_for_delivery", statuses: ["to_be_delivered"], label: "Out for Delivery" },
      { key: "delivered", statuses: ["delivered"], label: "Delivered" },
      { key: "cancelled", statuses: ["cancelled"], label: "Cancelled" },
    ];
    document.getElementById("order-status-breakdown").innerHTML = statusBuckets
      .map(bucket => {
        const count = bucket.statuses.reduce((sum, status) => sum + Number(statusMap[status] || 0), 0);
        return `<div class="ost"><div class="ost-val">${count}</div><div class="ost-lbl">${escapeHtml(bucket.label)}</div></div>`;
      })
      .join("");

    const topSelling = d.top_selling || [];
    document.getElementById("top-selling").innerHTML = topSelling.length
      ? topSelling
        .map((item, idx) => `<tr><td>${idx + 1}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.sold)}</td></tr>`)
        .join("")
      : '<tr><td colspan="3" style="color:var(--text-muted)">No sales data</td></tr>';

    const alerts = d.inventory_alerts || [];
    document.getElementById("inv-alerts").innerHTML = alerts.length
      ? alerts
        .map(a => `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.stock)}</td><td>${getInventoryStatusBadge(a.stock)}</td></tr>`)
        .join("")
      : '<tr><td colspan="3" style="color:var(--text-muted)">All stock levels healthy</td></tr>';

    state.audit = auditRes.data || [];
    document.getElementById("activity-log").innerHTML = state.audit.length
      ? state.audit
        .map(a => `<div class="activity-item"><div class="act-dot"></div><div><div>${escapeHtml(a.description || `${a.action} ${a.entity}`)}</div><div class="act-time">${escapeHtml(a.created_at || "")}${a.admin_name ? ` · ${escapeHtml(a.admin_name)}` : ""}</div></div></div>`)
        .join("")
      : '<div style="color:var(--text-muted);font-size:13px">No recent activity</div>';
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

async function loadDashboard() {
  await renderDashboard();
}

function getImageFileName(src) {
  if (!src) return "No image selected";

  try {
    const parsed = new URL(src, window.location.origin);
    const segment = decodeURIComponent((parsed.pathname || "").split("/").pop() || "");
    return segment || "Uploaded image";
  } catch {
    const segment = decodeURIComponent(String(src).split("?")[0].split("/").pop() || "");
    return segment || "Uploaded image";
  }
}

function updateImagePreviewMeta(src) {
  const nameEl = document.getElementById("p-image-name");
  const dimEl = document.getElementById("p-image-dim");
  if (!nameEl || !dimEl) return;

  if (!src) {
    nameEl.textContent = "No image selected";
    dimEl.textContent = "-";
    return;
  }

  nameEl.textContent = getImageFileName(src);
  dimEl.textContent = "Loading dimensions...";
}

function getAdminAssetBaseUrl() {
  if (api?.baseURL && String(api.baseURL).trim() !== "") {
    return String(api.baseURL).replace(/\/+$/, "");
  }

  if (window.SOUCUL_ADMIN_API_BASE_URL) {
    return String(window.SOUCUL_ADMIN_API_BASE_URL).replace(/\/+$/, "");
  }

  if (window.__SOUCUL_CONFIG__?.adminApiBaseUrl) {
    return String(window.__SOUCUL_CONFIG__.adminApiBaseUrl).replace(/\/+$/, "");
  }

  return window.location.origin;
}

function resolveProductImageUrl(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const base = getAdminAssetBaseUrl();
  if (raw.startsWith("/")) {
    return `${base}${raw}`;
  }

  return `${base}/${raw.replace(/^\/+/, "")}`;
}

function buildProductCoverCell(imageUrl, productName = "Product") {
  const resolvedImageUrl = resolveProductImageUrl(imageUrl);
  const safeName = escapeHtml(productName || "Product");

  if (!resolvedImageUrl) {
    return `
      <div class="product-cover" aria-label="No cover image for ${safeName}">
        <div class="product-cover-fallback"><i class="fa-solid fa-image"></i></div>
      </div>
    `;
  }

  return `
    <div class="product-cover" aria-label="Cover image for ${safeName}">
      <img class="img-preview" src="${escapeHtml(resolvedImageUrl)}" alt="${safeName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="product-cover-fallback" style="display:none"><i class="fa-solid fa-image"></i></div>
    </div>
  `;
}

function normalizeProduct(p) {
  const price = Number(p.price || 0);
  const discountPrice = p.discount_price != null ? Number(p.discount_price) : null;
  const discount = discountPrice != null && price > 0
    ? Math.max(0, Math.round((1 - discountPrice / price) * 100))
    : 0;
  return {
    id: p.id,
    name: p.name,
    brand: p.material || p.brand || "",
    desc: p.description || "",
    category: p.category || "",
    subcategory: p.subcategory || "",
    status: p.is_active ? "Active" : "Inactive",
    stock: Number(p.stock || 0),
    price,
    discount,
    image: resolveProductImageUrl(p.image || p.featured_image_url || p.featured_image || ""),
  };
}

function filterProducts(cat, el) {
  productFilter = cat;
  resetPaginationPage("products");
  document.querySelectorAll("#product-filter-bar .filter-btn").forEach(b => b.classList.remove("active"));
  if (el) el.classList.add("active");
  renderProducts();
}

async function renderProducts(list) {
  try {
    let data = list;
    if (!data) {
      const params = { limit: 200 };
      if (PROVINCES.includes(productFilter)) params.location = productFilter;
      if (SUBCATS.includes(productFilter)) params.category = productFilter;

      const res = await api.getProducts(params);
      state.products = (res.data || []).map(normalizeProduct);
      data = state.products;
    }

    const paged = paginateRows("products", data);
    const tbody = document.getElementById("products-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(p => `
      <tr>
        <td>${buildProductCoverCell(p.image, p.name)}</td>
        <td><div style="font-weight:500">${escapeHtml(p.name)}</div><div style="font-size:12px;color:var(--text-muted)">${escapeHtml(p.brand)}</div></td>
        <td><span class="badge badge-shipped" style="font-size:10px">${escapeHtml(p.category)}</span></td>
        <td><span class="badge badge-user" style="font-size:10px">${escapeHtml(p.subcategory || "-")}</span></td>
        <td><span class="${p.stock < 10 ? "badge badge-pending" : ""}">${p.stock}</span></td>
        <td>${toCurrency(p.price)}${p.discount > 0 ? ` <span style="font-size:11px;color:var(--accent-coral)">-${p.discount}%</span>` : ""}</td>
        <td>${getStatusBadge(p.status)}</td>
        <td style="gap:6px;">
          <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="archiveProduct('${p.id}')">Archive</button>
        </td>
      </tr>
    `).join("")
      : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No products found</td></tr>';

    updateTableFooter("products-footer", "products", paged);
    renderTablePagination("products", "products-pagination", paged.total);
  } catch (err) {
    console.error("Products error:", err);
    showToast(err.message || "Failed to load products");
  }
}

async function loadProducts() {
  await renderProducts();
}

function setProductImagePreview(src) {
  const imageField = document.getElementById("p-image");
  const previewImage = document.getElementById("p-image-preview");
  if (!imageField || !previewImage) return;

  imageField.value = src;
  previewImage.src = src;
  previewImage.alt = `Preview: ${getImageFileName(src)}`;

  updateImagePreviewMeta(src);

  previewImage.onload = () => {
    const dimEl = document.getElementById("p-image-dim");
    if (dimEl) dimEl.textContent = `${previewImage.naturalWidth}x${previewImage.naturalHeight}`;
  };

  previewImage.onerror = () => {
    const dimEl = document.getElementById("p-image-dim");
    if (dimEl) dimEl.textContent = "Preview unavailable";
  };

  document.getElementById("img-upload-placeholder").style.display = "none";
  document.getElementById("img-upload-preview").style.display = "flex";
}

function clearProductImage() {
  document.getElementById("p-image").value = "";
  document.getElementById("p-image-file").value = "";
  document.getElementById("p-image-preview").src = "";
  document.getElementById("img-upload-placeholder").style.display = "flex";
  document.getElementById("img-upload-preview").style.display = "none";
  updateImagePreviewMeta("");
}

async function uploadProductImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please choose a valid image file");
    return;
  }

  const productName = String(document.getElementById("p-name")?.value || "").trim();
  const location = String(document.getElementById("p-category")?.value || "").trim();

  if (!productName || !location) {
    showToast("Set Product Name and Province before uploading image");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Image must be under 5MB");
    return;
  }

  try {
    const res = await api.uploadProductImage(file, {
      productName,
      location,
    });
    const imageUrl = res?.data?.url;

    if (!imageUrl) {
      throw new Error("Upload succeeded but image URL is missing");
    }

    setProductImagePreview(imageUrl);
    showToast("Image uploaded. Click Save Product to apply.");
  } catch (err) {
    console.error("Image upload error:", err);
    showToast(err.message || "Failed to upload image");
  }
}

async function handleImgUpload(input) {
  const file = input.files[0];
  if (!file) return;

  await uploadProductImageFile(file);
}

async function handleImgDrop(event) {
  event.preventDefault();
  document.getElementById("img-upload-area").classList.remove("drag-over");

  const file = event.dataTransfer.files[0];
  await uploadProductImageFile(file);
}

function updateSubcategoryOptions() {
  // Keep all static options for now; backend validates category and subcategory values.
}

async function saveProduct() {
  const id = document.getElementById("edit-product-id").value;
  const stockVal = Number(document.getElementById("p-stock").value || 0);
  const addStock = Number(document.getElementById("p-addstock").value || 0);

  const payload = {
    name: document.getElementById("p-name").value.trim(),
    material: document.getElementById("p-brand").value.trim(),
    description: document.getElementById("p-desc").value.trim(),
    category: document.getElementById("p-category").value,
    subcategory: document.getElementById("p-subcategory").value,
    status: document.getElementById("p-status").value,
    stock: Math.max(0, stockVal + addStock),
    price: Number(document.getElementById("p-price").value || 0),
    discount: Number(document.getElementById("p-discount").value || 0),
    image: document.getElementById("p-image").value,
  };

  if (!payload.name || !payload.description || !payload.category || !payload.subcategory || !payload.price) {
    showToast("Fill in required fields");
    return;
  }

  try {
    if (id) {
      await api.updateProduct(id, payload);
      showToast("Product updated!");
    } else {
      await api.createProduct(payload);
      showToast("Product added!");
    }

    closeModal("modal-product");
    await renderProducts();
    await renderDashboard();
    await renderArchProducts();
  } catch (err) {
    console.error("Save product error:", err);
    showToast(err.message || "Failed to save product");
  }
}

async function editProduct(id) {
  const product = state.products.find(p => String(p.id) === String(id));
  if (!product) {
    showToast("Product not found in current list");
    return;
  }

  document.getElementById("product-modal-title").textContent = "Edit Product";
  document.getElementById("edit-product-id").value = product.id;
  document.getElementById("p-name").value = product.name;
  document.getElementById("p-brand").value = product.brand;
  document.getElementById("p-desc").value = product.desc;
  document.getElementById("p-category").value = product.category;
  document.getElementById("p-subcategory").value = product.subcategory;
  document.getElementById("p-status").value = product.status;
  document.getElementById("p-stock").value = product.stock;
  document.getElementById("p-addstock").value = "";
  document.getElementById("p-price").value = product.price;
  document.getElementById("p-discount").value = product.discount;
  document.getElementById("p-image").value = product.image;
  if (product.image) setProductImagePreview(product.image);
  else clearProductImage();

  openModal("modal-product");
}

async function archiveProduct(id) {
  try {
    await api.archiveProduct(id);
    showToast("Product archived");
    await renderProducts();
    await renderArchProducts();
    await renderDashboard();
    await refreshNotifs();
  } catch (err) {
    console.error("Archive product error:", err);
    showToast(err.message || "Failed to archive product");
  }
}

function censorEmail(email) {
  const [local, domain] = String(email || "").split("@");
  if (!domain) return email || "-";
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function censorName(name) {
  const n = String(name || "").trim();
  if (!n) return "-";
  return n
    .split(" ")
    .map((w, i) => (i === 0 ? `${w.slice(0, 1)}${"*".repeat(Math.max(w.length - 1, 3))}` : "*".repeat(w.length || 3)))
    .join(" ");
}

function censorPhone(phone) {
  const s = String(phone || "").replace(/\D/g, "");
  if (!s) return "-";
  return `${s.slice(0, 3)}${"*".repeat(Math.max(s.length - 5, 3))}${s.slice(-2)}`;
}

function censorAddress(address) {
  const text = String(address || "");
  if (!text) return "-";
  const parts = text.split(",");
  const masked = "*".repeat(8);
  return parts.length > 1 ? `${masked},${parts.slice(1).join(",")}` : masked;
}

async function renderUsers(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getUsers({ limit: 200 });
      data = res.data || [];
      state.users = data;
    }

    const paged = paginateRows("users", data);
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(u => {
        const names = splitFullName(u.full_name);
        const firstName = u.first_name || names.firstName || "-";
        const lastName = u.last_name || names.lastName || "-";
        return `
        <tr>
          <td><b>${escapeHtml(firstName)}</b></td>
          <td>${escapeHtml(lastName)}</td>
          <td>${escapeHtml(censorEmail(u.email))}</td>
          <td style="font-family:monospace">••••••</td>
          <td><span class="badge badge-user">User</span></td>
          <td style="gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="viewUserOrders('${u.id}')">Orders</button>
            <button class="btn btn-sm btn-danger" onclick="archiveUser('${u.id}')">Archive</button>
          </td>
        </tr>
      `;
      }).join("")
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No users registered</td></tr>';

    updateTableFooter("users-footer", "users", paged);
    renderTablePagination("users", "users-pagination", paged.total);
  } catch (err) {
    console.error("Users error:", err);
    showToast(err.message || "Failed to load users");
  }
}

async function loadUsers() {
  await renderUsers();
}

function changeUserRole() {
  showToast("Role changes for customers are not supported by this API.");
}

async function viewUserOrders(uid) {
  try {
    const res = await api.getUserDetails(uid);
    const orders = (res.data && res.data.orders) || [];
    document.getElementById("uo-tbody").innerHTML = orders.length
      ? orders.map(o => `<tr><td>${escapeHtml(o.order_number || o.id)}</td><td>${toCurrency(o.total_amount || 0)}</td><td>${getStatusBadge(o.status)}</td><td>${escapeHtml(o.created_at || "")}</td></tr>`).join("")
      : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No orders</td></tr>';
    openModal("modal-user-orders");
  } catch (err) {
    console.error("User orders error:", err);
    showToast(err.message || "Failed to load user orders");
  }
}

async function archiveUser(id) {
  try {
    await api.archiveUser(id);
    showToast("User archived");
    await renderUsers();
    await renderArchUsers();
    await renderDashboard();
  } catch (err) {
    console.error("Archive user error:", err);
    showToast(err.message || "Failed to archive user");
  }
}

async function toggleUser(id) {
  try {
    await api.toggleUserStatus(id);
    await renderUsers();
  } catch (err) {
    console.error("Toggle user error:", err);
    showToast(err.message || "Failed to toggle user status");
  }
}

function filterOrders(status, el) {
  orderFilter = status;
  resetPaginationPage("orders");
  document.querySelectorAll("#panel-orders .filter-btn").forEach(b => b.classList.remove("active"));
  if (el) el.classList.add("active");
  renderOrders();
}

function getConfirmPill(order) {
  const status = normalizeOrderStatus(order?.status);
  if (status === "delivered") {
    return '<span class="confirm-pill confirm-received" title="Customer confirmed receipt"><i class="fa-solid fa-circle-check"></i> Received</span>';
  }
  if (["shipped", "to_be_delivered"].includes(status)) {
    return '<span class="confirm-pill confirm-pending" title="Waiting for customer confirmation"><i class="fa-regular fa-clock"></i> Pending</span>';
  }
  return "";
}

async function simulateCustomerReceived(id) {
  await changeOrderStatusInline(id, "delivered");
}

async function simulatePaymentConfirmation(id) {
  await changeOrderStatusInline(id, "online_payment_processed");
}

async function changeOrderStatusInline(id, newStatus) {
  try {
    const status = normalizeOrderStatus(newStatus);
    const currentOrder = state.orders.find(o => String(o.id) === String(id));

    if (currentOrder) {
      const allowedStatuses = getAllowedOrderStatusTransitions(currentOrder);
      if (!allowedStatuses.includes(status)) {
        showToast("Invalid transition. Follow the next workflow step.");
        return;
      }
    }

    await api.updateOrderStatus(id, status);
    const paymentMethod = resolveOrderPaymentMethod(currentOrder?.payment_method, currentOrder?.status);
    const statusMeta = getOrderStatusMeta(status, paymentMethod);
    showToast(`Order ${id} -> ${statusMeta.label}`);
    await renderOrders();
    await renderDashboard();
    await refreshNotifs();

    if (String(state.currentOrderId || "") === String(id)) {
      await viewOrder(id);
    }
  } catch (err) {
    console.error("Change order status error:", err);
    showToast(err.message || "Failed to update order status");
  }
}

async function renderOrders(list) {
  try {
    let data = list;
    if (!data) {
      const params = { limit: 200 };
      const normalizedFilter = String(orderFilter || "").toLowerCase();
      const filterStatuses = getOrderFilterStatuses(normalizedFilter);

      if (normalizedFilter !== "all") {
        if (filterStatuses.length === 1) {
          params.status = filterStatuses[0];
        }
      }

      const res = await api.getOrders(params);
      data = res.data || [];

      if (normalizedFilter !== "all" && filterStatuses.length > 1) {
        data = data.filter(order => filterStatuses.includes(normalizeOrderStatus(order.status)));
      }

      state.orders = data;
    }

    const paged = paginateRows("orders", data);
    const tbody = document.getElementById("orders-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(o => {
        const status = normalizeOrderStatus(o.status);
        const resolvedPaymentMethod = resolveOrderPaymentMethod(o.payment_method, status);
        const statusMeta = getOrderStatusMeta(status, resolvedPaymentMethod);
        const paymentMethodLabel = formatOrderPaymentMethodLabel(resolvedPaymentMethod);
        const paymentStatusLabel = getOrderPaymentStatusLabel({
          paymentMethod: resolvedPaymentMethod,
          paymentStatus: o.payment_status,
          orderStatus: status,
        });
        const statusesForSelect = getOrderStatusSelectOptions({
          ...o,
          status,
          payment_method: resolvedPaymentMethod,
        });
        const nextStatus = getNextOrderStatus({
          ...o,
          status,
          payment_method: resolvedPaymentMethod,
        });
        const nextStatusMeta = nextStatus ? getOrderStatusMeta(nextStatus, resolvedPaymentMethod) : null;
        const isTerminal = ORDER_TERMINAL_STATUSES.includes(status);
        const canSimulatePayment = resolvedPaymentMethod !== "cod"
          && ["online_payment_requested", "pending"].includes(status);
        return `
        <tr>
          <td><b>${escapeHtml(o.order_number || o.id)}</b></td>
          <td>${escapeHtml(censorName(o.customer))}</td>
          <td>${toCurrency(o.total_amount || 0)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <select class="status-dropdown ${statusMeta.dropdownClass}" onchange="changeOrderStatusInline('${o.id}', this.value)" ${isTerminal ? "disabled" : ""}>
                ${statusesForSelect.map(s => {
                  const optionMeta = getOrderStatusMeta(s, resolvedPaymentMethod);
                  return `<option value="${s}" ${status === s ? "selected" : ""}>${escapeHtml(optionMeta.label)}</option>`;
                }).join("")}
              </select>
              ${getConfirmPill(o)}
            </div>
            <div class="status-help-text">${escapeHtml(statusMeta.description)}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px">
              <span class="badge badge-user">${escapeHtml(paymentMethodLabel)}</span>
              ${getOrderPaymentStatusBadge(paymentStatusLabel)}
            </div>
          </td>
          <td>${escapeHtml(o.created_at || "")}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap">
            ${canSimulatePayment ? `<button class="btn btn-sm btn-gold" onclick="simulatePaymentConfirmation('${o.id}')">Simulate Payment Confirmed</button>` : ""}
            ${nextStatusMeta ? `<button class="btn btn-sm btn-teal" onclick="changeOrderStatusInline('${o.id}', '${nextStatus}')">Next: ${escapeHtml(nextStatusMeta.label)}</button>` : ""}
            <button class="btn btn-sm btn-outline" onclick="viewOrder('${o.id}')">View</button>
            <button class="btn btn-sm btn-danger" onclick="archiveOrder('${o.id}')">Archive</button>
          </td>
        </tr>
      `;
      }).join("")
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No orders found</td></tr>';

    updateTableFooter("orders-footer", "orders", paged);
    renderTablePagination("orders", "orders-pagination", paged.total);
  } catch (err) {
    console.error("Orders error:", err);
    showToast(err.message || "Failed to load orders");
  }
}

async function loadOrders() {
  await renderOrders();
}

async function updateOrder(id) {
  const order = state.orders.find(o => String(o.id) === String(id));
  if (!order) return;

  const nextStatus = getNextOrderStatus(order);
  if (!nextStatus) return;

  await changeOrderStatusInline(id, nextStatus);
}

async function viewOrder(id) {
  try {
    const res = await api.getOrderDetails(id);
    const o = res.data;
    state.currentOrderId = id;
    const payment = o.payment || {};
    const resolvedPaymentMethod = resolveOrderPaymentMethod(payment.payment_method, o.status);
    const paymentMethodLabel = formatOrderPaymentMethodLabel(resolvedPaymentMethod);
    const paymentStatusLabel = getOrderPaymentStatusLabel({
      paymentMethod: resolvedPaymentMethod,
      paymentStatus: payment.payment_status,
      orderStatus: o.status,
    });

    document.getElementById("od-name").textContent = censorName(o.customer);
    document.getElementById("od-email").textContent = censorEmail(o.email);
    document.getElementById("od-phone").textContent = censorPhone(o.user_phone || o.shipping_phone || o.phone);
    document.getElementById("od-id").textContent = o.order_number || o.id;
    const statusMeta = getOrderStatusMeta(o.status, resolvedPaymentMethod);
    const nextStatus = getNextOrderStatus({
      ...o,
      payment_method: resolvedPaymentMethod,
    });
    const nextStatusMeta = nextStatus ? getOrderStatusMeta(nextStatus, resolvedPaymentMethod) : null;

    document.getElementById("od-status").innerHTML = `${getStatusBadge(o.status)} ${getConfirmPill(o)}`;
    document.getElementById("od-workflow-step").textContent = statusMeta.workflowStep ? `Step ${statusMeta.workflowStep} of 7` : "Final";
    document.getElementById("od-next-step").textContent = nextStatusMeta ? nextStatusMeta.label : "No further action";
    document.getElementById("od-status-note").textContent = statusMeta.description;
    document.getElementById("od-payment-method").textContent = paymentMethodLabel;
    document.getElementById("od-payment-status").innerHTML = getOrderPaymentStatusBadge(paymentStatusLabel);
    document.getElementById("od-total").textContent = toCurrency(o.total_amount || 0);
    document.getElementById("od-date").textContent = o.created_at || "";

    const advanceBtn = document.getElementById("od-advance-btn");
    if (advanceBtn) {
      advanceBtn.disabled = !nextStatus;
      advanceBtn.textContent = nextStatusMeta
        ? `Move to ${nextStatusMeta.label}`
        : "No Next Step";
    }

    const address = [o.shipping_address, o.shipping_city, o.shipping_province].filter(Boolean).join(", ");
    document.getElementById("od-address").textContent = censorAddress(address);

    const items = o.items || [];
    document.getElementById("od-items").innerHTML = items.length
      ? items.map(i => `<tr><td>${escapeHtml(i.product_name)}</td><td>${escapeHtml(i.quantity)}</td><td>${toCurrency(i.unit_price || 0)}</td><td>${toCurrency(i.total_price || 0)}</td></tr>`).join("")
      : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No items</td></tr>';

    openModal("modal-order");
  } catch (err) {
    console.error("View order error:", err);
    showToast(err.message || "Failed to load order details");
  }
}

async function updateOrderStatus() {
  let order = state.orders.find(o => String(o.id) === String(state.currentOrderId));

  if (!order && state.currentOrderId) {
    try {
      const res = await api.getOrderDetails(state.currentOrderId);
      order = res.data || null;
      if (order && !order.payment_method && order.payment?.payment_method) {
        order.payment_method = order.payment.payment_method;
      }
    } catch (err) {
      console.error("Order detail fetch error:", err);
    }
  }

  if (!order) {
    showToast("Order not found");
    return;
  }

  const nextStatus = getNextOrderStatus(order);
  if (!nextStatus) {
    showToast("Order already in final status");
    return;
  }

  await changeOrderStatusInline(order.id, nextStatus);
}

async function archiveOrder(id) {
  try {
    await api.archiveOrder(id);
    showToast("Order archived");
    await renderOrders();
    await renderArchOrders();
    await renderDashboard();
  } catch (err) {
    console.error("Archive order error:", err);
    showToast(err.message || "Failed to archive order");
  }
}

function mapVoucherTypeLabel(type) {
  return String(type || "").toLowerCase() === "fixed" ? "Fixed Amount (₱)" : "Percentage (%)";
}

function mapVoucherTypeValue(typeLabel) {
  return typeLabel === "Fixed Amount (₱)" ? "fixed" : "percentage";
}

function voucherValueDisplay(v) {
  return String(v.discount_type || "").toLowerCase() === "fixed"
    ? toCurrency(v.discount_value || 0)
    : `${Number(v.discount_value || 0)}%`;
}

async function renderVouchers(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getVouchers({ limit: 200 });
      data = res.data || [];
      state.vouchers = data;
    }

    const paged = paginateRows("vouchers", data);
    const tbody = document.getElementById("vouchers-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(v => `
      <tr>
        <td><span class="voucher-code">${escapeHtml(v.code)}</span></td>
        <td>${escapeHtml(mapVoucherTypeLabel(v.discount_type))}</td>
        <td>${escapeHtml(voucherValueDisplay(v))}</td>
        <td>${toCurrency(v.min_purchase_amount || 0)}</td>
        <td>${Number(v.usage_count || 0)}/${v.usage_limit == null ? "∞" : escapeHtml(v.usage_limit)}</td>
        <td>${escapeHtml(toInputDate(v.valid_until))}</td>
        <td>${getStatusBadge(v.status || "inactive")}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-sm btn-outline" onclick="editVoucher('${v.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteVoucher('${v.id}')">Delete</button>
        </td>
      </tr>
    `).join("")
      : '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No vouchers</td></tr>';

    updateTableFooter("vouchers-footer", "vouchers", paged);
    renderTablePagination("vouchers", "vouchers-pagination", paged.total);
  } catch (err) {
    console.error("Vouchers error:", err);
    showToast(err.message || "Failed to load vouchers");
  }
}

async function loadVouchers() {
  await renderVouchers();
}

async function saveVoucher() {
  const id = document.getElementById("edit-voucher-id").value;

  const payload = {
    code: (document.getElementById("v-code").value || "").toUpperCase().trim(),
    status: String(document.getElementById("v-status").value || "active").toLowerCase(),
    discount_type: mapVoucherTypeValue(document.getElementById("v-type").value),
    discount_value: Number(document.getElementById("v-value").value || 0),
    min_purchase_amount: Number(document.getElementById("v-minpurchase").value || 0),
    max_discount_amount: Number(document.getElementById("v-maxdiscount").value || 0) || null,
    usage_limit: Number(document.getElementById("v-limit").value || 0) || null,
    per_user_limit: Number(document.getElementById("v-userlimit").value || 0) || null,
    valid_from: document.getElementById("v-from").value,
    valid_until: document.getElementById("v-until").value,
    description: document.getElementById("v-desc").value.trim(),
  };

  if (!payload.code || !payload.discount_type || !payload.discount_value || !payload.valid_from || !payload.valid_until) {
    showToast("Fill required voucher fields");
    return;
  }

  try {
    if (id) {
      await api.updateVoucher(id, payload);
      showToast("Voucher updated!");
    } else {
      await api.createVoucher(payload);
      showToast("Voucher created!");
    }

    closeModal("modal-voucher");
    await renderVouchers();
  } catch (err) {
    console.error("Save voucher error:", err);
    showToast(err.message || "Failed to save voucher");
  }
}

function editVoucher(id) {
  const v = state.vouchers.find(x => String(x.id) === String(id));
  if (!v) {
    showToast("Voucher not found");
    return;
  }

  document.getElementById("edit-voucher-id").value = v.id;
  document.getElementById("v-code").value = v.code || "";
  document.getElementById("v-type").value = mapVoucherTypeLabel(v.discount_type);
  document.getElementById("v-value").value = Number(v.discount_value || 0);
  document.getElementById("v-minpurchase").value = Number(v.min_purchase_amount || 0);
  document.getElementById("v-maxdiscount").value = v.max_discount_amount == null ? "" : Number(v.max_discount_amount);
  document.getElementById("v-limit").value = v.usage_limit == null ? "" : Number(v.usage_limit);
  document.getElementById("v-userlimit").value = v.per_user_limit == null ? "" : Number(v.per_user_limit);
  document.getElementById("v-from").value = toInputDate(v.valid_from);
  document.getElementById("v-until").value = toInputDate(v.valid_until);
  document.getElementById("v-status").value = toTitleCase(v.status || "inactive");
  document.getElementById("v-desc").value = v.description || "";
  openModal("modal-voucher");
}

async function deleteVoucher(id) {
  try {
    await api.deleteVoucher(id);
    showToast("Voucher deleted");
    await renderVouchers();
  } catch (err) {
    console.error("Delete voucher error:", err);
    showToast(err.message || "Failed to delete voucher");
  }
}

async function toggleVoucher(id) {
  const voucher = state.vouchers.find(v => String(v.id) === String(id));
  if (!voucher) {
    showToast("Voucher not found");
    return;
  }

  const newStatus = String(voucher.status || "inactive").toLowerCase() === "active" ? "inactive" : "active";
  try {
    await api.updateVoucher(id, { status: newStatus });
    await renderVouchers();
  } catch (err) {
    console.error("Toggle voucher error:", err);
    showToast(err.message || "Failed to toggle voucher");
  }
}

async function renderAdmins(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getAdmins();
      data = res.data || [];
      state.admins = data;
    }

    const meId = String(state.admin?.id || api.getStoredAdmin()?.id || "");
    const paged = paginateRows("admins", data);
    const tbody = document.getElementById("admins-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(a => {
        const nameParts = splitFullName(a.full_name);
        const username = (a.email || "").split("@")[0] || "admin";
        return `
        <tr>
          <td><b>${escapeHtml(username)}</b></td>
          <td>${escapeHtml(a.email)}</td>
          <td>${escapeHtml(a.full_name || `${nameParts.firstName} ${nameParts.lastName}`.trim())}</td>
          <td><span class="badge badge-admin">${escapeHtml(adminRoleLabel(a.role || "shop_owner"))}</span></td>
          <td>${escapeHtml(a.created_at || "-")}</td>
          <td>${String(a.id) !== meId ? `<button class="btn btn-sm btn-danger" onclick="deleteAdmin('${a.id}')">Toggle</button>` : '<span style="color:var(--text-muted);font-size:12px">You</span>'}</td>
        </tr>
      `;
      }).join("")
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No admins found</td></tr>';

    updateTableFooter("admins-footer", "admins", paged);
    renderTablePagination("admins", "admins-pagination", paged.total);
  } catch (err) {
    console.error("Admins error:", err);
    showToast(err.message || "Failed to load admins");
  }
}

async function saveAdmin() {
  if (!isSuperAdminSession()) {
    showToast("Forbidden — super admin access required");
    return;
  }

  const username = document.getElementById("a-username").value.trim();
  const email = document.getElementById("a-email").value.trim();
  const firstName = document.getElementById("a-fname").value.trim();
  const lastName = document.getElementById("a-lname").value.trim();
  const phone = document.getElementById("a-phone").value.trim();
  const password = document.getElementById("a-password").value;
  const selectedRole = document.getElementById("a-role").value;
  const role = normalizeCreatableAdminRole(selectedRole);
  const allowedRoles = ["shop_owner", "inventory_manager"];

  const fullName = `${firstName} ${lastName}`.trim() || username;
  if (!email || !password || !fullName) {
    showToast("Fill required admin fields");
    return;
  }
  if (!allowedRoles.includes(role)) {
    showToast("Invalid role selected");
    return;
  }

  try {
    await api.createAdmin({
      email,
      password,
      full_name: fullName,
      phone: phone || null,
      role,
    });

    showToast("Admin added!");
    closeModal("modal-admin");
    await renderAdmins();
  } catch (err) {
    console.error("Save admin error:", err);
    showToast(err.message || "Failed to save admin");
  }
}

async function deleteAdmin(id) {
  try {
    await api.toggleAdminStatus(id);
    showToast("Admin status updated");
    await renderAdmins();
  } catch (err) {
    console.error("Toggle admin error:", err);
    showToast(err.message || "Failed to update admin status");
  }
}

function filterAudit(action, el) {
  auditFilter = action;
  resetPaginationPage("audit");
  document.querySelectorAll("#panel-audit .filter-btn").forEach(b => b.classList.remove("active"));
  if (el) el.classList.add("active");
  renderAudit();
}

async function renderAudit(list) {
  try {
    let data = list;
    if (!data) {
      const params = { limit: 200, page: 1 };
      if (auditFilter !== "all") params.action = auditFilter;
      const res = await api.getAuditLogs(params);
      data = res.data || [];
      state.audit = data;
    }

    const classes = {
      Create: "audit-create",
      Update: "audit-update",
      Delete: "audit-delete",
      Login: "audit-login",
      Logout: "audit-login",
      Archive: "audit-archive",
      Unarchive: "audit-archive",
    };

    const paged = paginateRows("audit", data);
    const tbody = document.getElementById("audit-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(a => `
      <tr>
        <td style="font-size:12px;color:var(--text-muted)">${escapeHtml(a.created_at || "")}</td>
        <td><span class="audit-action-badge ${classes[a.action] || ""}">${escapeHtml(a.action || "-")}</span></td>
        <td>${escapeHtml(a.entity || "-")}</td>
        <td>${escapeHtml(a.admin_name || a.admin_email || "System")}</td>
        <td>${escapeHtml(a.description || "-")}</td>
      </tr>
    `).join("")
      : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No logs</td></tr>';

    updateTableFooter("audit-footer", "logs", paged);
    renderTablePagination("audit", "audit-pagination", paged.total);
  } catch (err) {
    console.error("Audit error:", err);
    showToast(err.message || "Failed to load audit logs");
  }
}

async function renderArchProducts(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getArchivedProducts({ limit: 200 });
      data = res.data || [];
      state.archivedProducts = data;
    }

    const paged = paginateRows("arch-products", data);
    const tbody = document.getElementById("arch-products-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(p => `<tr><td>${buildProductCoverCell(p.image, p.name)}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>${escapeHtml(p.stock)}</td><td><button class="btn btn-sm btn-teal" onclick="restoreProduct('${p.id}')">Restore</button></td></tr>`).join("")
      : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No archived products</td></tr>';

    updateTableFooter("arch-products-footer", "archived products", paged);
    renderTablePagination("arch-products", "arch-products-pagination", paged.total);
  } catch (err) {
    console.error("Archived products error:", err);
    showToast(err.message || "Failed to load archived products");
  }
}

async function restoreProduct(id) {
  try {
    await api.restoreArchivedProduct(id);
    showToast("Product restored!");
    await renderArchProducts();
    await renderProducts();
    await renderDashboard();
  } catch (err) {
    console.error("Restore product error:", err);
    showToast(err.message || "Failed to restore product");
  }
}

async function renderArchUsers(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getArchivedUsers({ limit: 200 });
      data = res.data || [];
      state.archivedUsers = data;
    }

    const paged = paginateRows("arch-users", data);
    const tbody = document.getElementById("arch-users-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(u => {
        const username = (u.email || "").split("@")[0] || u.full_name || "user";
        return `<tr><td>${escapeHtml(username)}</td><td>${escapeHtml(censorEmail(u.email))}</td><td>User</td><td><button class="btn btn-sm btn-teal" onclick="restoreUser('${u.id}')">Restore</button></td></tr>`;
      }).join("")
      : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px">No archived users</td></tr>';

    updateTableFooter("arch-users-footer", "archived users", paged);
    renderTablePagination("arch-users", "arch-users-pagination", paged.total);
  } catch (err) {
    console.error("Archived users error:", err);
    showToast(err.message || "Failed to load archived users");
  }
}

async function restoreUser(id) {
  try {
    await api.restoreArchivedUser(id);
    showToast("User restored!");
    await renderArchUsers();
    await renderUsers();
    await renderDashboard();
  } catch (err) {
    console.error("Restore user error:", err);
    showToast(err.message || "Failed to restore user");
  }
}

async function renderArchOrders(list) {
  try {
    let data = list;
    if (!data) {
      const res = await api.getArchivedOrders({ limit: 200 });
      data = res.data || [];
      state.archivedOrders = data;
    }

    const paged = paginateRows("arch-orders", data);
    const tbody = document.getElementById("arch-orders-tbody");
    tbody.innerHTML = paged.items.length
      ? paged.items.map(o => `<tr><td>${escapeHtml(o.order_number || o.id)}</td><td>${escapeHtml(censorName(o.customer))}</td><td>${toCurrency(o.total_amount || 0)}</td><td>${getStatusBadge(o.status)}</td><td>${escapeHtml(o.archived_at || "")}</td><td><button class="btn btn-sm btn-teal" onclick="restoreOrder('${o.id}')">Restore</button></td></tr>`).join("")
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">No archived orders</td></tr>';

    updateTableFooter("arch-orders-footer", "archived orders", paged);
    renderTablePagination("arch-orders", "arch-orders-pagination", paged.total);
  } catch (err) {
    console.error("Archived orders error:", err);
    showToast(err.message || "Failed to load archived orders");
  }
}

async function restoreOrder(id) {
  try {
    await api.restoreArchivedOrder(id);
    showToast("Order restored!");
    await renderArchOrders();
    await renderOrders();
    await renderDashboard();
  } catch (err) {
    console.error("Restore order error:", err);
    showToast(err.message || "Failed to restore order");
  }
}

async function loadSecurity() {
  try {
    const res = await api.getProfile();
    state.admin = res.data || null;
    if (!state.admin) return;

    const parts = splitFullName(state.admin.full_name || "");
    const username = (state.admin.email || "").split("@")[0] || "admin";

    document.getElementById("prof-username").value = username;
    document.getElementById("prof-email").value = state.admin.email || "";
    document.getElementById("prof-fname").value = parts.firstName || "";
    document.getElementById("prof-lname").value = parts.lastName || "";
    document.getElementById("prof-phone").value = state.admin.phone || "";

    document.getElementById("acc-role").textContent = adminRoleLabel(state.admin.role || "shop_owner");
    document.getElementById("acc-id").textContent = `#${state.admin.id}`;
    document.getElementById("admin-since").textContent = state.admin.created_at || "-";

    updateSidebarAdmin();
    applySuperAdminAccess();
  } catch (err) {
    console.error("Security/profile load error:", err);
    showToast(err.message || "Failed to load profile");
  }
}

async function changePassword() {
  const currentPassword = document.getElementById("cur-pw").value;
  const newPassword = document.getElementById("new-pw").value;
  const confirmPassword = document.getElementById("con-pw").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast("Fill all password fields");
    return;
  }

  try {
    await api.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    showToast("Password updated!");
    document.getElementById("cur-pw").value = "";
    document.getElementById("new-pw").value = "";
    document.getElementById("con-pw").value = "";
  } catch (err) {
    console.error("Change password error:", err);
    showToast(err.message || "Failed to update password");
  }
}

async function updateProfile() {
  const email = document.getElementById("prof-email").value.trim();
  const firstName = document.getElementById("prof-fname").value.trim();
  const lastName = document.getElementById("prof-lname").value.trim();
  const phone = document.getElementById("prof-phone").value.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (!email || !fullName) {
    showToast("Email and name are required");
    return;
  }

  try {
    await api.updateProfile({ full_name: fullName, email, phone });
    showToast("Profile updated!");
    await loadSecurity();
  } catch (err) {
    console.error("Update profile error:", err);
    showToast(err.message || "Failed to update profile");
  }
}

function updateSidebarAdmin() {
  const admin = state.admin || api.getStoredAdmin() || {};
  const displayName = admin.full_name || (admin.email ? admin.email.split("@")[0] : "Administrator");
  const role = adminRoleLabel(admin.role || "super_admin");

  const nameEl = document.getElementById("sb-admin-name");
  const roleEl = document.getElementById("sb-admin-role");
  if (nameEl) nameEl.textContent = displayName;
  if (roleEl) roleEl.textContent = role;
}

function globalSearch(q, options = {}) {
  const preservePage = !!options.preservePage;
  const query = String(q || "").toLowerCase().trim();
  const panel = getActivePanel();

  if (!query) {
    if (!preservePage) resetPaginationPage(panel);
    renderByPanel(panel);
    return;
  }

  if (!preservePage) resetPaginationPage(panel);

  if (panel === "products") {
    const data = state.products.filter(p => `${p.name} ${p.category} ${p.subcategory} ${p.brand}`.toLowerCase().includes(query));
    renderProducts(data);
  } else if (panel === "users") {
    const data = state.users.filter(u => `${u.full_name || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(query));
    renderUsers(data);
  } else if (panel === "orders") {
    const data = state.orders.filter(o => `${o.id} ${o.order_number || ""} ${o.customer || ""} ${o.status || ""}`.toLowerCase().includes(query));
    renderOrders(data);
  } else if (panel === "vouchers") {
    const data = state.vouchers.filter(v => `${v.code} ${v.discount_type} ${v.status}`.toLowerCase().includes(query));
    renderVouchers(data);
  } else if (panel === "admins") {
    const data = state.admins.filter(a => `${a.full_name || ""} ${a.email || ""} ${a.role || ""}`.toLowerCase().includes(query));
    renderAdmins(data);
  } else if (panel === "audit") {
    const data = state.audit.filter(a => `${a.action || ""} ${a.entity || ""} ${a.description || ""} ${a.admin_name || ""}`.toLowerCase().includes(query));
    renderAudit(data);
  }
}

function openModal(id) {
  if (id === "modal-admin" && !isSuperAdminSession()) {
    showToast("Forbidden — super admin access required");
    return;
  }

  if (id === "modal-product") {
    if (!document.getElementById("edit-product-id").value) {
      document.getElementById("product-modal-title").textContent = "Add New Product";
      ["p-name", "p-brand", "p-desc", "p-stock", "p-addstock", "p-price", "p-discount"].forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) el.value = "";
      });
      document.getElementById("p-category").value = "";
      document.getElementById("p-subcategory").value = "";
      document.getElementById("p-status").value = "Active";
      clearProductImage();
      document.getElementById("edit-product-id").value = "";
    }
  }

  if (id === "modal-voucher" && !document.getElementById("edit-voucher-id").value) {
    ["v-code", "v-value", "v-minpurchase", "v-maxdiscount", "v-limit", "v-userlimit", "v-from", "v-until", "v-desc"].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) el.value = "";
    });
    document.getElementById("v-type").value = "";
    document.getElementById("v-status").value = "Active";
    document.getElementById("edit-voucher-id").value = "";
  }

  if (id === "modal-admin") {
    document.getElementById("edit-admin-id").value = "";
    ["a-username", "a-email", "a-fname", "a-lname", "a-phone", "a-password"].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) el.value = "";
    });
    document.getElementById("a-role").value = "shop_owner";
  }

  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");

  if (id === "modal-product") {
    document.getElementById("edit-product-id").value = "";
    document.getElementById("product-modal-title").textContent = "Add New Product";
  }
  if (id === "modal-voucher") {
    document.getElementById("edit-voucher-id").value = "";
  }
}

function openAddProduct() {
  document.getElementById("edit-product-id").value = "";
  document.getElementById("product-modal-title").textContent = "Add New Product";
  ["p-name", "p-brand", "p-desc", "p-stock", "p-addstock", "p-price", "p-discount", "p-image"].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) el.value = "";
  });
  document.getElementById("p-category").value = "";
  document.getElementById("p-subcategory").value = "";
  document.getElementById("p-status").value = "Active";
  clearProductImage();
  openModal("modal-product");
}

document.addEventListener("click", e => {
  if (!e.target.closest(".notif-btn") && !e.target.closest("#notif-panel")) {
    const panel = document.getElementById("notif-panel");
    if (panel) panel.classList.remove("open");
  }

  document.querySelectorAll(".modal-overlay.open").forEach(overlay => {
    if (e.target === overlay) {
      overlay.classList.remove("open");
    }
  });
});

async function bootstrapAuthenticatedApp() {
  const isDatabaseConnected = await refreshDatabaseStatus();
  if (!isDatabaseConnected) {
    api.logout();
    showLoginScreen();
    showLoginError("Backend API is offline or misconfigured. Check runtime-config.js and /health endpoint.");
    return;
  }

  showApp();
  await loadSecurity();
  await refreshAll();
  await refreshNotifs();
}

document.addEventListener("DOMContentLoaded", async () => {
  setupLoginEvents();
  renderNotifs();
  await refreshDatabaseStatus();

  if (api.isAuthenticated()) {
    try {
      await bootstrapAuthenticatedApp();
    } catch (err) {
      console.error("Bootstrap failed:", err);
      api.logout();
      showLoginScreen();
      showLoginError("Session expired. Please login again.");
    }
  } else {
    showLoginScreen();
  }
});

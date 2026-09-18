const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('autosuite_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const errMessage = errorData.error || errorData.message || `HTTP error ${response.status}`;

    // Handle token expiry or unauthorized
    if (response.status === 401 && !response.url.includes('/auth/login')) {
      localStorage.removeItem('autosuite_token');
      localStorage.removeItem('autosuite_user');
      window.dispatchEvent(new Event('autosuite_unauthorized'));
    }

    const error = new Error(errMessage);
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }
  return response.json();
}

export const api = {
  // Auth & Account
  login: (username, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  changePassword: (passwordData) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    }).then(handleResponse),

  updateProfile: (profileData) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    }).then(handleResponse),

  // Platform Settings
  getSettings: () =>
    fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateSettings: (settingsData) =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData)
    }).then(handleResponse),

  // System Health
  getHealth: () =>
    fetch(`${API_BASE}/health`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Bikes (Inventory)
  getBikes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/bikes${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  searchChassis: (chassis) =>
    fetch(`${API_BASE}/bikes/search-chassis/${encodeURIComponent(chassis)}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  getBike: (id) =>
    fetch(`${API_BASE}/bikes/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createBike: (bikeData) =>
    fetch(`${API_BASE}/bikes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bikeData)
    }).then(handleResponse),

  updateBike: (id, bikeData) =>
    fetch(`${API_BASE}/bikes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bikeData)
    }).then(handleResponse),

  deleteBike: (id) =>
    fetch(`${API_BASE}/bikes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  restoreBike: (id) =>
    fetch(`${API_BASE}/bikes/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Sales & Installments
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sales${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getSale: (id) =>
    fetch(`${API_BASE}/sales/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createSale: (saleData) =>
    fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData)
    }).then(handleResponse),

  recordPayment: (saleId, paymentData) =>
    fetch(`${API_BASE}/sales/${saleId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    }).then(handleResponse),

  deleteSale: (id) =>
    fetch(`${API_BASE}/sales/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/customers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getCustomer: (id) =>
    fetch(`${API_BASE}/customers/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createCustomer: (customerData) =>
    fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    }).then(handleResponse),

  updateCustomer: (id, customerData) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    }).then(handleResponse),

  deleteCustomer: (id) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  customerLookup: (query) =>
    fetch(`${API_BASE}/sales/customer-lookup?query=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Motorcycle Letters & Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/documents${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getDocument: (id) =>
    fetch(`${API_BASE}/documents/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateDocStatus: (id, data) =>
    fetch(`${API_BASE}/documents/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Spare Parts & B2B
  getParts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/parts${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getLowStockAlerts: () =>
    fetch(`${API_BASE}/parts/alerts/low-stock`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createPart: (partData) =>
    fetch(`${API_BASE}/parts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(partData)
    }).then(handleResponse),

  updatePart: (id, partData) =>
    fetch(`${API_BASE}/parts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(partData)
    }).then(handleResponse),

  deletePart: (id) =>
    fetch(`${API_BASE}/parts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  restorePart: (id) =>
    fetch(`${API_BASE}/parts/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  getPartsOrders: () =>
    fetch(`${API_BASE}/parts/orders/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createPartsOrder: (orderData) =>
    fetch(`${API_BASE}/parts/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    }).then(handleResponse),

  deletePartOrder: (id) =>
    fetch(`${API_BASE}/parts/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  getVendorPOs: () =>
    fetch(`${API_BASE}/parts/vendor-pos/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createVendorPO: (poData) =>
    fetch(`${API_BASE}/parts/vendor-pos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(poData)
    }).then(handleResponse),

  receiveVendorPO: (id) =>
    fetch(`${API_BASE}/parts/vendor-pos/${id}/receive`, {
      method: 'PUT',
      headers: getAuthHeaders()
    }).then(handleResponse),

  deleteVendorPO: (id) =>
    fetch(`${API_BASE}/parts/vendor-pos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Suppliers & Vendors (3NF/BCNF)
  getVendors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/vendors${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getVendor: (id) =>
    fetch(`${API_BASE}/vendors/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createVendor: (vendorData) =>
    fetch(`${API_BASE}/vendors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorData)
    }).then(handleResponse),

  updateVendor: (id, vendorData) =>
    fetch(`${API_BASE}/vendors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorData)
    }).then(handleResponse),

  deleteVendor: (id) =>
    fetch(`${API_BASE}/vendors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Bike Models Catalog (3NF/BCNF)
  getBikeModels: () =>
    fetch(`${API_BASE}/bikes/models/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createBikeModel: (modelData) =>
    fetch(`${API_BASE}/bikes/models`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(modelData)
    }).then(handleResponse),

  // Spare Parts Categories (3NF/BCNF)
  getPartCategories: () =>
    fetch(`${API_BASE}/parts/categories/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createPartCategory: (categoryData) =>
    fetch(`${API_BASE}/parts/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    }).then(handleResponse),

  // Reports & Excel Exports
  getDashboardStats: () =>
    fetch(`${API_BASE}/reports/dashboard`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  downloadExcel: async (type, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('autosuite_token');
    const url = `${API_BASE}/reports/export/${type}${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!res.ok) throw new Error('Excel export failed');

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `AutoSuite_${type}_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Users & RBAC
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/users${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  createUser: (userData) =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  updateUser: (id, userData) =>
    fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  deleteUser: (id) =>
    fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  restoreUser: (id) =>
    fetch(`${API_BASE}/users/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  getRoles: () =>
    fetch(`${API_BASE}/users/roles/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createRole: (roleData) =>
    fetch(`${API_BASE}/users/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData)
    }).then(handleResponse),

  updateRole: (id, roleData) =>
    fetch(`${API_BASE}/users/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData)
    }).then(handleResponse),

  getPermissions: () =>
    fetch(`${API_BASE}/users/permissions/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Audit Logs & Retention
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/audit-logs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  getAuditRetention: () =>
    fetch(`${API_BASE}/audit-logs/retention`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  exportAuditCsv: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('autosuite_token');
    const url = `${API_BASE}/audit-logs/export${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!res.ok) throw new Error('Audit export failed');

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `AutoSuite_AuditLog_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

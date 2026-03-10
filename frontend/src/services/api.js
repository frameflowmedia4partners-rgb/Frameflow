import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = "frameflow_token";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("frameflow_user");
      localStorage.removeItem("frameflow_impersonation");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
  changePassword: (currentPassword, newPassword) => 
    api.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword }),
};

// Brand APIs
export const brandAPI = {
  getAll: () => api.get("/brands"),
  get: (brandId) => api.get(`/brands/${brandId}`),
  create: (data) => api.post("/brands", data),
  update: (brandId, data) => api.put(`/brands/${brandId}`, data),
  analyze: (brandId, websiteUrl) => api.post(`/brands/${brandId}/analyze`, { website_url: websiteUrl, brand_id: brandId }),
  getCurrent: () => api.get("/brand"),
  updateCurrent: (data) => api.put("/brand", data),
};

// Content APIs
export const contentAPI = {
  generateCaption: (data) => api.post("/generate/caption", data),
  generateImage: (data) => api.post("/generate/image", data),
  generateVideo: (data) => api.post("/generate/video", data),
  getProjectContents: (projectId) => api.get(`/contents/${projectId}`),
  generatePost: (data) => api.post("/posts/generate", data),
  generateReel: (data) => api.post("/reels/generate", data),
};

// Project APIs
export const projectAPI = {
  getAll: (brandId) => api.get("/projects", { params: { brand_id: brandId } }),
  get: (projectId) => api.get(`/projects/${projectId}`),
  create: (data) => api.post("/projects", data),
};

// Template APIs
export const templateAPI = {
  getAll: () => api.get("/templates"),
};

// Ideas APIs
export const ideaAPI = {
  generate: (brandId, ideaType) => api.post("/ideas/generate", { brand_id: brandId, idea_type: ideaType }),
  save: (brandId, idea) => api.post("/ideas/save", { brand_id: brandId, ...idea }),
  getAll: (brandId, status) => api.get("/ideas", { params: { brand_id: brandId, status } }),
  delete: (ideaId) => api.delete(`/ideas/${ideaId}`),
};

// Stats APIs
export const statsAPI = {
  get: () => api.get("/stats"),
};

// Scheduled Posts APIs
export const schedulerAPI = {
  getAll: () => api.get("/scheduled-posts"),
  create: (data) => api.post("/scheduled-posts", data),
  update: (postId, data) => api.put(`/scheduled-posts/${postId}`, data),
  delete: (postId) => api.delete(`/scheduled-posts/${postId}`),
};

// Media/Content Library APIs
export const mediaAPI = {
  getAll: (params) => api.get("/content-library", { params }),
  upload: (data) => api.post("/content-library", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (mediaId) => api.delete(`/content-library/${mediaId}`),
};

// Campaign APIs
export const campaignAPI = {
  getAll: () => api.get("/campaigns"),
  get: (campaignId) => api.get(`/campaigns/${campaignId}`),
  create: (data) => api.post("/campaigns", data),
  update: (campaignId, data) => api.put(`/campaigns/${campaignId}`, data),
  updateStatus: (campaignId, status) => api.put(`/campaigns/${campaignId}/status`, null, { params: { status } }),
  delete: (campaignId) => api.delete(`/campaigns/${campaignId}`),
};

// Analytics APIs
export const analyticsAPI = {
  get: (days) => api.get("/analytics", { params: { days } }),
  getBestTimes: () => api.get("/analytics/best-times"),
};

// Integration APIs
export const integrationAPI = {
  getStatus: () => api.get("/integrations/status"),
  getMetaOAuthUrl: () => api.get("/integrations/meta/oauth-url"),
  disconnectMeta: () => api.delete("/integrations/meta"),
};

// Onboarding APIs
export const onboardingAPI = {
  brandAssets: (data) => api.post("/onboarding/brand-assets", data),
  businessInfo: (data) => api.post("/onboarding/business-info", data),
  complete: () => api.post("/onboarding/complete"),
};

// Notifications APIs
export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  markRead: (noteId) => api.put(`/notifications/${noteId}/read`),
};

// Billing APIs
export const billingAPI = {
  get: () => api.get("/billing"),
};

// Admin APIs
export const adminAPI = {
  getClients: () => api.get("/admin/clients"),
  getClient: (clientId) => api.get(`/admin/clients/${clientId}`),
  createClient: (data) => api.post("/admin/clients", data),
  updateClient: (clientId, data) => api.put(`/admin/clients/${clientId}`, data),
  resetPassword: (clientId) => api.post(`/admin/clients/${clientId}/reset-password`),
  deleteClient: (clientId) => api.delete(`/admin/clients/${clientId}`),
  impersonate: (clientId) => api.post(`/admin/clients/${clientId}/impersonate`),
  getStats: () => api.get("/admin/stats"),
  getBilling: () => api.get("/admin/billing"),
  updateBilling: (clientId, status) => api.put(`/admin/billing/${clientId}`, { status }),
  getPaymentHistory: (clientId) => api.get(`/admin/billing/${clientId}/history`),
  sendNote: (clientId, message) => api.post("/admin/notes", { client_id: clientId, message }),
  getNotes: (clientId) => api.get(`/admin/notes/${clientId}`),
};

export default api;

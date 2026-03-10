import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - automatically attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        // Clear local storage and redirect to auth page
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Only redirect if not already on auth page
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  signup: (email, password, full_name) => api.post("/auth/signup", { email, password, full_name }),
  me: () => api.get("/auth/me"),
  completeOnboarding: () => api.put("/auth/complete-onboarding"),
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

// Project APIs
export const projectAPI = {
  getAll: (brandId) => api.get("/projects", { params: brandId ? { brand_id: brandId } : {} }),
  get: (projectId) => api.get(`/projects/${projectId}`),
  create: (data) => api.post("/projects", data),
};

// Content APIs
export const contentAPI = {
  getByProject: (projectId) => api.get(`/contents/${projectId}`),
  generateCaption: (data) => api.post("/generate/caption", data),
  generateImage: (data, timeout = 90000) => api.post("/generate/image", data, { timeout }),
  generateVideo: (data, timeout = 600000) => api.post("/generate/video", data, { timeout }),
  edit: (contentId, editPrompt) => api.post(`/contents/${contentId}/edit?edit_prompt=${encodeURIComponent(editPrompt)}`),
};

// Template APIs
export const templateAPI = {
  getAll: () => api.get("/templates"),
};

// Idea APIs
export const ideaAPI = {
  getAll: (brandId, status) => api.get("/ideas", { params: { brand_id: brandId, status } }),
  generate: (brandId, ideaType) => api.post("/ideas/generate", { brand_id: brandId, idea_type: ideaType }),
  save: (brandId, ideaText, ideaType) => api.post("/ideas/save", { brand_id: brandId, idea_text: ideaText, idea_type: ideaType }),
};

// Calendar APIs
export const calendarAPI = {
  generate: (brandId, days) => api.post("/calendar/generate", { brand_id: brandId, days }),
};

// Media APIs
export const mediaAPI = {
  getAll: (brandId) => api.get("/media", { params: brandId ? { brand_id: brandId } : {} }),
  upload: (data) => api.post("/media/upload", data),
  delete: (mediaId) => api.delete(`/media/${mediaId}`),
};

// Stats APIs
export const statsAPI = {
  get: () => api.get("/stats"),
};

// Ads/Campaign APIs
export const adsAPI = {
  getCampaigns: () => api.get("/ads/campaigns"),
  createStrategy: (data) => api.post("/ads/campaign/strategy", data),
  launchCampaign: (campaignId) => api.post(`/ads/campaign/${campaignId}/launch`),
};

// Demo APIs
export const demoAPI = {
  setup: () => api.post("/demo/setup"),
};

// Platform Content APIs
export const platformAPI = {
  generate: (data) => api.post("/generate/platform-content", data),
  repurpose: (data) => api.post("/generate/repurpose", data),
  batch: (data) => api.post("/generate/batch", data),
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

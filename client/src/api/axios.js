import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

export const weatherAPI = {
  getCurrent: (params) => api.get('/api/weather/current', { params }),
  getForecast: (params) => api.get('/api/weather/forecast', { params }),
  search: (q) => api.get('/api/weather/search', { params: { q } }),
  getSaved: () => api.get('/api/weather/saved'),
  saveCity: (data) => api.post('/api/weather/saved', data),
  deleteCity: (id) => api.delete(`/api/weather/saved/${id}`),
};

export const alertAPI = {
  getAlerts: (params) => api.get('/api/alerts', { params }),
  getAllAlerts: () => api.get('/api/alerts/all'),
  dismiss: (id) => api.patch(`/api/alerts/${id}/dismiss`),
};

export default api;
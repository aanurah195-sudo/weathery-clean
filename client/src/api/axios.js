import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const weatherAPI = {
  getCurrent: (params) => api.get('/weather/current', { params }),
  getForecast: (params) => api.get('/weather/forecast', { params }),
  search: (q) => api.get('/weather/search', { params: { q } }),
  getSaved: () => api.get('/weather/saved'),
  saveCity: (data) => api.post('/weather/saved', data),
  deleteCity: (id) => api.delete(`/weather/saved/${id}`),
};

export const alertAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getAllAlerts: () => api.get('/alerts/all'),
  dismiss: (id) => api.patch(`/alerts/${id}/dismiss`),
};

export default api;
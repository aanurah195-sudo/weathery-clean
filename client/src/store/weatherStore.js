import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/weather';

const useWeatherStore = create(
  devtools((set, get) => ({
    // ──── STATE ────
    current: null,
    forecast: null,
    alerts: { live: [], stored: [] },
    savedCities: [],
    searchResults: [],
    
    city: null,
    coords: null,
    
    loading: false,
    alertsLoading: false,
    error: null,
    
    unit: 'metric',

    // ──── SETTERS ────
    setCity: (city) => set({ city }),
    setCoords: (coords) => set({ coords }),
    setUnit: (unit) => set({ unit }),

    // ──── CURRENT WEATHER ────
    fetchCurrent: async (cityOrCoords = null) => {
      set({ loading: true, error: null });
      const state = get();
      
      const params = cityOrCoords || {
        city: state.city,
        lat: state.coords?.lat,
        lon: state.coords?.lon,
      };

      try {
        const response = await axios.get(`${API_BASE}/current`, { params });
        
        if (response.data.success) {
          set({
            current: response.data.data,
            city: response.data.data.city,
            loading: false,
          });
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch weather';
        set({ error: message, loading: false });
        console.error('Fetch current error:', err);
      }
    },

    // ──── FORECAST ────
    fetchForecast: async (cityOrCoords = null) => {
      set({ loading: true });
      const state = get();
      
      const params = cityOrCoords || {
        city: state.city,
        lat: state.coords?.lat,
        lon: state.coords?.lon,
        days: 7,
      };

      try {
        const response = await axios.get(`${API_BASE}/forecast`, { params });
        
        if (response.data.success) {
          set({ forecast: response.data.data, loading: false });
        }
      } catch (err) {
        console.error('Fetch forecast error:', err);
        set({ loading: false });
      }
    },

    // ──── ALL DATA ────
    fetchAll: async () => {
      set({ loading: true });
      const state = get();
      
      const params = {
        city: state.city,
        lat: state.coords?.lat,
        lon: state.coords?.lon,
      };

      try {
        await Promise.all([
          get().fetchCurrent(params),
          get().fetchForecast(params),
        ]);
      } catch (err) {
        console.error('Fetch all error:', err);
      } finally {
        set({ loading: false });
      }
    },

    // ──── SEARCH ────
    searchCities: async (query) => {
      if (!query || query.trim().length < 2) {
        set({ searchResults: [] });
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/search`, {
          params: { q: query.trim() },
        });

        if (response.data.success) {
          set({ searchResults: response.data.data });
        }
      } catch (err) {
        console.error('Search error:', err);
        set({ searchResults: [] });
      }
    },

    // ──── SELECT CITY ────
    selectCity: async (cityObj) => {
      if (!cityObj?.name) return;

      set({
        city: cityObj.name,
        coords: { lat: cityObj.lat, lon: cityObj.lon },
        searchResults: [],
      });

      // Fetch weather for selected city
      await get().fetchAll();
    },

    // ──── SAVED CITIES ────
    fetchSaved: async () => {
      try {
        const response = await axios.get(`${API_BASE}/saved`);
        
        if (response.data.success) {
          set({ savedCities: response.data.data });
        }
      } catch (err) {
        console.error('Fetch saved error:', err);
      }
    },

    saveCity: async (cityData) => {
      try {
        const response = await axios.post(`${API_BASE}/saved`, {
          name: cityData.name,
          country: cityData.country,
          lat: cityData.lat,
          lon: cityData.lon,
        });

        if (response.data.success) {
          await get().fetchSaved();
          return response.data.data;
        }
      } catch (err) {
        console.error('Save city error:', err);
        throw err;
      }
    },

    deleteCity: async (id) => {
      try {
        const response = await axios.delete(`${API_BASE}/saved/${id}`);
        
        if (response.data.success) {
          await get().fetchSaved();
        }
      } catch (err) {
        console.error('Delete city error:', err);
        throw err;
      }
    },

    // ──── GEOLOCATION ────
    useGeolocation: () => {
      if (!navigator.geolocation) {
        set({ error: 'Geolocation not supported' });
        return;
      }

      set({ loading: true });

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          set({ coords: { lat: latitude, lon: longitude } });
          
          // Try to get city name from coordinates
          try {
            const response = await axios.get(`${API_BASE}/location`, {
              params: { lat: latitude, lon: longitude },
            });

            if (response.data.name) {
              set({ city: response.data.name });
            }
          } catch (err) {
            console.log('Reverse geocode failed, using coordinates');
            set({ city: 'Current Location' });
          }

          // Fetch weather
          await get().fetchAll();
        },
        (error) => {
          set({
            error: 'Location access denied',
            loading: false,
          });
        }
      );
    },

    // ──── ALERTS ────
    fetchAlerts: async () => {
      set({ alertsLoading: true });
      const state = get();

      if (!state.coords) return;

      try {
        const response = await axios.get(`${API_BASE}/alerts`, {
          params: {
            lat: state.coords.lat,
            lon: state.coords.lon,
          },
        });

        if (response.data.success) {
          set({
            alerts: response.data.data || { live: [], stored: [] },
            alertsLoading: false,
          });
        }
      } catch (err) {
        console.error('Fetch alerts error:', err);
        set({ alertsLoading: false });
      }
    },

    dismissAlert: async (alertId) => {
      const state = get();
      const updatedLive = state.alerts.live.filter(a => a.id !== alertId);
      set({
        alerts: { ...state.alerts, live: updatedLive },
      });
    },
  }))
);

export default useWeatherStore;
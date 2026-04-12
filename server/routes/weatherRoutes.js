import express from 'express';
import {
  searchCities,
  getCurrentWeather,
  getForecast,
  reverseGeocode,
  getSavedCities,
  saveCity,
  deleteSavedCity,
} from '../controllers/weatherController.js';

const router = express.Router();

console.log('⚙️  Loading weather routes...\n');

// ────────────────────────────────────────────────────────────
// SEARCH ENDPOINT - This is what fixes your search bar
// ────────────────────────────────────────────────────────────
router.get('/search', searchCities);

// ────────────────────────────────────────────────────────────
// WEATHER ENDPOINTS
// ────────────────────────────────────────────────────────────
router.get('/current', getCurrentWeather);
router.get('/forecast', getForecast);

// ────────────────────────────────────────────────────────────
// GEOLOCATION ENDPOINT
// ────────────────────────────────────────────────────────────
router.get('/location', reverseGeocode);

// ────────────────────────────────────────────────────────────
// SAVED CITIES ENDPOINTS
// ────────────────────────────────────────────────────────────
router.get('/saved', getSavedCities);
router.post('/saved', saveCity);
router.delete('/saved/:id', deleteSavedCity);

// ────────────────────────────────────────────────────────────
// ERROR HANDLER
// ────────────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  console.error('❌ Route error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

export default router;
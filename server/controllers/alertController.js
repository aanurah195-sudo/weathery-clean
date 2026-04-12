import axios from 'axios';
import Alert from '../models/Alert.js';

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const WAPI_KEY = process.env.WEATHERAPI_KEY;

// Classify severity based on OWM weather codes
const getSeverity = (weatherId) => {
  if (weatherId >= 200 && weatherId < 210) return 'extreme';
  if (weatherId >= 210 && weatherId < 232) return 'severe';
  if (weatherId >= 500 && weatherId < 505) return 'moderate';
  if (weatherId === 511 || (weatherId >= 600 && weatherId < 602)) return 'moderate';
  if (weatherId >= 900 && weatherId < 906) return 'extreme';
  return 'minor';
};

const getAlertType = (weatherId, weatherMain) => {
  const main = weatherMain.toLowerCase();
  if (main.includes('thunderstorm')) return 'storm';
  if (main.includes('tornado')) return 'tornado';
  if (main.includes('hurricane')) return 'hurricane';
  if (weatherId >= 500 && weatherId < 600) return 'flood';
  if (weatherId >= 600 && weatherId < 700) return 'blizzard';
  if (main.includes('heat')) return 'heatwave';
  return 'general';
};

// GET /api/alerts?lat=&lon=
export const getAlerts = async (req, res) => {
  const { lat = 28.6, lon = 77.2 } = req.query;
  try {
    // Fetch from OWM weather alerts endpoint
    const owmRes = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&exclude=minutely,daily,hourly`
    ).catch(() => null);

    // Fetch from WeatherAPI alerts
    const wapiRes = await axios.get(
      `https://api.weatherapi.com/v1/forecast.json?key=${WAPI_KEY}&q=${lat},${lon}&days=1&alerts=yes`
    ).catch(() => null);

    const alerts = [];

    // OWM alerts
    if (owmRes?.data?.alerts) {
      owmRes.data.alerts.forEach(a => {
        alerts.push({
          type: 'general',
          severity: 'severe',
          title: a.event,
          description: a.description,
          location: `${lat}, ${lon}`,
          startTime: new Date(a.start * 1000),
          endTime: new Date(a.end * 1000),
          source: a.sender_name || 'OpenWeatherMap',
          active: true
        });
      });
    }

    // WeatherAPI alerts
    if (wapiRes?.data?.alerts?.alert) {
      wapiRes.data.alerts.alert.forEach(a => {
        alerts.push({
          type: 'general',
          severity: a.severity?.toLowerCase() || 'moderate',
          title: a.headline,
          description: a.desc,
          location: wapiRes.data.location.name,
          startTime: new Date(a.effective),
          endTime: new Date(a.expires),
          source: a.areas || 'WeatherAPI',
          active: true
        });
      });
    }

    // Also get DB alerts
    const dbAlerts = await Alert.find({ active: true }).sort({ createdAt: -1 }).limit(10);

    res.json({ success: true, data: { live: alerts, stored: dbAlerts } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};

// GET /api/alerts/all - stored alerts
export const getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB error' });
  }
};

// POST /api/alerts - create manual alert
export const createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/alerts/:id/dismiss
export const dismissAlert = async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Alert dismissed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dismiss' });
  }
};
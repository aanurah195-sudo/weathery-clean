import axios from 'axios';
import SavedCity from '../models/SavedCity.js';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const WAPI_KEY = process.env.WEATHERAPI_KEY;
const WAPI_BASE = 'https://api.weatherapi.com/v1';

console.log('🔑 API Keys Loaded:');
console.log('   OWM_KEY:', OWM_KEY ? '✅' : '❌');
console.log('   WAPI_KEY:', WAPI_KEY ? '✅' : '❌');

// ────────────────────────────────────────────────────────────
// SEARCH CITIES - THIS IS WHAT FIXES YOUR SEARCH BAR
// ────────────────────────────────────────────────────────────
export const searchCities = async (req, res) => {
  const { q } = req.query;

  // Validation
  if (!q || q.trim().length < 2) {
    return res.json({
      success: true,
      data: [],
      message: 'Query too short',
    });
  }

  console.log(`🔍 Searching for: "${q}"`);

  try {
    const results = new Map(); // Use Map to avoid duplicates

    // Try WeatherAPI search
    if (WAPI_KEY) {
      try {
        console.log('   Trying WeatherAPI...');
        const wapiRes = await axios.get(
          `${WAPI_BASE}/search.json`,
          {
            params: { key: WAPI_KEY, q: q.trim() },
            timeout: 5000,
          }
        );

        if (wapiRes.data && Array.isArray(wapiRes.data)) {
          wapiRes.data.forEach((city) => {
            const key = `${city.name}-${city.country}`;
            results.set(key, {
              id: `wapi_${city.id}`,
              name: city.name,
              region: city.region || '',
              country: city.country,
              lat: city.lat,
              lon: city.lon,
              source: 'weatherapi',
            });
          });
          console.log(`   ✅ WeatherAPI found ${wapiRes.data.length} cities`);
        }
      } catch (err) {
        console.log('   ❌ WeatherAPI failed:', err.message);
      }
    }

    // Try OpenWeather Geocoding
    if (OWM_KEY) {
      try {
        console.log('   Trying OpenWeather...');
        const owmRes = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct`,
          {
            params: {
              q: q.trim(),
              limit: 5,
              appid: OWM_KEY,
            },
            timeout: 5000,
          }
        );

        if (owmRes.data && Array.isArray(owmRes.data)) {
          owmRes.data.forEach((city) => {
            const key = `${city.name}-${city.country}`;
            if (!results.has(key)) {
              results.set(key, {
                id: `owm_${city.name}_${city.country}`,
                name: city.name,
                region: city.state || '',
                country: city.country,
                lat: city.lat,
                lon: city.lon,
                source: 'openweather',
              });
            }
          });
          console.log(`   ✅ OpenWeather found ${owmRes.data.length} cities`);
        }
      } catch (err) {
        console.log('   ❌ OpenWeather failed:', err.message);
      }
    }

    const finalResults = Array.from(results.values());
    console.log(`📍 Total results: ${finalResults.length}\n`);

    res.json({
      success: true,
      data: finalResults,
    });
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────
// GET CURRENT WEATHER
// ────────────────────────────────────────────────────────────
export const getCurrentWeather = async (req, res) => {
  const { city, lat, lon } = req.query;

  try {
    let owm = null;
    let wapi = null;

    const query = city || `${lat},${lon}`;
    console.log(`🌤️  Getting current weather for: ${query}`);

    // Try OpenWeather
    if (OWM_KEY) {
      try {
        const owmUrl = lat && lon
          ? `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
          : `${OWM_BASE}/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;

        const owmRes = await axios.get(owmUrl, { timeout: 5000 });
        owm = owmRes.data;
        console.log('   ✅ OpenWeather success');
      } catch (err) {
        console.log('   ❌ OpenWeather failed:', err.message);
      }
    }

    // Try WeatherAPI
    if (WAPI_KEY) {
      try {
        const wapiUrl = lat && lon
          ? `${WAPI_BASE}/current.json?key=${WAPI_KEY}&q=${lat},${lon}&aqi=yes`
          : `${WAPI_BASE}/current.json?key=${WAPI_KEY}&q=${encodeURIComponent(city)}&aqi=yes`;

        const wapiRes = await axios.get(wapiUrl, { timeout: 5000 });
        wapi = wapiRes.data;
        console.log('   ✅ WeatherAPI success');
      } catch (err) {
        console.log('   ❌ WeatherAPI failed:', err.message);
      }
    }

    if (!owm && !wapi) {
      return res.status(500).json({
        success: false,
        message: 'Both APIs failed',
      });
    }

    // Merge data
  const result = {
  city: owm?.name || wapi?.location?.name || city || 'Unknown',
  country: owm?.sys?.country || wapi?.location?.country || '',
  lat: owm?.coord?.lat || wapi?.location?.lat || lat,
  lon: owm?.coord?.lon || wapi?.location?.lon || lon,

  temp: Math.round(owm?.main?.temp || wapi?.current?.temp_c || 0),
  feelsLike: Math.round(owm?.main?.feels_like || wapi?.current?.feelslike_c || 0),
  humidity: owm?.main?.humidity || wapi?.current?.humidity || 0,
  windSpeed: owm?.wind?.speed || wapi?.current?.wind_kph || 0,
  windDeg: owm?.wind?.deg || 0,

  description: owm?.weather?.[0]?.description || wapi?.current?.condition?.text || '',
  icon: owm?.weather?.[0]?.icon || wapi?.current?.condition?.icon || '',
  cloudiness: owm?.clouds?.all || 0,

  uvIndex: wapi?.current?.uv || 0,
  visibility: owm ? Math.round((owm.visibility || 10000) / 1000) : wapi?.current?.vis_km || 10,
  pressure: owm?.main?.pressure || 1013,
  timezone: owm?.timezone || 0,

  // 🔥 ADD THIS (MAIN FIX)
  sunrise: owm?.sys?.sunrise || 0,
  sunset: owm?.sys?.sunset || 0,
};

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('❌ Get current error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get current weather',
      error: err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────
// GET FORECAST
// ────────────────────────────────────────────────────────────
export const getForecast = async (req, res) => {
  const { city, lat, lon, days = 7 } = req.query;

  try {
    const query = city || `${lat},${lon}`;
    console.log(`📅 Getting forecast for: ${query}`);

    let owmRes = null;
    let wapiRes = null;

    // WeatherAPI has better forecast data
    if (WAPI_KEY) {
      try {
        const url = lat && lon
          ? `${WAPI_BASE}/forecast.json?key=${WAPI_KEY}&q=${lat},${lon}&days=${Math.min(days, 10)}&aqi=no&alerts=yes`
          : `${WAPI_BASE}/forecast.json?key=${WAPI_KEY}&q=${encodeURIComponent(city)}&days=${Math.min(days, 10)}&aqi=no&alerts=yes`;

        wapiRes = await axios.get(url, { timeout: 5000 });
        console.log('   ✅ WeatherAPI forecast success');
      } catch (err) {
        console.log('   ⚠️  WeatherAPI forecast failed:', err.message);
      }
    }

    // Fallback to OpenWeather
    if (!wapiRes && OWM_KEY) {
      try {
        const url = lat && lon
          ? `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
          : `${OWM_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;

        owmRes = await axios.get(url, { timeout: 5000 });
        console.log('   ✅ OpenWeather forecast success');
      } catch (err) {
        console.log('   ⚠️  OpenWeather forecast failed:', err.message);
      }
    }

    if (!wapiRes && !owmRes) {
      return res.status(500).json({
        success: false,
        message: 'Both APIs failed',
      });
    }

    // Build forecast from WeatherAPI (preferred)
    let daily = [];
    let hourly = [];
    let alerts = [];

    if (wapiRes) {
      const { forecast, alerts: wapiAlerts } = wapiRes.data;

      daily = forecast.forecastday.map((day) => ({
        date: day.date,
        tempMax: Math.round(day.day.maxtemp_c),
        tempMin: Math.round(day.day.mintemp_c),
        description: day.day.condition.text,
        icon: day.day.condition.icon,
        humidity: day.day.avghumidity,
        windKph: day.day.maxwind_kph,
        chanceOfRain: day.day.daily_chance_of_rain||0,
      }));

     hourly = forecast.forecastday[0]?.hour?.slice(0, 8).map((h) => ({
  dt: Math.floor(new Date(h.time).getTime() / 1000), // 🔥 FIX
  temp: Math.round(h.temp_c),
  description: h.condition.text,
  icon: h.condition.icon,
  humidity: h.humidity,
  pop: h.chance_of_rain || 0, // 🔥 ADD THIS
})) || [];

      alerts = wapiAlerts?.alert || [];
    }

    res.json({
      success: true,
      data: {
        daily,
        hourly,
        alerts,
      },
    });
  } catch (err) {
    console.error('❌ Get forecast error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get forecast',
      error: err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────
// REVERSE GEOCODING - Get city name from coordinates
// ────────────────────────────────────────────────────────────
export const reverseGeocode = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      message: 'lat and lon required',
    });
  }

  try {
    console.log(`🗺️  Reverse geocoding: ${lat}, ${lon}`);

    if (OWM_KEY) {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/geo/1.0/reverse`,
          {
            params: {
              lat,
              lon,
              limit: 1,
              appid: OWM_KEY,
            },
            timeout: 5000,
          }
        );

        if (response.data && response.data[0]) {
          const location = response.data[0];
          const result = {
            name: location.name,
            region: location.state || '',
            country: location.country,
            lat: location.lat,
            lon: location.lon,
          };

          console.log(`   ✅ Found: ${location.name}, ${location.country}`);
          return res.json({
            success: true,
            data: result,
          });
        }
      } catch (err) {
        console.log('   ⚠️  Reverse geocode failed:', err.message);
      }
    }

    // Return coordinates if can't find city name
    res.json({
      success: true,
      data: {
        name: 'Current Location',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
    });
  } catch (err) {
    console.error('❌ Reverse geocode error:', err);
    res.status(500).json({
      success: false,
      message: 'Reverse geocoding failed',
      error: err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────
// SAVED CITIES CRUD
// ────────────────────────────────────────────────────────────

export const getSavedCities = async (req, res) => {
  try {
    const cities = await SavedCity.find().sort({ addedAt: -1 });
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB error', error: err.message });
  }
};

export const saveCity = async (req, res) => {
  const { name, country, lat, lon } = req.body;

  if (!name || !lat || !lon) {
    return res.status(400).json({
      success: false,
      message: 'name, lat, lon required',
    });
  }

  try {
    const existing = await SavedCity.findOne({ name, country });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'City already saved',
      });
    }

    const city = await SavedCity.create({ name, country, lat, lon });
    res.status(201).json({ success: true, data: city });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to save city',
      error: err.message,
    });
  }
};

export const deleteSavedCity = async (req, res) => {
  try {
    await SavedCity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'City removed' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete',
      error: err.message,
    });
  }
};
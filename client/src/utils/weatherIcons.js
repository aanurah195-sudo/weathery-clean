export const getWeatherEmoji = (weatherMain, isDay = true) => {
  const map = {
    Clear: isDay ? '☀️' : '🌙',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌁',
    Tornado: '🌪️',
    Hurricane: '🌀',
    Squall: '💨',
    Dust: '🌪️',
    Sand: '🌪️',
    Ash: '🌋',
    Smoke: '💨',
  };
  return map[weatherMain] || '🌤️';
};

export const getAlertEmoji = (type) => {
  const map = {
    storm: '⛈️', flood: '🌊', tornado: '🌪️', hurricane: '🌀',
    earthquake: '📳', heatwave: '🔥', blizzard: '❄️', wildfire: '🔥', general: '⚠️'
  };
  return map[type] || '⚠️';
};

export const getSeverityColor = (severity) => {
  const map = {
    extreme: '#ff2d55', severe: '#ff6b35', moderate: '#ffd32a', minor: '#00c9a7'
  };
  return map[severity] || '#7a8ba3';
};

export const getWindDirection = (deg) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
};

export const formatTime = (unix, timezone = 0) => {
  const date = new Date((unix + timezone) * 1000);
  return date.toUTCString().slice(17, 22);
};

export const getAQILabel = (aqi) => {
  if (!aqi) return 'N/A';
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  return labels[Math.min((aqi['gb-defra-index'] || 1) - 1, 4)];
};
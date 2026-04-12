import { useEffect } from 'react';
import useWeatherStore from '../store/weatherStore';
import { getWeatherEmoji, formatTime } from '../utils/weatherIcons';
import { format } from 'date-fns';

export default function CurrentWeather() {
  const { current, loading, error } = useWeatherStore();

  if (loading) {
    return (
      <div className="card current-card">
        <div className="loading-overlay">
          <div className="spinner" />
          <span>Fetching weather...</span>
        </div>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="card current-card">
        <div className="loading-overlay" style={{ flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <span style={{ color: 'var(--red)' }}>{error || 'No data'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Check your API keys in .env</span>
        </div>
      </div>
    );
  }

  const sunriseStr = formatTime(current.sunrise, current.timezone);
  const sunsetStr = formatTime(current.sunset, current.timezone);
  const now = new Date();

  return (
    <div className="card current-card fade-in">
      <div>
        <div className="weather-emoji">
          {getWeatherEmoji(current.weatherMain, current.isDay)}
        </div>
        <div className="temp-display">
          {current.temp}<sup>°c</sup>
        </div>
        <div className="weather-desc">{current.description}</div>
      </div>

      <div>
        <div className="location-row">
          <span>📍</span>
          <span className="location-name">{current.city}, {current.country}</span>
        </div>
        <div className="datetime-row">
          <span>🗓</span>
          <span>{format(now, 'dd MMM yyyy')} &nbsp;·&nbsp; {format(now, 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useWeatherStore from './store/weatherStore';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import TodayHighlights from './components/TodayHighlights';
import ForecastPanel from './components/ForecastPanel';
import DisasterAlerts from './components/DisasterAlerts';
import WeatherMap from './components/WeatherMap';

export default function App() {
  const { fetchAll, useGeolocation, alerts } = useWeatherStore();
  const alertCount = (alerts.live?.length || 0) + (alerts.stored?.length || 0);

  useEffect(() => {
    // Try geolocation first, fall back to default city
    if (navigator.geolocation) {
      useGeolocation();
    } else {
      fetchAll();
    }
  }, []);

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1320',
            color: '#dde6f0',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
          }
        }}
      />

      <Sidebar alertCount={alertCount} />

      <main className="main-content">
        {/* Search bar */}
        <SearchBar />

        {/* Top row: Current weather + Highlights */}
        <div className="top-row">
          <CurrentWeather />
          <TodayHighlights />
        </div>

        {/* Bottom row: Forecast + Map + Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 320px', gap: 16 }}>
          <ForecastPanel />
          <WeatherMap />
          <DisasterAlerts />
        </div>
      </main>
    </div>
  );
}
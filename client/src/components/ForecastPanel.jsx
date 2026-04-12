import { useState } from 'react';
import useWeatherStore from '../store/weatherStore';
import { format, parseISO, fromUnixTime } from 'date-fns';

// ✅ SAFE FIX FUNCTION
const safeFixed = (val, digits = 1) => {
  return typeof val === "number" ? val.toFixed(digits) : "--";
};

const conditionToEmoji = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('thunder') || t.includes('storm')) return '⛈️';
  if (t.includes('snow') || t.includes('blizzard')) return '❄️';
  if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return '🌧️';
  if (t.includes('cloud') || t.includes('overcast')) return '☁️';
  if (t.includes('mist') || t.includes('fog') || t.includes('haze')) return '🌫️';
  if (t.includes('sunny') || t.includes('clear')) return '☀️';
  if (t.includes('partly') || t.includes('cloudy')) return '⛅';
  return '🌤️';
};

export default function ForecastPanel() {
  const { forecast } = useWeatherStore();
  const [view, setView] = useState('7day');

  // ✅ EXTRA SAFE CHECK
  if (!forecast || !forecast.daily || !forecast.hourly) {
    return (
      <div className="card forecast-card">
        <div className="loading-overlay"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="card forecast-card fade-in-2">
      <div className="forecast-header">
        <div className="forecast-title">
          {view === '7day' ? '7 Days Forecast' : '24-Hour Forecast'}
        </div>
        <div className="forecast-toggle">
          <button className={`toggle-btn ${view === '7day' ? 'active' : ''}`} onClick={() => setView('7day')}>7 day</button>
          <button className={`toggle-btn ${view === 'hourly' ? 'active' : ''}`} onClick={() => setView('hourly')}>24 hr</button>
        </div>
      </div>

      <div className="forecast-list">
        {view === '7day'
          ? forecast.daily.map((day, i) => {
              const date = parseISO(day.date);
              const isToday = i === 0;
              return (
                <div key={day.date} className={`forecast-row ${isToday ? 'today' : ''}`}>
                  <div className="forecast-icon">{conditionToEmoji(day.description)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {isToday ? 'Today' : format(date, 'EEEE')}
                    </div>
                    <div className="forecast-desc">{day.description}</div>
                  </div>
                  <div className="forecast-date">{format(date, 'dd MMM')}</div>
                  <div className="forecast-temps">
                    <div className="t-max">+{safeFixed(day.tempMax)}°</div>
                    <div className="t-min">+{safeFixed(day.tempMin)}°</div>
                  </div>
                  <div className="forecast-pop">
                    {day.chanceOfRain > 0 && `💧${day.chanceOfRain}%`}
                  </div>
                </div>
              );
            })
          : forecast.hourly.map((h) => {
              const date = fromUnixTime(h.dt);
              return (
                <div key={h.dt} className="forecast-row">
                  <div className="forecast-icon">{conditionToEmoji(h.description)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {format(date, 'HH:mm')}
                    </div>
                    <div className="forecast-desc">{h.description}</div>
                  </div>
                  <div className="forecast-date">{format(date, 'dd MMM')}</div>
                  <div className="forecast-temps">
                    <div className="t-max">{safeFixed(h.temp)}°</div>
                  </div>
                  <div className="forecast-pop">
                    {h.pop > 0 && `💧${h.pop}%`}
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Tomorrow Summary */}
      {view === '7day' && forecast.daily[1] && (
        <div style={{
          marginTop: 12,
          padding: '14px',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <span style={{ fontSize: 36 }}>
            {conditionToEmoji(forecast.daily[1].description)}
          </span>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>
              Tomorrow
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 22 }}>
              {safeFixed(forecast.daily[1].tempMax)}°
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>
              {forecast.daily[1].description}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-2)' }}>
            <div>💧 Rain {forecast.daily[1].chanceOfRain ?? "--"}%</div>
            <div>💨 {safeFixed(forecast.daily[1].windKph, 0)} km/h</div>
            <div>☀️ UV {forecast.daily[1].uvIndex ?? "--"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
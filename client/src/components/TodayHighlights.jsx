import useWeatherStore from '../store/weatherStore';
import { getWindDirection, formatTime } from '../utils/weatherIcons';
import { fromUnixTime, format } from "date-fns";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip
} from 'recharts';

// Mock wind data for sparkline (last 6 readings)
const genWindData = (base) =>
  Array.from({ length: 12 }, (_, i) => ({
    t: i,
    v: Math.max(0, base + (Math.random() - 0.5) * 4)
  }));

function WindCard({ current }) {
  const data = genWindData(current.windSpeed * 3.6);
  return (
    <div className="highlight-card fade-in">
      <div className="highlight-label">Wind Status</div>
      <div style={{ height: 55 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3d9dff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3d9dff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#3d9dff" strokeWidth={1.5} fill="url(#windGrad)" dot={false} />
            <Tooltip
              contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [`${v.toFixed(1)} km/h`, 'Wind']}
              labelFormatter={() => ''}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="highlight-value" style={{ fontSize: 22 }}>
          {(current.windSpeed * 3.6).toFixed(1)}
        </span>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>km/h</span>
        <span style={{ marginLeft: 'auto', background: 'rgba(61,157,255,0.12)', border: '1px solid rgba(61,157,255,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--blue)' }}>
          {getWindDirection(current.windDeg)}
        </span>
      </div>
      <div className="highlight-sub">Gusts up to {current.gustKph?.toFixed(1) || (current.windSpeed * 3.6 * 1.4).toFixed(1)} km/h</div>
    </div>
  );
}

function UVCard({ uvIndex }) {
  const pct = Math.min(uvIndex / 11, 1);
  const uvColor = uvIndex <= 2 ? '#00c9a7' : uvIndex <= 5 ? '#ffd32a' : uvIndex <= 7 ? '#ff8c42' : '#ff3b5c';
  const uvLabel = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme';

  const r = 38, cx = 50, cy = 50;
  const circumference = Math.PI * r; // half circle
  const dash = pct * circumference;

  return (
    <div className="highlight-card fade-in-2">
      <div className="highlight-label">UV Index</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="80" height="50" viewBox="0 0 100 60">
          {/* Track */}
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
          {/* Fill */}
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke={uvColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          {/* Needle dot */}
          <circle
            cx={cx + r * Math.cos(Math.PI - pct * Math.PI)}
            cy={cy - r * Math.sin(pct * Math.PI)}
            r="5" fill={uvColor}
            style={{ filter: `drop-shadow(0 0 6px ${uvColor})` }}
          />
        </svg>
        <div>
          <div className="highlight-value" style={{ color: uvColor }}>{uvIndex?.toFixed(1)}</div>
          <div className="highlight-sub" style={{ color: uvColor }}>{uvLabel}</div>
        </div>
      </div>
    </div>
  );
}
function SunriseCard({ current }) {
  const sunrise = current?.sunrise
    ? format(fromUnixTime(current.sunrise), "hh:mm a")
    : "--";

  const sunset = current?.sunset
    ? format(fromUnixTime(current.sunset), "hh:mm a")
    : "--";

  const now = Date.now() / 1000;
  const total = (current?.sunset || 0) - (current?.sunrise || 0);
  const elapsed = Math.max(0, Math.min(now - (current?.sunrise || 0), total));
  const pct = total > 0 ? elapsed / total : 0;

  const r = 45, cx = 80, cy = 62;
  const circumference = Math.PI * r;
  const dash = pct * circumference;
  const sunX = cx + r * Math.cos(Math.PI - pct * Math.PI);
  const sunY = cy - r * Math.sin(pct * Math.PI);

  return (
    <div className="highlight-card fade-in-3">
      <div className="highlight-label">Sunrise & Sunset</div>

      <svg width="160" height="70" viewBox="0 0 160 70">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="orange" strokeWidth="2"
          strokeDasharray={`${dash} ${circumference}`} />

        {pct > 0 && pct < 1 && (
          <circle cx={sunX} cy={sunY} r="6" fill="yellow" />
        )}
      </svg>

      <div className="sun-times">
        <div>
          🌅 {sunrise}
        </div>
        <div>
          🌇 {sunset}
        </div>
      </div>
    </div>
  );
}


function HumidityCard({ current }) {
  return (
    <div className="highlight-card fade-in">
      <div className="highlight-label">Humidity</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <span className="highlight-value">{current.humidity}</span>
        <span style={{ color: 'var(--text-2)', fontSize: 16, marginBottom: 4 }}>%</span>
      </div>
      <div className="humidity-bar-wrap">
        <div className="humidity-bar-bg">
          <div className="humidity-bar-fill" style={{ width: `${current.humidity}%` }} />
        </div>
      </div>
      <div className="highlight-sub">
        {current.dewPoint !== undefined
          ? `Dew point is ${current.dewPoint?.toFixed(0)}° right now`
          : 'Humidity level'
        }
      </div>
    </div>
  );
}

function VisibilityCard({ current }) {
  const dots = 5;
  const active = Math.round((current.visibility / 10) * dots);
  return (
    <div className="highlight-card fade-in-2">
      <div className="highlight-label">Visibility</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="highlight-value">{String(current.visibility).padStart(2, '0')}</span>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>km</span>
      </div>
      <div className="vis-indicator">
        {Array.from({ length: dots }, (_, i) => (
          <div key={i} className={`vis-dot ${i < active ? 'active' : ''}`} />
        ))}
      </div>
      <div className="highlight-sub">
        {current.visibility >= 10 ? 'Clear visibility' :
          current.visibility >= 5 ? 'Moderate visibility' : 'Haze affecting visibility'}
      </div>
    </div>
  );
}

function FeelsLikeCard({ current }) {
  const diff = current.feelsLike - current.temp;
  const reason = diff > 2 ? 'Humidity making it feel hotter.'
    : diff < -2 ? 'Wind making it feel cooler.'
    : 'Similar to actual temperature.';
  return (
    <div className="highlight-card fade-in-3">
      <div className="highlight-label">Feels Like</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 20 }}>🌡️</span>
        <span className="highlight-value">{current.feelsLike}<sup style={{ fontSize: 14 }}>°</sup></span>
      </div>
      <div className="highlight-sub">{reason}</div>
    </div>
  );
}

export default function TodayHighlights() {
  const { current } = useWeatherStore();
  if (!current) return null;

  return (
    <div className="highlights-section">
      <div className="highlights-title">Today's Highlight</div>
      <div className="highlights-grid">
        <WindCard current={current} />
        <UVCard uvIndex={current.uvIndex || 0} />
        <SunriseCard current={current} />
        <HumidityCard current={current} />
        <VisibilityCard current={current} />
        <FeelsLikeCard current={current} />
      </div>
    </div>
  );
}
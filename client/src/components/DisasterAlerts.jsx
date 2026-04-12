import { useEffect, useState } from "react";
import useWeatherStore from "../store/weatherStore";
import { getAlertEmoji, getSeverityColor } from "../utils/weatherIcons";

// 🔥 API KEY
const API_KEY = "257325cfeaff91209c588cf2c083d326";

function AlertItem({ city }) {
  const level = city.severity;
  const color = getSeverityColor(level);

  return (
    <div
      style={{
        borderLeft:
          level === "extreme" || level === "severe"
            ? "4px solid red"
            : level === "moderate"
            ? "4px solid yellow"
            : "4px solid lime",

        background:
          level === "extreme" || level === "severe"
            ? "rgba(255,0,0,0.08)"
            : level === "moderate"
            ? "rgba(255,211,42,0.08)"
            : "rgba(0,255,150,0.08)",

        padding: 12,
        borderRadius: 12,
        marginBottom: 10,

        animation:
          level === "extreme" || level === "severe"
            ? "pulseAlert 1.5s infinite"
            : "none"
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {getAlertEmoji(level)} {city.name}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {city.reason}
      </div>

      <div style={{ fontSize: 11, opacity: 0.6 }}>
        🌡 {city.temp}°C | 💧 {city.humidity}% | 💨 {city.wind} m/s
      </div>
    </div>
  );
}

export default function DisasterAlerts() {
  const { current } = useWeatherStore();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (!current?.lat || !current?.lon) return;

    const fetchNearby = async () => {
      try {
        // 🔥 STEP 1: GET NEARBY CITIES
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/find?lat=${current.lat}&lon=${current.lon}&cnt=5&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();

        // 🔥 STEP 2: CALCULATE RISK
        const processed = data.list.map((c) => {
          let severity = "minor";
          let reason = "Normal weather";

          if (c.rain || c.weather[0].main === "Thunderstorm") {
            severity = "severe";
            reason = "Heavy rain / storm risk";
          } else if (c.main.temp > 40) {
            severity = "moderate";
            reason = "High temperature heat risk";
          } else if (c.wind.speed > 8) {
            severity = "moderate";
            reason = "Strong winds";
          }

          return {
            name: c.name,
            temp: Math.round(c.main.temp),
            humidity: c.main.humidity,
            wind: c.wind.speed,
            severity,
            reason,
          };
        });

        // 🔥 PICK 3 (HIGH, MEDIUM, LOW)
        const high = processed.find(c => c.severity === "severe");
        const medium = processed.find(c => c.severity === "moderate");
        const low = processed.find(c => c.severity === "minor");

        let final = [high, medium, low].filter(Boolean);

        // fallback
        while (final.length < 3 && processed.length > final.length) {
          final.push(processed[final.length]);
        }

        setCities(final);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNearby();
  }, [current]);

  return (
    <div className="card alerts-card fade-in-3">
      <div style={{ fontWeight: 600, marginBottom: 10 }}>
        🚨 Nearby Risk Cities
      </div>

      {cities.length > 0 ? (
        cities.map((c, i) => <AlertItem key={i} city={c} />)
      ) : (
        <div style={{ opacity: 0.6 }}>Loading nearby cities...</div>
      )}
    </div>
  );
}
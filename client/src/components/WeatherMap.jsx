import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const LOCATIONS = {
  london: { name: "London", lat: 51.5074, lon: -0.1278 },
  newDelhi: { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
  washingtonDC: { name: "Washington DC", lat: 38.9072, lon: -77.0369 },
  sydney: { name: "Sydney", lat: -33.8688, lon: 151.2093 },
};

export default function WeatherMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  const [weatherData, setWeatherData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState("precipitation");
  const [loading, setLoading] = useState(true);

  const API_KEY = "257325cfeaff91209c588cf2c083d326";

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    ).addTo(map);

    mapInstance.current = map;
  }, []);

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      const data = {};

      for (const [key, location] of Object.entries(LOCATIONS)) {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`
          );
          data[key] = response.data;
        } catch (error) {
          console.error(`Error fetching weather for ${location.name}:`, error);
        }
      }

      setWeatherData(data);
      setLoading(false);
    };

    fetchWeatherData();
  }, []);

  useEffect(() => {
    if (!mapInstance.current || loading) return;

    Object.values(markersRef.current).forEach((marker) => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = {};

    Object.entries(LOCATIONS).forEach(([key, location]) => {
      const weather = weatherData[key];
      if (!weather) return;

      const { temp, humidity } = weather.main;
      const precipitation = weather.rain ? weather.rain["1h"] || 0 : 0;
      const clouds = weather.clouds.all;

      let displayValue = "";
      let label = "";
      let textColor = "#10b981";

      // 🔥 SMART COLORS
      if (selectedMetric === "temp") {
        displayValue = `${temp.toFixed(1)}°C`;
        label = "Temperature";

        if (temp > 40) textColor = "#ef4444";
        else if (temp > 30) textColor = "#f59e0b";
        else textColor = "#22c55e";
      }

      if (selectedMetric === "humidity") {
        displayValue = `${humidity}%`;
        label = "Humidity";
        textColor = "#3b82f6";
      }

      if (selectedMetric === "precipitation") {
        displayValue = `${precipitation} mm`;
        label = "Precipitation";
        textColor = "#10b981";
      }

      if (selectedMetric === "clouds") {
        displayValue = `${clouds}%`;
        label = "Clouds";
        textColor = "#9ca3af";
      }

      // 🔥 WEATHER ICON
      const weatherMain = weather.weather[0].main.toLowerCase();
      let emoji = "☀️";
      if (weatherMain.includes("rain")) emoji = "🌧️";
      if (weatherMain.includes("cloud")) emoji = "☁️";
      if (weatherMain.includes("storm")) emoji = "⛈️";
      if (weatherMain.includes("snow")) emoji = "❄️";

      const isDanger =
        temp > 40 || precipitation > 20 || weatherMain.includes("storm");

      // 🔥 NEW MARKER UI
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            font-family:-apple-system,Segoe UI;
          ">
            
            <div style="
              font-size:20px;
              animation: floatIcon 2s infinite ease-in-out;
            ">
              ${emoji}
            </div>

            <div style="
              font-size:18px;
              font-weight:700;
              color:${textColor};
              text-shadow:0 0 12px ${textColor};
            ">
              ${displayValue}
            </div>

            <div style="
              width:10px;
              height:10px;
              border-radius:50%;
              background:${isDanger ? "#ef4444" : textColor};
              box-shadow:0 0 14px ${isDanger ? "#ef4444" : textColor};
              animation:pulseDot 1.5s infinite;
            "></div>

            <div style="
              font-size:10px;
              color:#9ca3af;
              margin-top:3px;
            ">
              ${location.name}
            </div>

          </div>
        `,
        iconSize: [80, 60],
        iconAnchor: [40, 30],
      });

      const marker = L.marker([location.lat, location.lon], { icon }).addTo(
        mapInstance.current
      );

      // 🔥 PREMIUM POPUP
      marker.bindPopup(`
        <div style="
          background: rgba(15,23,42,0.95);
          backdrop-filter: blur(14px);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:16px;
          padding:16px;
          color:#e5e7eb;
          font-family:-apple-system,Segoe UI;
          min-width:200px;
          box-shadow:0 8px 30px rgba(0,0,0,0.6);
        ">

          <div style="font-size:15px;font-weight:600;margin-bottom:10px;">
            📍 ${location.name}
          </div>

          <div style="display:grid;gap:6px;font-size:13px;">
            <div>🌡 Temp: <b>${temp.toFixed(1)}°C</b></div>
            <div>💧 Humidity: <b>${humidity}%</b></div>
            <div>🌧 Rain: <b>${precipitation} mm</b></div>
            <div>☁ Clouds: <b>${clouds}%</b></div>
          </div>

          <div style="
            margin-top:10px;
            font-size:12px;
            opacity:0.7;
            text-transform:capitalize;
          ">
            ${weather.weather[0].description}
          </div>

        </div>
      `);

      markersRef.current[key] = marker;
    });
  }, [weatherData, selectedMetric, loading]);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ 
        marginBottom: 16, 
        display: "flex", 
        gap: "12px", 
        flexWrap: "wrap" 
      }}>
        {["temp","humidity","precipitation","clouds"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedMetric(type)}
            style={{
              padding: "12px 24px",
              background:
                selectedMetric === type
                  ? "#2563eb"
                  : "rgba(255,255,255,0.05)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              backdropFilter: "blur(10px)"
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
          Loading weather data...
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}
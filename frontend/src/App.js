import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:8000";

const WEATHER_ICONS = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  Haze: "🌫️", Smoke: "🌫️", default: "🌡️"
};

const getWeatherIcon = (main) => WEATHER_ICONS[main] || WEATHER_ICONS.default;

const THEMES = {
  Clear: {
    bg: "linear-gradient(180deg, #0a1628 0%, #1a3a5c 40%, #2d6a8f 100%)",
    type: "sunny"
  },
  Clouds: {
    bg: "linear-gradient(180deg, #1a1a2e 0%, #2d2d44 50%, #3d405b 100%)",
    type: "cloudy"
  },
  Rain: {
    bg: "linear-gradient(180deg, #0d0d1a 0%, #1a2744 50%, #1a3a5c 100%)",
    type: "rain"
  },
  Drizzle: {
    bg: "linear-gradient(180deg, #0d0d1a 0%, #1a2744 50%, #1a3a5c 100%)",
    type: "rain"
  },
  Thunderstorm: {
    bg: "linear-gradient(180deg, #050508 0%, #0d0d1a 50%, #1a1a2e 100%)",
    type: "thunder"
  },
  Snow: {
    bg: "linear-gradient(180deg, #0d1b2e 0%, #1a2744 50%, #2d4a6b 100%)",
    type: "snow"
  },
  Mist: {
    bg: "linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)",
    type: "fog"
  },
  Fog: {
    bg: "linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)",
    type: "fog"
  },
  Haze: {
    bg: "linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)",
    type: "fog"
  },
  default: {
    bg: "linear-gradient(180deg, #0a0a1a 0%, #0d0d2b 40%, #111133 100%)",
    type: "default"
  }
};

// ===== ANIMATION COMPONENTS =====

const Stars = () => (
  <div className="stars">
    {[...Array(80)].map((_, i) => (
      <div key={i} className="star" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        "--duration": `${Math.random() * 3 + 2}s`,
        "--delay": `${Math.random() * 3}s`,
        "--opacity": Math.random() * 0.8 + 0.2,
      }} />
    ))}
  </div>
);

const Rain = ({ heavy = false }) => (
  <div className="rain-container">
    {[...Array(heavy ? 120 : 60)].map((_, i) => (
      <div key={i} className="raindrop" style={{
        "--left": `${Math.random() * 100}%`,
        "--duration": `${Math.random() * 0.5 + 0.4}s`,
        "--delay": `${Math.random() * 2}s`,
        "--height": `${Math.random() * 20 + 15}px`,
      }} />
    ))}
  </div>
);

const Snow = () => (
  <>
    {[...Array(50)].map((_, i) => (
      <div key={i} className="snowflake" style={{
        "--left": `${Math.random() * 100}%`,
        "--duration": `${Math.random() * 4 + 4}s`,
        "--delay": `${Math.random() * 4}s`,
        "--size": `${Math.random() * 14 + 8}px`,
      }}>❄</div>
    ))}
  </>
);

const Sun = () => (
  <div className="sun-container">
    <div className="sun">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="sun-ray" style={{
          "--angle": `${i * 30}deg`,
          "--delay": `${i * 0.25}s`,
        }} />
      ))}
    </div>
  </div>
);

const Clouds = () => (
  <div className="cloud-container">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="cloud" style={{
        "--top": `${Math.random() * 40}%`,
        "--duration": `${Math.random() * 30 + 20}s`,
        "--delay": `${Math.random() * -20}s`,
        "--width": `${Math.random() * 200 + 150}px`,
        "--height": `${Math.random() * 80 + 60}px`,
      }} />
    ))}
  </div>
);

const Fog = () => (
  <div className="fog-container">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="fog-layer" style={{
        "--top": `${i * 25}%`,
        "--duration": `${20 + i * 8}s`,
        "--delay": `${i * -5}s`,
      }} />
    ))}
  </div>
);

const WeatherBackground = ({ type }) => {
  switch (type) {
    case "sunny": return <><Stars /><Sun /><div className="heat-shimmer" /></>;
    case "rain": return <><Stars /><Rain /></>;
    case "thunder": return <><Rain heavy /><div className="lightning" /></>;
    case "snow": return <><Stars /><Snow /></>;
    case "cloudy": return <><Stars /><Clouds /></>;
    case "fog": return <><Stars /><Fog /></>;
    default: return <Stars />;
  }
};

export default function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [unit, setUnit] = useState("metric");
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [exportFormat, setExportFormat] = useState("json");
  const [theme, setTheme] = useState(THEMES.default);

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather/history`);
      setSaved(res.data);
    } catch {}
  };

  const applyTheme = (main) => {
    const t = THEMES[main] || THEMES.default;
    setTheme(t);
  };

  const searchWeather = async () => {
    if (!query.trim()) { setError("Please enter a location"); return; }
    setLoading(true); setError(""); setWeather(null); setForecast([]);
    try {
      const [wRes, fRes] = await Promise.all([
        axios.get(`${API_BASE}/weather/current?location=${query}&unit=${unit}`),
        axios.get(`${API_BASE}/weather/forecast?location=${query}&unit=${unit}`)
      ]);
      setWeather(wRes.data);
      setForecast(fRes.data.forecast || []);
      applyTheme(wRes.data.main);
      await axios.post(`${API_BASE}/weather/save`, { location: query, unit, ...wRes.data });
      fetchSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "City not found. Please check the name and try again.");
    } finally { setLoading(false); }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const [wRes, fRes] = await Promise.all([
            axios.get(`${API_BASE}/weather/current?lat=${latitude}&lon=${longitude}&unit=${unit}`),
            axios.get(`${API_BASE}/weather/forecast?lat=${latitude}&lon=${longitude}&unit=${unit}`)
          ]);
          setWeather(wRes.data);
          setForecast(fRes.data.forecast || []);
          applyTheme(wRes.data.main);
          setQuery(wRes.data.city);
          await axios.post(`${API_BASE}/weather/save`, { location: wRes.data.city, unit, ...wRes.data });
          fetchSaved();
        } catch { setError("Could not fetch weather for your location."); }
        finally { setLoading(false); }
      },
      () => { setError("Location access denied."); setLoading(false); }
    );
  };

  const deleteRecord = async (id) => {
    try { await axios.delete(`${API_BASE}/weather/delete/${id}`); fetchSaved(); }
    catch { setError("Failed to delete record."); }
  };

  const startEdit = (item) => { setEditingId(item.id); setEditNotes(item.notes || ""); };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_BASE}/weather/update/${id}`, { notes: editNotes });
      setEditingId(null); fetchSaved();
    } catch { setError("Failed to update record."); }
  };

  const exportData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather/export?format=${exportFormat}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `weather_data.${exportFormat}`;
      a.click();
    } catch { setError("Export failed."); }
  };

  const tempUnit = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "m/s" : "mph";

  return (
    <div className="app" style={{ background: theme.bg }}>
      <WeatherBackground type={theme.type} />

      <header className="header">
        <div className="header-left">
          <div className="logo">⛅ SmartWeather AI</div>
          <div className="subtitle">by Parthasarathi Murugan</div>
        </div>
        <div className="unit-toggle">
          <button className={unit === "metric" ? "active" : ""} onClick={() => setUnit("metric")}>°C</button>
          <button className={unit === "imperial" ? "active" : ""} onClick={() => setUnit("imperial")}>°F</button>
        </div>
      </header>

      <div className="pma-banner">
        <span>🚀 Built for </span>
        <a href="https://www.linkedin.com/company/product-manager-accelerator" target="_blank" rel="noreferrer">PM Accelerator</a>
        <span> — Empowering the next generation of AI professionals through hands-on experience, mentorship & real-world projects with mentors from Google, Meta, Apple & Nvidia.</span>
      </div>

      <nav className="tabs">
        {["search", "history", "export"].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "search" ? "🔍 Search" : tab === "history" ? "📋 History" : "📤 Export"}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === "search" && (
          <div className="search-section">
            <div className="search-box">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" type="text" placeholder="Search city, zip code, landmark..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchWeather()} />
                <button className="search-btn" onClick={searchWeather} disabled={loading}>
                  {loading ? <span className="spinner" /> : "Search"}
                </button>
              </div>
              <button className="location-btn" onClick={getLocation} disabled={loading}>📍 Use My Location</button>
            </div>

            {error && <div className="error-card"><span>⚠️</span> {error}</div>}
            {loading && <div className="loading-card"><div className="loading-spinner" /><p>Fetching weather data...</p></div>}

            {weather && !loading && (
              <div className="weather-card">
                <div className="weather-main">
                  <div className="weather-left">
                    <div className="weather-icon-big">{getWeatherIcon(weather.main)}</div>
                    <div className="weather-temp">{Math.round(weather.temperature)}{tempUnit}</div>
                    <div className="weather-feels">Feels like {Math.round(weather.feels_like)}{tempUnit}</div>
                  </div>
                  <div className="weather-right">
                    <div className="weather-city">{weather.city}</div>
                    <div className="weather-country">{weather.country}</div>
                    <div className="weather-desc">{weather.description}</div>
                    <div className="weather-time">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                </div>

                <div className="weather-stats">
                  {[
                    { icon: "💧", label: "Humidity", value: `${weather.humidity}%` },
                    { icon: "💨", label: "Wind", value: `${weather.wind_speed} ${windUnit}` },
                    { icon: "👁️", label: "Visibility", value: `${(weather.visibility / 1000).toFixed(1)} km` },
                    { icon: "🌡️", label: "Pressure", value: `${weather.pressure} hPa` },
                    { icon: "🌅", label: "Sunrise", value: new Date(weather.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                    { icon: "🌇", label: "Sunset", value: new Date(weather.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                  ].map(stat => (
                    <div key={stat.label} className="stat-card">
                      <div className="stat-icon">{stat.icon}</div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {forecast.length > 0 && (
                  <div className="forecast-section">
                    <h3 className="forecast-title">5-Day Forecast</h3>
                    <div className="forecast-grid">
                      {forecast.map((day, i) => (
                        <div key={i} className="forecast-card">
                          <div className="forecast-day">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</div>
                          <div className="forecast-icon">{getWeatherIcon(day.main)}</div>
                          <div className="forecast-temp-high">{Math.round(day.temp_max)}{tempUnit}</div>
                          <div className="forecast-temp-low">{Math.round(day.temp_min)}{tempUnit}</div>
                          <div className="forecast-desc">{day.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-section">
            <h2 className="section-title">📋 Search History</h2>
            {saved.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔍</div><p>No searches yet!</p></div>
            ) : (
              <div className="history-grid">
                {saved.map(item => (
                  <div key={item.id} className="history-card">
                    <div className="history-header">
                      <div className="history-city">{getWeatherIcon(item.main)} {item.location}</div>
                      <div className="history-temp">{Math.round(item.temperature)}{item.unit === "metric" ? "°C" : "°F"}</div>
                    </div>
                    <div className="history-desc">{item.description}</div>
                    <div className="history-time">🕐 {new Date(item.searched_at).toLocaleString()}</div>
                    {editingId === item.id ? (
                      <div className="edit-section">
                        <textarea className="edit-input" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Add notes..." />
                        <div className="edit-buttons">
                          <button className="save-btn" onClick={() => saveEdit(item.id)}>✅ Save</button>
                          <button className="cancel-btn" onClick={() => setEditingId(null)}>❌ Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.notes && <div className="history-notes">📝 {item.notes}</div>}
                        <div className="history-actions">
                          <button className="edit-btn" onClick={() => startEdit(item)}>✏️ Edit</button>
                          <button className="delete-btn" onClick={() => deleteRecord(item.id)}>🗑️ Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "export" && (
          <div className="export-section">
            <h2 className="section-title">📤 Export Data</h2>
            <div className="export-card">
              <p className="export-desc">Export your weather search history in your preferred format.</p>
              <div className="format-grid">
                {["json", "csv", "pdf"].map(fmt => (
                  <button key={fmt} className={`format-btn ${exportFormat === fmt ? "active" : ""}`} onClick={() => setExportFormat(fmt)}>
                    {fmt === "json" ? "📄 JSON" : fmt === "csv" ? "📊 CSV" : "📑 PDF"}
                  </button>
                ))}
              </div>
              <button className="export-btn" onClick={exportData}>⬇️ Download {exportFormat.toUpperCase()}</button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>SmartWeather AI © 2026 | Built by <strong>Parthasarathi Murugan</strong> | Powered by OpenWeatherMap</p>
        <p className="footer-pma">PM Accelerator — AI Product Development Hub | Mentors from Google, Meta, Apple & Nvidia</p>
      </footer>
    </div>
  );
}

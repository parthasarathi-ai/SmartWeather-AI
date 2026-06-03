# 🌤️ SmartWeather AI

> **Built by Parthasarathi Murugan** — PM Accelerator Technical Assessment (Full Stack)

SmartWeather AI is a full-stack weather application powered by **FastAPI** (backend) and **React** (frontend), using the **OpenWeatherMap API** to deliver real-time weather data, 5-day forecasts, and complete search history management with data export capabilities.

---

## 📋 About PM Accelerator

**Product Manager Accelerator** is a professional community and training program that helps aspiring and experienced product managers accelerate their careers. Through mentorship, hands-on projects, and industry connections, PM Accelerator equips members with the skills and network needed to land and excel in top product management roles.

🔗 [PM Accelerator LinkedIn](https://www.linkedin.com/school/product-manager-accelerator/)

---

## ✅ Assessment Completed

**Full Stack — Tech Assessment #1 (Frontend) + Tech Assessment #2 (Backend)**

---

## 🚀 Features

### Frontend (React)
- 🔍 Search weather by **city name, zip code, or GPS coordinates**
- 📍 **Current location** detection via browser geolocation
- 🌡️ Toggle between **Celsius and Fahrenheit**
- 📅 **5-day forecast** display
- 🗂️ View full **search history**
- 🗑️ Delete records from history
- 📤 Export data in **JSON, CSV, or PDF**
- ⚠️ Graceful **error handling** (city not found, API errors, invalid input)

### Backend (FastAPI + SQLite)
- ⚡ RESTful API with full **CRUD** operations
- 🗃️ **SQLite** database for persistent weather history
- 📦 Data export in **JSON, CSV, and PDF** formats
- 🌐 CORS enabled for frontend-backend communication
- 🔒 Environment-based API key management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, JavaScript, CSS |
| Backend | FastAPI, Python |
| Database | SQLite |
| Weather API | OpenWeatherMap |
| PDF Export | ReportLab |

---

## 📁 Project Structure

```
SmartWeather-AI/
├── backend/
│   ├── main.py              # FastAPI app with all routes
│   ├── weather.db           # SQLite database
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variable template
├── frontend/
│   ├── src/
│   │   └── ...              # React components
│   ├── public/
│   └── package.json
└── README.md
```

---

## ⚙️ How to Run

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenWeatherMap API Key (free at [openweathermap.org](https://openweathermap.org/api))

---

### 1️⃣ Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env

# Add your API key to .env
# WEATHER_API_KEY=your_openweathermap_api_key_here

# Run the FastAPI server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API Docs available at: `http://localhost:8000/docs`

---

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weather/current` | Get current weather by location or GPS |
| GET | `/weather/forecast` | Get 5-day forecast |
| POST | `/weather/save` | Save weather search to database |
| GET | `/weather/history` | Read all saved weather history |
| PUT | `/weather/update/{id}` | Update notes for a record |
| DELETE | `/weather/delete/{id}` | Delete a record |
| GET | `/weather/export?format=json` | Export data as JSON |
| GET | `/weather/export?format=csv` | Export data as CSV |
| GET | `/weather/export?format=pdf` | Export data as PDF |

---

## 📤 Data Export Formats

- **JSON** — structured data export
- **CSV** — spreadsheet-compatible format
- **PDF** — formatted report with table layout (built with ReportLab)

---

## ⚠️ Error Handling Examples

- ❌ City not found → displays friendly message: *"City not found. Please check the name and try again."*
- ❌ Invalid API key → returns clear error message
- ❌ Network failure → frontend shows fallback error state
- ❌ Empty search → input validation before API call

---

## 🌍 Environment Variables

Create a `.env` file in the `/backend` directory:

```
WEATHER_API_KEY=your_openweathermap_api_key_here
```

> ⚠️ Never commit your real API key to GitHub. Use `.env.example` as a template.

---

## 👤 Author

**Parthasarathi Murugan**
Full Stack Developer — PM Accelerator Technical Assessment

---

*SmartWeather AI — Real-time weather intelligence, built for PM Accelerator.*

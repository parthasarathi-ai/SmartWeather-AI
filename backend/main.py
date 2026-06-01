from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests
import sqlite3
import os
import json
import csv
import io
from datetime import datetime
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from pydantic import BaseModel
from typing import Optional

load_dotenv()

app = FastAPI(title="WeatherAI API", description="Built by Parthasarathi Murugan for PM Accelerator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("WEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"

# ===== DATABASE SETUP =====
def init_db():
    conn = sqlite3.connect("weather.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS weather_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            city TEXT,
            country TEXT,
            temperature REAL,
            feels_like REAL,
            humidity INTEGER,
            wind_speed REAL,
            pressure INTEGER,
            visibility INTEGER,
            description TEXT,
            main TEXT,
            sunrise INTEGER,
            sunset INTEGER,
            unit TEXT DEFAULT 'metric',
            notes TEXT,
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect("weather.db")
    conn.row_factory = sqlite3.Row
    return conn

# ===== MODELS =====
class WeatherSave(BaseModel):
    location: str
    city: Optional[str] = None
    country: Optional[str] = None
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None
    pressure: Optional[int] = None
    visibility: Optional[int] = None
    description: Optional[str] = None
    main: Optional[str] = None
    sunrise: Optional[int] = None
    sunset: Optional[int] = None
    unit: Optional[str] = "metric"

class WeatherUpdate(BaseModel):
    notes: Optional[str] = None

# ===== HELPERS =====
def fetch_weather(location=None, lat=None, lon=None, unit="metric"):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    if lat and lon:
        url = f"{BASE_URL}/weather?lat={lat}&lon={lon}&appid={API_KEY}&units={unit}"
    else:
        url = f"{BASE_URL}/weather?q={location}&appid={API_KEY}&units={unit}"
    res = requests.get(url)
    if res.status_code == 404:
        raise HTTPException(status_code=404, detail="City not found. Please check the name and try again.")
    if res.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Weather service error.")
    return res.json()

def fetch_forecast(location=None, lat=None, lon=None, unit="metric"):
    if lat and lon:
        url = f"{BASE_URL}/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units={unit}&cnt=40"
    else:
        url = f"{BASE_URL}/forecast?q={location}&appid={API_KEY}&units={unit}&cnt=40"
    res = requests.get(url)
    if res.status_code != 200:
        return []
    return res.json()

# ===== ROUTES =====
@app.get("/")
def root():
    return {"message": "WeatherAI API — Built by Parthasarathi Murugan for PM Accelerator"}

@app.get("/weather/current")
def get_current_weather(
    location: str = Query(None),
    lat: float = Query(None),
    lon: float = Query(None),
    unit: str = Query("metric")
):
    data = fetch_weather(location, lat, lon, unit)
    return {
        "city": data["name"],
        "country": data["sys"]["country"],
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "pressure": data["main"]["pressure"],
        "visibility": data.get("visibility", 0),
        "description": data["weather"][0]["description"],
        "main": data["weather"][0]["main"],
        "sunrise": data["sys"]["sunrise"],
        "sunset": data["sys"]["sunset"],
        "unit": unit
    }

@app.get("/weather/forecast")
def get_forecast(
    location: str = Query(None),
    lat: float = Query(None),
    lon: float = Query(None),
    unit: str = Query("metric")
):
    data = fetch_forecast(location, lat, lon, unit)
    if not data:
        return {"forecast": []}
    
    daily = {}
    for item in data.get("list", []):
        date = item["dt_txt"].split(" ")[0]
        if date not in daily:
            daily[date] = {
                "date": date,
                "temp_max": item["main"]["temp_max"],
                "temp_min": item["main"]["temp_min"],
                "description": item["weather"][0]["description"],
                "main": item["weather"][0]["main"]
            }
        else:
            daily[date]["temp_max"] = max(daily[date]["temp_max"], item["main"]["temp_max"])
            daily[date]["temp_min"] = min(daily[date]["temp_min"], item["main"]["temp_min"])
    
    forecast_list = list(daily.values())[:5]
    return {"forecast": forecast_list}

@app.post("/weather/save")
def save_weather(data: WeatherSave):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO weather_history 
        (location, city, country, temperature, feels_like, humidity, wind_speed, 
         pressure, visibility, description, main, sunrise, sunset, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.location, data.city, data.country, data.temperature,
        data.feels_like, data.humidity, data.wind_speed, data.pressure,
        data.visibility, data.description, data.main, data.sunrise,
        data.sunset, data.unit
    ))
    conn.commit()
    conn.close()
    return {"message": "Weather data saved successfully"}

@app.get("/weather/history")
def get_history():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM weather_history ORDER BY searched_at DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.put("/weather/update/{id}")
def update_weather(id: int, data: WeatherUpdate):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE weather_history SET notes = ? WHERE id = ?", (data.notes, id))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found")
    conn.commit()
    conn.close()
    return {"message": "Updated successfully"}

@app.delete("/weather/delete/{id}")
def delete_weather(id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM weather_history WHERE id = ?", (id,))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found")
    conn.commit()
    conn.close()
    return {"message": "Deleted successfully"}

@app.get("/weather/export")
def export_data(format: str = Query("json")):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM weather_history ORDER BY searched_at DESC")
    rows = [dict(row) for row in c.fetchall()]
    conn.close()

    if format == "json":
        content = json.dumps(rows, indent=2)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=weather_data.json"}
        )

    elif format == "csv":
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weather_data.csv"}
        )

    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("WeatherAI — Search History Report", styles['Title']))
        elements.append(Paragraph(f"Built by Parthasarathi Murugan | PM Accelerator", styles['Normal']))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 20))

        if rows:
            headers = ["Location", "Temp", "Description", "Humidity", "Wind", "Date"]
            data_table = [headers]
            for r in rows:
                unit_sym = "°C" if r.get("unit") == "metric" else "°F"
                data_table.append([
                    r.get("city", r.get("location", "")),
                    f"{round(r.get('temperature', 0))}{unit_sym}",
                    r.get("description", "").capitalize(),
                    f"{r.get('humidity', 0)}%",
                    f"{r.get('wind_speed', 0)} m/s",
                    str(r.get("searched_at", ""))[:16]
                ])
            table = Table(data_table, colWidths=[100, 60, 120, 70, 70, 120])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#c9a84c')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWHEIGHT', (0, 0), (-1, -1), 24),
            ]))
            elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=weather_data.pdf"}
        )

    raise HTTPException(status_code=400, detail="Invalid format. Use json, csv, or pdf.")

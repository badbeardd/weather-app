from fastapi import HTTPException
from httpx import AsyncClient
import os
from app.db import mongo
from datetime import datetime
import httpx

data_collection = mongo.data_collection

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

import httpx  # for consistent async usage

async def get_query_param(location):
    # Detect if it's a lat,lon string
    if "," in location and all(p.replace(".", "", 1).replace("-", "", 1).isdigit() for p in location.split(",")):
        lat, lon = location.split(",")
        return f"lat={lat}&lon={lon}"

    # Else geocode the location
    async with httpx.AsyncClient() as client:
        geo_url = "http://api.openweathermap.org/geo/1.0/direct"
        resp = await client.get(geo_url, params={"q": location, "limit": 1, "appid": OPENWEATHER_API_KEY})
        geo = resp.json()
        if not geo:
            raise HTTPException(status_code=404, detail="Location not found")
        lat, lon = geo[0]["lat"], geo[0]["lon"]
        return f"lat={lat}&lon={lon}"


async def create_weather_entry(entry):
    query_param = await get_query_param(entry.location)
    url = f"https://api.openweathermap.org/data/2.5/forecast?{query_param}&appid={OPENWEATHER_API_KEY}&units=metric"

    async with AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            try:
                error = res.json()
                message = error.get("message", "Unknown error")
            except Exception:
                message = "Invalid location or forecast unavailable"
            raise HTTPException(status_code=404, detail=f"Weather API error: {message}")
        data = res.json()

    forecast_list = data["list"]
    start = datetime.strptime(entry.start_date, "%Y-%m-%d").date()
    end = datetime.strptime(entry.end_date, "%Y-%m-%d").date()

    entries_to_store = []
    for item in forecast_list:
        forecast_date = datetime.strptime(item["dt_txt"], "%Y-%m-%d %H:%M:%S").date()
        if start <= forecast_date <= end:
            doc = {
                "location": entry.location,
                "date": str(forecast_date),
                "temperature": item["main"]["temp"],
                "condition": item["weather"][0]["description"]
            }
            entries_to_store.append(doc)

    if not entries_to_store:
        raise HTTPException(status_code=404, detail="No forecast data in specified date range.")

    await data_collection.insert_many(entries_to_store)
    return len(entries_to_store)

async def get_all_entries():
    raw_data = await data_collection.find().to_list(100)
    for item in raw_data:
        item["_id"] = str(item["_id"])  # ✅ convert ObjectId to str
    return raw_data


async def update_entry_by_location_and_date(location, date, new_data):
    result = await data_collection.update_one(
        {"location": location, "date": date},
        {"$set": new_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found or no change")
    return {"message": "Updated successfully"}


async def delete_entry_by_location_and_date(location, date):
    result = await data_collection.delete_one({"location": location, "date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted successfully"}

from datetime import datetime

async def search_entries(location: str, start_date: str, end_date: str):
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()

    query = {
        "location": {"$regex": f"^{location}$", "$options": "i"},
        "date": {"$gte": str(start), "$lte": str(end)}
    }

    results = await data_collection.find(query).to_list(100)
    for item in results:
        item["_id"] = str(item["_id"])
    return results


import pandas as pd
from fpdf import FPDF
from fastapi.responses import FileResponse
import os

EXPORT_DIR = "exports"
os.makedirs(EXPORT_DIR, exist_ok=True)

async def export_data(format: str):
    data = await data_collection.find().to_list(100)
    df = pd.DataFrame(data)
    if "_id" in df:
        df["_id"] = df["_id"].astype(str)

    filename = f"{EXPORT_DIR}/weather_data.{format}"

    if format == "json":
        df.to_json(filename, orient="records", indent=2)
    elif format == "csv":
        df.to_csv(filename, index=False)
    elif format == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=10)
        for _, row in df.iterrows():
            line = ", ".join([f"{col}: {row[col]}" for col in df.columns])
            pdf.multi_cell(0, 10, txt=line)
        pdf.output(filename)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    return filename

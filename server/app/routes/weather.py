from fastapi import APIRouter
from app.models.weather import WeatherEntry
from app.controllers import weather_crud, location_info
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.post("/weather")
async def create_entry(entry: WeatherEntry):
    count = await weather_crud.create_weather_entry(entry)
    return {"inserted": count}  # ✅ now frontend gets { inserted: <count> 

@router.get("/weather")
async def read_entries():
    return await weather_crud.get_all_entries()

@router.put("/weather/{location}/{date}")
async def update_entry(location: str, date: str, new_data: dict):
    return await weather_crud.update_entry_by_location_and_date(location, date, new_data)

@router.delete("/weather/{location}/{date}")
async def delete_entry(location: str, date: str):
    result = await weather_crud.delete_entry_by_location_and_date(location, date)
    return result

import os
from fastapi.responses import FileResponse
@router.get("/export")
async def export_weather_data(format: str = "json"):
    filepath = await weather_crud.export_data(format)
    return FileResponse(filepath, filename=os.path.basename(filepath))

@router.get("/location-info")
async def get_location_info(location: str):
    return await location_info.get_location_info(location)

async def get_all_entries():
    return await data_collection.find().to_list(100)
from app.db.mongo import data_collection

from fastapi import Query
@router.get("/weather/search")
async def search_entries(location: str = Query(...), start_date: str = Query(...), end_date: str = Query(...)):
    return await weather_crud.search_entries(location, start_date, end_date)

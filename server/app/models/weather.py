from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class WeatherEntry(BaseModel):
    location: str
    start_date: str
    end_date: str

    @validator("start_date", "end_date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v
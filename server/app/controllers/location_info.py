from fastapi import HTTPException
from httpx import AsyncClient
import os

async def get_location_info(location: str):
    # Fake YT search via URL (no API key)
    search_query = location.replace(" ", "+") + "+weather"
    search_url = f"https://www.youtube.com/results?search_query={search_query}"

    # Return search URL instead of videos
    return {
        "videoSearchURL": search_url,
        "mapProvider": "OpenStreetMap (use coords on frontend)"
    }


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
@app.get("/ping")
def ping():
    return {"message": "pong"}

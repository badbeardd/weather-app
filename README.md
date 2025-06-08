🌦️ Weather Forecast App
A full-stack weather forecast application built with React, FastAPI, and MongoDB, enhanced with map view, Unsplash-based city image gallery, and data export functionality.

🚀 Features
Search weather by city or current location

Select a date range to retrieve weather info

Store and manage weather data with CRUD functionality

View map of location (OpenStreetMap)

See multiple images of the city (Unsplash API)

Export data to JSON, XML, Markdown, or PDF

🧠 Tech Stack
Frontend: React, Tailwind CSS, ShadCN UI

Backend: FastAPI (Python)

Database: MongoDB

APIs Used: OpenWeatherMap, Unsplash, OpenStreetMap

🛠️ Setup Instructions
1. Clone the repository
git clone https://github.com/badbeardd/weather-app.git
cd weather-app

2. Configure environment variables
Create a .env file in the client/ directory with the following content:

REACT_APP_WEATHER_API_KEY=your_openweathermap_api_key
REACT_APP_UNSPLASH_KEY=your_unsplash_access_key

This file is required for the frontend to access OpenWeatherMap and Unsplash APIs.

MongoDB URI is already configured for local development in the backend:

mongodb://localhost:27017/Weatherapp

3. Start the backend (FastAPI)
source venv/Scripts/activate
cd server
uvicorn main:app --reload

Make sure MongoDB is running locally (port 27017).

4. Start the frontend (React)
In a separate terminal:

cd client
npm install
npm start

Visit http://localhost:3000 in your browser.

weather-app/
├── client/
│   └── .env                 ✅ contains REACT_APP_* keys
├── server/
│   └── .env                 ✅ contains MONGO_URI, OPENWEATHER_API_KEY


client/.env
REACT_APP_UNSPLASH_KEY=your_unsplash_access_key
server/.env
OPENWEATHER_API_KEY=your_openweathermap_key

📤 Export Formats
From the UI, you can export stored weather data as:

JSON

XML

Markdown

PDF

👤 Author
Suraj Kumar Singh
For the Product Manager Accelerator Internship – Software Engineer (AI/ML) Assessment

LinkedIn: [PM Accelerator](https://www.linkedin.com/school/pmaccelerator/)

🛡️ License
This project is open-source and free to use for educational purposes.
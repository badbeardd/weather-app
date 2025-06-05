// Clean, updated, professional UI with background and enhanced layout

import React, { useState } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

function App() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [storedData, setStoredData] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [editedTemp, setEditedTemp] = useState('');
  const [editedCondition, setEditedCondition] = useState('');

  const handleShowEntries = () => {
    setTimeout(() => {
      fetchStoredData();
    }, 100);
  };

  const fetchStoredData = async () => {
    try {
      const res = await axios.get('http://localhost:8000/weather/search', {
        params: {
          location,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setStoredData(res.data);
    } catch (err) {
      console.error("Failed to fetch stored data", err);
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await axios.post('http://localhost:8000/weather', {
        location,
        start_date: startDate,
        end_date: endDate,
      });
      alert(`Stored ${res.data.inserted} entries for ${location}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to fetch or store weather data.";
      console.error("Backend fetch failed", err);
      alert(msg);
    }
  };

  const deleteEntry = async (location, date) => {
    try {
      await axios.delete(`http://localhost:8000/weather/${location}/${date}`);
      alert("Entry deleted");
      fetchStoredData();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete entry");
    }
  };

  const updateEntry = async (location, date) => {
    try {
      await axios.put(`http://localhost:8000/weather/${location}/${date}`, {
        temperature: editedTemp,
        condition: editedCondition,
      });
      alert("Entry updated");
      setEditMode(null);
      fetchStoredData();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update entry");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          <span role="img" aria-label="weather">🌦️</span> Weather Forecast App
        </h1>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="City, Zip, or Lat,Lon"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={fetchWeather} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Get Weather</button>
            <button onClick={handleShowEntries} className="bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800">Show Stored Entries</button>
          </div>
        </div>

        {storedData.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Stored Weather Data</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300 rounded-md">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Location</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Temp (°C)</th>
                    <th className="border px-4 py-2 text-left">Condition</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{item.location}</td>
                      <td className="border px-4 py-2">{item.date}</td>
                      <td className="border px-4 py-2">
                        {editMode === idx ? (
                          <input value={editedTemp} onChange={(e) => setEditedTemp(e.target.value)} className="border rounded px-2 py-1 w-20" />
                        ) : (
                          item.temperature
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {editMode === idx ? (
                          <input value={editedCondition} onChange={(e) => setEditedCondition(e.target.value)} className="border rounded px-2 py-1" />
                        ) : (
                          item.condition
                        )}
                      </td>
                      <td className="border px-4 py-2 space-x-2">
                        {editMode === idx ? (
                          <>
                            <button onClick={() => updateEntry(item.location, item.date)} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                            <button onClick={() => setEditMode(null)} className="bg-gray-500 text-white px-3 py-1 rounded">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditMode(idx); setEditedTemp(item.temperature); setEditedCondition(item.condition); }} className="bg-yellow-500 text-white px-3 py-1 rounded">Update</button>
                            <button onClick={() => deleteEntry(item.location, item.date)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

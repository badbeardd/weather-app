import React, { useState, useEffect,useRef  } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { jsPDF } from 'jspdf';

function App() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [storedData, setStoredData] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [editedTemp, setEditedTemp] = useState('');
  const [editedCondition, setEditedCondition] = useState('');
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayLocation, setDisplayLocation] = useState('');

  const imageCache = useRef({});  // Keeps previously fetched results
const handleShowEntries = () => {
  const queryLocation = coords.lat && coords.lon
    ? `${coords.lat},${coords.lon}`
    : location;

  setTimeout(() => {
    fetchStoredData(queryLocation);
  }, 100);
};


  const fetchStoredData = async (loc) => {
  try {
    const res = await axios.get('http://localhost:8000/weather/search', {
      params: {
        location: loc,
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
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (!startDate || !endDate || s > e) {
    alert("Invalid date range. Ensure both dates are set and Start ≤ End.");
    return;
  }

  // Prefer coordinates if available (useful for pin codes or accurate matches)
  const queryLocation = coords.lat && coords.lon 
    ? `${coords.lat},${coords.lon}` 
    : location;

  try {
    const res = await axios.post('http://localhost:8000/weather', {
      location: queryLocation,
      start_date: startDate,
      end_date: endDate,
    });
    alert(`Stored ${res.data.inserted} entries for ${queryLocation}`);
  } catch (err) {
    const msg = err.response?.data?.detail || "Failed to fetch or store weather data.";
    console.error("Backend fetch failed", err);
    alert(msg);
  }
};



   const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords; // Extract latitude and longitude

      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        setLocation(res.data.address.city || res.data.address.town || res.data.address.village || '');
        setCoords({ lat: latitude, lon: longitude }); // Update the coords state
      } catch (err) {
        console.error("Failed to reverse geocode", err);
        alert("Could not determine city from coordinates");
      }
    }, (error) => {
      console.error("Error getting location", error);
      alert("Failed to get current location.");
    });
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

  const embedMapURL = (coords.lat && coords.lon)
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon-0.05},${coords.lat-0.05},${coords.lon+0.05},${coords.lat+0.05}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : '';
  const [photos, setPhotos] = useState([]);

  const fetchUnsplashImages = async (query) => {
  if (imageCache.current[query]) {
    setPhotos(imageCache.current[query]);
    setCurrentImageIndex(0);
    return;
  }

  setLoadingImages(true);
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 10 },
      headers: {
        Authorization: `Client-ID ${process.env.REACT_APP_UNSPLASH_KEY}`,
      },
    });
    imageCache.current[query] = res.data.results;
    setPhotos(res.data.results);
    setCurrentImageIndex(0);
  } catch (err) {
    console.error('Error fetching Unsplash images:', err.response?.data || err.message);
  } finally {
    setLoadingImages(false);
  }
};




useEffect(() => {
  if (!location) return;

  const fetchImages = async () => {
    const isCoordinates = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(location.trim());

    if (isCoordinates) {
      const [lat, lon] = location.split(",");
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      // ✅ Add this to fix the map display
      setCoords({ lat: parsedLat, lon: parsedLon });

      try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLon}`
    );

        const placeName =
          res.data.address.city ||
          res.data.address.town ||
          res.data.address.village ||
          res.data.address.state ||
          res.data.address.country;

        setDisplayLocation(placeName || location);
        fetchUnsplashImages(placeName || location);
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        setDisplayLocation(location);
        fetchUnsplashImages("nature");
      }
    } else {
      try {
        const query = encodeURIComponent(location.trim());
        const geoKey = process.env.REACT_APP_GEOAPIFY_KEY;
        console.log("🔑 Geoapify API Key:", geoKey);

        const res = await axios.get(
          `https://api.geoapify.com/v1/geocode/search?text=${query}&apiKey=${geoKey}`
        );

        if (res.data.features.length > 0) {
          const props = res.data.features[0].properties;
          console.log("📦 Geoapify result:", props);

          const lat = props.lat || res.data.features[0].geometry.coordinates[1];
          const lon = props.lon || res.data.features[0].geometry.coordinates[0];
          setCoords({ lat, lon });

          const name = props.city || props.state_district || props.state || location;
          console.log("🔑 Geoapify name:", name);
          setDisplayLocation(name);
          fetchUnsplashImages(name);
        } else {
          setDisplayLocation(location);
          fetchUnsplashImages("nature");
        }
      } catch (err) {
        console.error("Geoapify lookup failed:", err);
        setDisplayLocation(location);
        fetchUnsplashImages("nature");
      }
    }
  };

  fetchImages();
}, [location]);





  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(storedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'weather.json');
  };

  const exportAsXML = () => {
    let xml = '<?xml version="1.0"?>\n<weatherData>\n';
    storedData.forEach(entry => {
      xml += `  <entry>\n    <location>${entry.location}</location>\n    <date>${entry.date}</date>\n    <temperature>${entry.temperature}</temperature>\n    <condition>${entry.condition}</condition>\n  </entry>\n`;
    });
    xml += '</weatherData>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'weather.xml');
  };

  const exportAsMarkdown = () => {
    let md = '| Location | Date | Temp (°C) | Condition |\n|----------|------|------------|-----------|\n';
    storedData.forEach(e => {
      md += `| ${e.location} | ${e.date} | ${e.temperature} | ${e.condition} |\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'weather.md');
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Weather Data', 10, 10);
    let y = 20;
    storedData.forEach((e, idx) => {
      doc.text(`${idx + 1}. ${e.location} - ${e.date} - ${e.temperature}°C - ${e.condition}`, 10, y);
      y += 8;
    });
    doc.save('weather.pdf');
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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
              <button onClick={detectCurrentLocation} className="mt-2 text-sm text-blue-600 hover:underline">
                Use Current Location
              </button>
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

        {location && (
  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
    <iframe
      className="w-full h-64 rounded shadow"
      src={embedMapURL}
      allowFullScreen
      loading="lazy"
      title="OpenStreetMap Location"
    ></iframe>

    {loadingImages ? (
      <div className="text-center text-gray-500 col-span-full">Loading images...</div>
    ) : photos.length > 0 ? (
      <div className="relative w-full h-64 rounded shadow overflow-hidden">
        <img
          src={photos[currentImageIndex].urls.regular}
          alt={photos[currentImageIndex].alt_description || 'Location image'}
          className="w-full h-full object-cover transform hover:scale-105 transition duration-300 ease-in-out"
        />
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-4">
          <button
            onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-1 rounded-full shadow text-xl"
          >
            ◀
          </button>
          <button
            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % photos.length)}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-1 rounded-full shadow text-xl"
          >
            ▶
          </button>
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center text-sm text-white bg-black bg-opacity-50 py-1">
          {photos[currentImageIndex].description || photos[currentImageIndex].alt_description || 'Untitled'}
        </div>
      </div>
    ) : (
      <div className="text-center text-gray-500 col-span-full">
        No images available for "{location}"
      </div>
    )}
  </div>
)}



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
                      <td className="border px-4 py-2">{displayLocation || item.location}</td>
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

        <footer className="mt-12 text-center text-sm text-gray-600">
          Built by <strong>Suraj Kumar Singh</strong>. Learn more about the <a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Product Manager Accelerator</a>.
        </footer>
      </div>
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={exportAsJSON} className="px-4 py-2 bg-yellow-500 text-white rounded">Export JSON</button>
          <button onClick={exportAsXML} className="px-4 py-2 bg-blue-500 text-white rounded">Export XML</button>
          <button onClick={exportAsMarkdown} className="px-4 py-2 bg-green-500 text-white rounded">Export MD</button>
          <button onClick={exportAsPDF} className="px-4 py-2 bg-red-500 text-white rounded">Export PDF</button>
        </div>

    </div>
  );
}

export default App;
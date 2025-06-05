import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function WeatherMap({ latitude, longitude, locationName }) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={12} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]}>
        <Popup>{locationName}</Popup>
      </Marker>
    </MapContainer>
  );
}

export default WeatherMap;

import { useEffect, useRef, useState } from "react";
import "./LocationModal.css";

const SIRAJGANJ_CENTER = { lat: 24.4534, lng: 89.7160 };

export default function LocationModal({ onClose, onConfirm }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchRef = useRef(null);
  const [address, setAddress] = useState("Loading...");
  const [coords, setCoords] = useState(SIRAJGANJ_CENTER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: SIRAJGANJ_CENTER,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: SIRAJGANJ_CENTER,
        map,
        draggable: true,
      });
      markerRef.current = marker;

      new window.google.maps.Circle({
        map,
        center: SIRAJGANJ_CENTER,
        radius: 5000,
        fillColor: "#1a9e5c",
        fillOpacity: 0.08,
        strokeColor: "#1a9e5c",
        strokeOpacity: 0.4,
        strokeWeight: 2,
      });

      // Search box
      const searchBox = new window.google.maps.places.SearchBox(searchRef.current);
      map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
      });
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        map.setCenter({ lat, lng });
        map.setZoom(16);
        marker.setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        reverseGeocode(pos.lat(), pos.lng());
      });

      map.addListener("click", (e) => {
        marker.setPosition(e.latLng);
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      });

      reverseGeocode(SIRAJGANJ_CENTER.lat, SIRAJGANJ_CENTER.lng);
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          initMap();
        }
      }, 200);
    }
  }, []);

  const reverseGeocode = (lat, lng) => {
    setCoords({ lat, lng });
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(lat.toFixed(4) + ", " + lng.toFixed(4));
      }
    });
  };

  const handleGPS = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng = { lat: latitude, lng: longitude };
        mapInstanceRef.current.setCenter(latlng);
        mapInstanceRef.current.setZoom(16);
        markerRef.current.setPosition(latlng);
        reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      () => {
        alert("Location not found. Please search or set pin manually.");
        setLoading(false);
      }
    );
  };

  const handleConfirm = () => {
    onConfirm({ address, coords });
    onClose();
  };

  return (
    <div className="location-overlay">
      <div className="location-modal">
        <div className="location-header">
          <h2>Set Delivery Location</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="search-box-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            placeholder='Search area e.g. "Janpur", "Sirajganj Sadar"'
            className="search-box-input"
          />
        </div>
        <div ref={mapRef} style={{ width:'100%', height:'300px' }}></div>
<div className="map-hint">📌 Click on the map or drag the pin to set your exact location</div>
        <div className="location-footer">
          <div className="address-box">
            <span>📍</span>
            <p>{address}</p>
          </div>
          <button className="gps-btn" onClick={handleGPS} disabled={loading}>
            {loading ? "Finding..." : "📡 Use My Location"}
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            ✅ Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
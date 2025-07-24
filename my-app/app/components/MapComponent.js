'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194 // San Francisco default
};

const libraries = ['places'];

export default function MapComponent({ 
  origin, 
  destination, 
  directions, 
  onOriginChange, 
  onDestinationChange,
  places = []
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Update directions when directions prop changes
  useEffect(() => {
    if (directions && directions.routes && directions.routes.length > 0) {
      // Convert our directions format back to Google Maps format
      if (window.google?.maps && origin && destination) {
        const directionsService = new window.google.maps.DirectionsService();
        
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK') {
              setDirectionsResponse(result);
            }
          }
        );
      }
    }
  }, [directions, origin, destination]);

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    if (!origin) {
      onOriginChange?.({ lat, lng });
    } else if (!destination) {
      onDestinationChange?.({ lat, lng });
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={origin || destination || defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {/* Origin marker */}
        {origin && (
          <Marker
            position={origin}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
            }}
            title="Origin"
          />
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={destination}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
            }}
            title="Destination"
          />
        )}

        {/* Places markers */}
        {places.map((place, index) => (
          <Marker
            key={place.place_id}
            position={place.geometry.location}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="6" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
                  <circle cx="10" cy="10" r="2" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(20, 20),
            }}
            title={place.name}
          />
        ))}

        {/* Directions */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: true, // We're using custom markers
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

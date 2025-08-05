'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194 // San Francisco default
};

export default function MapComponent({ 
  origin, 
  destination, 
  directions, 
  onOriginChange, 
  onDestinationChange,
  places = []
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script manually
  useEffect(() => {
    if (!apiKey) {
      setLoadError('API key missing');
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Error loading Google Maps:', error);
      setLoadError('Failed to load Google Maps script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript && existingScript === script) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: origin || destination || defaultCenter,
      zoom: 10,
    });

    const dirService = new window.google.maps.DirectionsService();
    const dirRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
    });
    
    dirRenderer.setMap(googleMap);
    
    setMap(googleMap);
    setDirectionsService(dirService);
    setDirectionsRenderer(dirRenderer);

    // Add click listener
    googleMap.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      if (!origin) {
        onOriginChange?.({ lat, lng });
      } else if (!destination) {
        onDestinationChange?.({ lat, lng });
      }
    });
  }, [isLoaded, origin, destination, map, onOriginChange, onDestinationChange]);

  // Update directions when routes change
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination]);

  // Add markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers (you might want to store them in state for better cleanup)
    
    // Origin marker
    if (origin) {
      new window.google.maps.Marker({
        position: origin,
        map: map,
        title: 'Origin',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    // Destination marker
    if (destination) {
      new window.google.maps.Marker({
        position: destination,
        map: map,
        title: 'Destination',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    // Places markers
    places.forEach((place) => {
      new window.google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    });
  }, [map, origin, destination, places]);

  // Don't render if no API key
  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-yellow-50 border border-yellow-200 flex items-center justify-center">
        <div className="text-yellow-700 text-center">
          <div className="font-semibold">Google Maps API Key Missing</div>
          <div className="text-sm mt-1">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <div className="w-full h-96 bg-red-50 border border-red-200 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <div className="font-semibold">Error loading Google Maps</div>
          <div className="text-sm mt-1">Please check your API key configuration</div>
          <div className="text-xs mt-1 text-gray-500">Check console for details</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={mapRef} style={containerStyle} />
    </div>
  );
}

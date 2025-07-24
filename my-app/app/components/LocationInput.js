'use client';

import { useState, useEffect } from 'react';

export default function LocationInput({ 
  onLocationSet, 
  placeholder = "Enter location or click 'Use Current Location'",
  label = "Location"
}) {
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch('/api/maps/geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude
            }),
          });

          const data = await response.json();
          
          if (response.ok) {
            setAddress(data.formatted_address);
            onLocationSet?.({
              address: data.formatted_address,
              coordinates: { lat: latitude, lng: longitude },
              placeId: data.place_id
            });
          } else {
            setLocationError('Failed to get address for current location');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setLocationError('Failed to get address for current location');
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Failed to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    try {
      const response = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onLocationSet?.({
          address: data.formatted_address,
          coordinates: data.location,
          placeId: data.place_id
        });
      } else {
        setLocationError(data.error || 'Failed to find location');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationError('Failed to find location');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      <form onSubmit={handleAddressSubmit} className="flex space-x-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          disabled={!address.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Set
        </button>
      </form>

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50"
        >
          {isGettingLocation ? (
            <span className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Getting location...</span>
            </span>
          ) : (
            '📍 Use Current Location'
          )}
        </button>
      </div>

      {locationError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {locationError}
        </div>
      )}
    </div>
  );
}

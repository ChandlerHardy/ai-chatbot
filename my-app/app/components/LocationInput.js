'use client';

import { useState, useEffect, useRef } from 'react';

export default function LocationInput({ 
  onLocationSet, 
  placeholder = "Enter location or click 'Use Current Location'",
  label = "Location"
}) {
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const debounceRef = useRef(null);

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

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (input) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch('/api/maps/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      setSuggestions(data.predictions || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setLocationError('');
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = async (suggestion) => {
    setAddress(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Geocode the selected place
    try {
      const response = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: suggestion.place_id
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
      console.error('Error geocoding place:', error);
      setLocationError('Failed to find location');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          handleAddressSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setShowSuggestions(false);
    
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

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      <div className="relative" ref={inputRef}>
        <form onSubmit={handleAddressSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              autoComplete="off"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {suggestion.main_text}
                    </div>
                    {suggestion.secondary_text && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {suggestion.secondary_text}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!address.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Set
          </button>
        </form>
      </div>

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

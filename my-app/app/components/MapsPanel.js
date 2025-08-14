'use client';

import dynamic from 'next/dynamic';
import LocationInput from './LocationInput';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">Loading map...</div>
});

export default function MapsPanel({
  origin,
  destination,
  routes,
  places,
  traffic,
  isLoadingMap,
  onOriginChange,
  onDestinationChange,
  onFindPlaces,
  onGetDirections,
  onGetTraffic
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Route Planning</h3>
      </div>
      
      {/* Location Inputs */}
      <div className="space-y-3">
        <LocationInput
          label="From (Origin)"
          placeholder="Enter starting location..."
          onLocationSet={onOriginChange}
        />
        
        <LocationInput
          label="To (Destination)"
          placeholder="Enter destination..."
          onLocationSet={onDestinationChange}
        />
      </div>

      {/* Action Buttons */}
      {origin && destination && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFindPlaces('restaurant')}
            disabled={isLoadingMap}
            className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors disabled:opacity-50"
          >
            🍽️ Restaurants
          </button>
          <button
            onClick={() => onFindPlaces('gas_station')}
            disabled={isLoadingMap}
            className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50"
          >
            ⛽ Gas Stations
          </button>
          <button
            onClick={() => onFindPlaces('tourist_attraction')}
            disabled={isLoadingMap}
            className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg transition-colors disabled:opacity-50"
          >
            🎯 Attractions
          </button>
        </div>
      )}

      {/* Compact Map Component */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <MapComponent
          origin={origin?.coordinates}
          destination={destination?.coordinates}
          directions={{ routes }}
          places={places}
          onOriginChange={(coords) => onOriginChange({ coordinates: coords, address: 'Selected location' })}
          onDestinationChange={(coords) => onDestinationChange({ coordinates: coords, address: 'Selected location' })}
        />
      </div>

      {/* Route Info - Collapsed by default */}
      {routes.length > 0 && (
        <details className="bg-gray-50 dark:bg-gray-800 rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-800 dark:text-white">
            Route Details ({routes.length} route{routes.length > 1 ? 's' : ''})
          </summary>
          <div className="px-3 pb-3 space-y-2">
            {routes.map((route, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                <div className="font-medium">{route.summary}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {route.duration_text} • {route.distance_text}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Traffic Info - Collapsed by default */}
      {traffic && (
        <details className="bg-gray-50 dark:bg-gray-800 rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-800 dark:text-white">
            Traffic Conditions
          </summary>
          <div className="px-3 pb-3 space-y-2">
            {traffic.traffic_info.map((info, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{info.summary}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    info.traffic_level === 'light' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    info.traffic_level === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {info.traffic_level}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  {info.duration_in_traffic.text} (+{info.traffic_delay.text} delay)
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
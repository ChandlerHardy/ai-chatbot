export async function POST(request) {
  try {
    const { address, lat, lng, placeId } = await request.json();

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let response, data;

    if (placeId) {
      // Place ID geocoding (most accurate)
      const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = new URLSearchParams({
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
      });

      const url = `${baseUrl}?${params.toString()}`;
      response = await fetch(url);
      data = await response.json();

      if (data.status !== 'OK' || data.results.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Place not found",
          status: data.status 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = data.results[0];
      return new Response(JSON.stringify({
        formatted_address: result.formatted_address,
        location: result.geometry.location,
        place_id: result.place_id,
        types: result.types,
        address_components: result.address_components
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } else if (address) {
      // Forward geocoding (address to coordinates)
      const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = new URLSearchParams({
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      });

      const url = `${baseUrl}?${params.toString()}`;
      response = await fetch(url);
      data = await response.json();

      if (data.status !== 'OK' || data.results.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Address not found",
          status: data.status 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = data.results[0];
      return new Response(JSON.stringify({
        formatted_address: result.formatted_address,
        location: result.geometry.location,
        place_id: result.place_id,
        types: result.types,
        address_components: result.address_components
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } else if (lat && lng) {
      // Reverse geocoding (coordinates to address)
      const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = new URLSearchParams({
        latlng: `${parseFloat(lat)},${parseFloat(lng)}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      });

      const url = `${baseUrl}?${params.toString()}`;
      response = await fetch(url);
      data = await response.json();

      if (data.status !== 'OK' || data.results.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Location not found",
          status: data.status 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = data.results[0];
      return new Response(JSON.stringify({
        formatted_address: result.formatted_address,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        place_id: result.place_id,
        types: result.types,
        address_components: result.address_components
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ 
        error: "Either address, placeId, or lat/lng coordinates are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("Google Maps Geocoding API Error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to geocode location",
      details: error.response?.data?.error_message || error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const { 
      location, 
      type = 'restaurant', 
      radius = 5000, 
      keyword = '',
      route_points = [] 
    } = await request.json();

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!location && route_points.length === 0) {
      return new Response(JSON.stringify({ error: "Location or route points are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let allPlaces = [];

    // If route points are provided, search along the route
    if (route_points.length > 0) {
      for (const point of route_points) {
        try {
          const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
          const params = new URLSearchParams({
            location: point,
            radius: radius.toString(),
            type,
            key: process.env.GOOGLE_MAPS_API_KEY,
          });

          if (keyword) {
            params.append('keyword', keyword);
          }

          const url = `${baseUrl}?${params.toString()}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.results) {
            allPlaces.push(...data.results);
          }
        } catch (error) {
          console.error(`Error searching near point ${point}:`, error);
        }
      }
    } else {
      // Single location search
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = new URLSearchParams({
        location,
        radius: radius.toString(),
        type,
        key: process.env.GOOGLE_MAPS_API_KEY,
      });

      if (keyword) {
        params.append('keyword', keyword);
      }

      const url = `${baseUrl}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      allPlaces = data.results || [];
    }

    // Remove duplicates based on place_id and sort by rating
    const uniquePlaces = allPlaces
      .filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 20); // Limit to top 20 results

    const formattedPlaces = uniquePlaces.map(place => ({
      place_id: place.place_id,
      name: place.name,
      rating: place.rating,
      price_level: place.price_level,
      vicinity: place.vicinity,
      types: place.types,
      opening_hours: place.opening_hours,
      photos: place.photos ? place.photos.slice(0, 1).map(photo => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : [],
      geometry: {
        location: place.geometry.location
      }
    }));

    return new Response(JSON.stringify({
      places: formattedPlaces,
      search_params: { type, radius, keyword }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Maps Places API Error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to search for places",
      details: error.response?.data?.error_message || error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

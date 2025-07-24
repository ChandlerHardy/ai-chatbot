export async function POST(request) {
  try {
    const { origin, destination, waypoints = [], travelMode = 'DRIVING' } = await request.json();

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!origin || !destination) {
      return new Response(JSON.stringify({ error: "Origin and destination are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build the Google Maps Directions API URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin,
      destination,
      mode: travelMode.toLowerCase(),
      alternatives: 'true',
      key: process.env.GOOGLE_MAPS_API_KEY,
    });

    if (waypoints.length > 0) {
      params.append('waypoints', waypoints.join('|'));
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Requesting directions from URL:', url.replace(process.env.GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('Directions API response status:', data.status);

    if (data.status !== 'OK') {
      return new Response(JSON.stringify({ 
        error: "Failed to get directions",
        status: data.status,
        details: data.error_message || `Google Maps API returned status: ${data.status}`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract relevant information for the chatbot
    const routes = data.routes.map((route, index) => ({
      id: index,
      summary: route.summary,
      duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
      distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
      duration_text: route.legs.map(leg => leg.duration.text).join(', '),
      distance_text: route.legs.map(leg => leg.distance.text).join(', '),
      steps: route.legs.flatMap(leg => leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        duration: step.duration.text,
        distance: step.distance.text,
        travel_mode: step.travel_mode
      }))),
      warnings: route.warnings || [],
      waypoint_order: route.waypoint_order || []
    }));

    return new Response(JSON.stringify({
      status: data.status,
      routes,
      origin_address: data.routes[0]?.legs[0]?.start_address,
      destination_address: data.routes[0]?.legs[data.routes[0].legs.length - 1]?.end_address
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Maps Directions API Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: "Failed to get directions",
      details: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

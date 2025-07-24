export async function POST(request) {
  try {
    const { origin, destination, departure_time = 'now' } = await request.json();

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

    // Get directions with traffic information using direct HTTP API
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'driving',
      departure_time: departure_time === 'now' ? Math.floor(Date.now() / 1000).toString() : departure_time.toString(),
      traffic_model: 'best_guess',
      alternatives: 'true',
      key: process.env.GOOGLE_MAPS_API_KEY,
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return new Response(JSON.stringify({ 
        error: "Failed to get traffic information",
        status: data.status 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const trafficInfo = data.routes.map((route, index) => {
      const totalDuration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
      const totalDurationInTraffic = route.legs.reduce((total, leg) => 
        total + (leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value), 0);
      
      const trafficDelay = totalDurationInTraffic - totalDuration;
      const trafficLevel = trafficDelay <= 300 ? 'light' : trafficDelay <= 900 ? 'moderate' : 'heavy';

      return {
        route_index: index,
        summary: route.summary,
        duration_normal: {
          value: totalDuration,
          text: Math.floor(totalDuration / 60) + ' min'
        },
        duration_in_traffic: {
          value: totalDurationInTraffic,
          text: Math.floor(totalDurationInTraffic / 60) + ' min'
        },
        traffic_delay: {
          value: trafficDelay,
          text: Math.floor(trafficDelay / 60) + ' min'
        },
        traffic_level: trafficLevel,
        distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
        distance_text: route.legs.map(leg => leg.distance.text).join(', '),
        warnings: route.warnings || []
      };
    });

    // Sort by duration in traffic (fastest first)
    trafficInfo.sort((a, b) => a.duration_in_traffic.value - b.duration_in_traffic.value);

    return new Response(JSON.stringify({
      status: 'OK',
      traffic_info: trafficInfo,
      departure_time: departure_time,
      current_time: Math.floor(Date.now() / 1000)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Maps Traffic API Error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to get traffic information",
      details: error.response?.data?.error_message || error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

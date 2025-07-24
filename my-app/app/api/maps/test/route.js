import { Client } from "@googlemaps/google-maps-services-js";

export async function GET(request) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "Google Maps API key not configured",
        hasKey: false 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test the client initialization
    const client = new Client({});
    
    // Simple geocoding test
    const response = await client.geocode({
      params: {
        address: "New York, NY",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    return new Response(JSON.stringify({ 
      success: true,
      status: response.data.status,
      hasResults: response.data.results.length > 0,
      firstResult: response.data.results[0]?.formatted_address || "No results",
      message: "Google Maps API is working properly"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Maps Test Error:", error);
    return new Response(JSON.stringify({ 
      error: "Google Maps API test failed",
      details: error.message,
      stack: error.stack,
      errorType: error.constructor.name
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export async function POST(request) {
  try {
    const { input } = await request.json();
    
    console.log(`Autocomplete request for: "${input}"`);
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error("GOOGLE_MAPS_API_KEY not found in environment variables");
      return new Response(JSON.stringify({ 
        error: "Google Maps API key not configured",
        predictions: [] 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (!input || input.trim().length < 2) {
      console.log("Input too short, returning empty predictions");
      return new Response(JSON.stringify({ predictions: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await client.placeAutocomplete({
      params: {
        input: input.trim(),
        key: process.env.GOOGLE_MAPS_API_KEY,
        // No types restriction = get all results (addresses, businesses, landmarks)
        language: 'en',
        components: 'country:us' // Correct format for components parameter
      }
    });

    console.log(`Google API response status: ${response.status}`);
    console.log(`Number of predictions: ${response.data.predictions?.length || 0}`);

    const predictions = response.data.predictions.map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.structured_formatting?.main_text || prediction.description,
      secondary_text: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types
    }));

    return new Response(JSON.stringify({ predictions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Autocomplete API Error:", error);
    console.error("Error details:", error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: "Failed to get autocomplete suggestions",
      details: error.response?.data?.error_message || error.message,
      predictions: []
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
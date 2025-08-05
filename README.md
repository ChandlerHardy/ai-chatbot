# Next.js Chatbot with Google Maps Integration

This Next.js application features an AI chatbot with multiple specialized agents, including a Maps Assistant that integrates with Google Maps API for route planning, location search, and travel assistance.

## Features

### Chatbot Agents
- **🤖 General Assistant**: Helpful AI for general questions
- **💻 Code Expert**: Programming and development assistance
- **🎨 Creative Writer**: Creative writing and storytelling
- **📊 Business Advisor**: Business strategy and professional guidance
- **🔬 Science Expert**: Scientific research and technical analysis
- **😊 Casual Friend**: Friendly conversational companion
- **🗺️ Maps Assistant**: Navigation, routes, and location-based assistance

### Maps Features
- **Route Planning**: Get directions between any two locations
- **Traffic Information**: Real-time traffic conditions and delays
- **Place Discovery**: Find restaurants, gas stations, and attractions along your route
- **Interactive Map**: Visual route display with markers
- **Location Services**: Use current location or search for addresses
- **Smart Queries**: Ask natural language questions about routes and locations

## Vercel Deployment
Available on [this vercel link](https://ai-chatbot-p54ijq32i-chandlerhardys-projects.vercel.app/)

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- GitHub Token for AI models
- Google Maps API key

### 1. Clone and Install Dependencies
```bash
git clone <your-repo>
cd my-app
npm install
```

### 2. Environment Variables
Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
# GitHub Models API (required for chatbot)
GITHUB_TOKEN=your_github_token_here

# Google Maps API (required for maps functionality)  
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Get API Keys

#### GitHub Token
1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token with appropriate permissions
3. Copy the token to your `.env` file

#### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Copy the API key to your `.env` file (both variables)

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to use the application.

## Usage

### General Chat
1. Select any agent from the dropdown
2. Start typing your questions
3. The AI will respond based on the selected agent's specialization

### Maps Assistant
1. Select "🗺️ Maps Assistant" from the agent dropdown
2. Enter your origin and destination locations
3. The map will show your route with traffic information
4. Use the buttons to find places along your route:
   - 🍽️ Find Restaurants
   - ⛽ Find Gas Stations  
   - 🎯 Find Attractions
5. Ask questions like:
   - "What restaurants are on the way?"
   - "How is traffic looking on this route?"
   - "Are there any gas stations near my destination?"
   - "What's the fastest route right now?"

### Example Maps Queries
- "Show me the best route to downtown"
- "Find Italian restaurants along my route"
- "How long will it take with current traffic?"
- "Are there any scenic routes to my destination?"
- "What attractions are worth stopping at?"

## Technical Details

### Architecture
- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API with @react-google-maps/api
- **AI**: GitHub Models API (Meta Llama 3.1)
- **APIs**: Custom Next.js API routes for maps integration

### API Endpoints
- `/api/chat` - Main chatbot endpoint
- `/api/maps/directions` - Get route directions
- `/api/maps/places` - Find places along routes
- `/api/maps/traffic` - Get traffic information
- `/api/maps/geocode` - Convert addresses to coordinates

### Components
- `MapComponent` - Interactive Google Maps display
- `LocationInput` - Location search and current location detection
- Main chat interface with agent switching

## Development

### Running in Development
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Project Structure
```
app/
├── components/
│   ├── MapComponent.js      # Google Maps integration
│   └── LocationInput.js     # Location input component
├── api/
│   ├── chat/               # Main chat API
│   └── maps/               # Maps API endpoints
│       ├── directions/
│       ├── places/
│       ├── traffic/
│       └── geocode/
├── page.js                 # Main application
├── layout.js              # App layout
└── globals.css            # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

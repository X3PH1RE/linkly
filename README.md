# SmartMeet - Real-time Video Communication Platform

A modern, high-quality video communication platform built with React, TypeScript, and LiveKit. Features group video calls, screen sharing, and real-time audio/video with low latency using WebRTC and SFU (Selective Forwarding Unit) architecture.

## ✨ Features

- **🎥 HD Video Quality** - Crystal clear video calls with adaptive quality
- **🎙️ High-Quality Audio** - Low-latency, noise-reduced audio communication
- **👥 Multi-Participant Support** - Group video calls with dynamic participant handling
- **🖥️ Screen Sharing** - Share your screen with other participants
- **🚀 Real-time Communication** - Powered by WebRTC with LiveKit SFU
- **📱 Responsive Design** - Works on desktop and mobile devices
- **🎨 Modern UI** - Clean, intuitive interface built with Tailwind CSS

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js with LiveKit Server SDK
- **WebRTC Infrastructure**: LiveKit (SFU Architecture)
- **Real-time Communication**: WebRTC with LiveKit JavaScript SDK

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **LiveKit Server** (for local development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start LiveKit Server (Local Development)

Download and run LiveKit server locally:

```bash
# Download LiveKit server
curl -sSL https://get.livekit.io | bash

# Run LiveKit server with default settings
livekit-server --dev
```

The server will start on `ws://localhost:7880` with default dev credentials.

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# LiveKit Configuration
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Server Configuration
PORT=3001
```

### 4. Start the Application

Start both frontend and backend:

```bash
# Start the frontend (Terminal 1)
npm run dev

# Start the backend server (Terminal 2)
npm run server
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔧 Production Setup

### Using LiveKit Cloud

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Update your `.env` file:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### Self-Hosted LiveKit

Follow the [LiveKit deployment guide](https://docs.livekit.io/deploy) for production deployment.

## 📖 Usage

### Joining a Room

1. **Enter Your Name**: Provide your display name
2. **Enter Room Name**: Choose a room name or use Quick Start for a random room
3. **Join**: Click "Join Room" to enter the video call

### During a Call

- **🎙️ Mute/Unmute**: Toggle your microphone
- **📹 Camera On/Off**: Toggle your camera
- **🖥️ Screen Share**: Share your screen with other participants
- **📞 Leave Call**: Exit the room

### Controls

The platform provides intuitive controls for:
- Audio/video management
- Screen sharing
- Participant management
- Room navigation

## 🛠️ Development

### Project Structure

```
smart_meet/
├── src/
│   ├── components/
│   │   ├── HomePage.tsx          # Landing page with room joining
│   │   ├── VideoRoom.tsx         # Main video conference room
│   │   └── VideoControls.tsx     # Audio/video control buttons
│   ├── App.tsx                   # Main app with routing
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles with Tailwind
├── server/
│   └── index.js                  # Express backend with LiveKit integration
├── public/                       # Static assets
└── package.json                  # Dependencies and scripts
```

### Key Technologies

- **[LiveKit](https://livekit.io/)**: WebRTC SFU for real-time communication
- **[React](https://react.dev/)**: Frontend framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Vite](https://vitejs.dev/)**: Fast build tool
- **[Express.js](https://expressjs.com/)**: Backend server

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend server
npm run lint         # Run ESLint
```

## 🔌 API Endpoints

### Backend API

- `POST /api/rooms/join` - Join or create a room
- `GET /api/rooms/:roomName` - Get room information
- `GET /api/rooms` - List all active rooms
- `POST /api/rooms/:roomName/leave` - Leave a room
- `GET /health` - Health check

## 🚧 Roadmap

Future enhancements planned:

- **💬 Real-time Chat** - Text messaging during calls
- **📝 AI Transcription** - Automatic speech-to-text
- **🎭 Virtual Backgrounds** - Background replacement/blur
- **📊 Call Analytics** - Quality metrics and analytics
- **🔐 Authentication** - User accounts and room security
- **📱 Mobile App** - Native mobile applications
- **🎮 Interactive Features** - Polls, reactions, and more

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure LiveKit server is running
   - Check firewall settings
   - Verify CORS configuration

2. **No Audio/Video**
   - Grant browser permissions for camera/microphone
   - Check device settings
   - Try a different browser

3. **Poor Quality**
   - Check network connection
   - Reduce participant count for testing
   - Adjust LiveKit server configuration

### Development Tips

- Use Chrome/Edge for best WebRTC support
- Enable HTTPS for production (required for WebRTC)
- Test with multiple browsers and devices
- Monitor browser console for errors

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## 🆘 Support

- **Documentation**: [LiveKit Docs](https://docs.livekit.io)
- **Issues**: [GitHub Issues](https://github.com/your-username/smart_meet/issues)
- **Community**: [LiveKit Community](https://livekit.io/community)

---

Built with ❤️ using React, TypeScript, and LiveKit WebRTC infrastructure.

# SmartMeet Setup Guide

Complete setup instructions for the SmartMeet real-time video communication platform.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **LiveKit Server** - Required for video/audio communication

### 1. Install Dependencies

```bash
cd smart_meet
npm install
```

### 2. Start LiveKit Server

**Option A: Download and run locally (Recommended for development)**
```bash
# Download LiveKit server
curl -sSL https://get.livekit.io | bash

# Run LiveKit server with default development settings
livekit-server --dev
```

**Option B: Use LiveKit Cloud**
1. Sign up at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Update environment variables (see Configuration section)

### 3. Configure Environment

Create a `.env` file in the `smart_meet` directory:

```bash
# LiveKit Configuration (Development)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Server Configuration
PORT=3001
```

### 4. Start the Application

**Option A: Use the start script (Windows)**
```bash
# Double-click start.bat or run:
start.bat
```

**Option B: Manual start (Cross-platform)**
```bash
# Terminal 1: Start the frontend
npm run dev

# Terminal 2: Start the backend
npm run server
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📖 How to Use

### Joining a Video Call

1. **Navigate** to http://localhost:5173
2. **Enter your name** in the "Your Name" field
3. **Enter a room name** or click "Quick Start" for a random room
4. **Click "Join Room"** to enter the video call
5. **Grant permissions** when prompted for camera and microphone access

### During a Call

- **🎙️ Mute/Unmute**: Click the microphone button
- **📹 Camera On/Off**: Click the camera button  
- **🖥️ Screen Share**: Click the screen share button
- **📞 Leave Call**: Click the phone button or back arrow

### Testing with Multiple Participants

1. **Open multiple browser tabs** or different browsers
2. **Join the same room** with different participant names
3. **Test audio/video** communication between participants

## 🏗️ Architecture Overview

```
SmartMeet Architecture
├── Frontend (React + TypeScript + Vite)
│   ├── Landing Page (HomePage.tsx)
│   ├── Video Room (VideoRoom.tsx)
│   └── Tailwind CSS Styling
├── Backend (Express.js + LiveKit SDK)
│   ├── Room Management API
│   ├── Token Generation
│   └── Participant Tracking
└── LiveKit Server (WebRTC SFU)
    ├── Real-time Media Routing
    ├── Screen Sharing Support
    └── Multi-participant Handling
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LIVEKIT_URL` | LiveKit server WebSocket URL | `ws://localhost:7880` | Yes |
| `LIVEKIT_API_KEY` | LiveKit API key | `devkey` | Yes |
| `LIVEKIT_API_SECRET` | LiveKit API secret | `secret` | Yes |
| `PORT` | Backend server port | `3001` | No |

### LiveKit Server Options

**Development (Local)**
```bash
livekit-server --dev
# Uses default credentials: devkey/secret
# Runs on ws://localhost:7880
```

**Production (Self-hosted)**
```bash
livekit-server --config config.yaml
```

**Production (LiveKit Cloud)**
- Sign up at https://cloud.livekit.io
- Create a project and get your credentials
- Update `.env` with your project's URL and keys

## 🛠️ Development

### Project Structure

```
smart_meet/
├── src/
│   ├── components/
│   │   ├── HomePage.tsx          # Landing page
│   │   └── VideoRoom.tsx         # Video call interface
│   ├── App.tsx                   # Main app with routing
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind styles
├── server/
│   ├── index.js                  # Express backend
│   └── package.json              # ES modules config
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind configuration
└── vite.config.ts               # Vite configuration
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development frontend |
| `npm run server` | Start backend server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Key Features Implemented

- ✅ **Multi-participant video calls**
- ✅ **Audio/video mute controls**
- ✅ **Screen sharing**
- ✅ **Responsive grid layout**
- ✅ **Real-time participant management**
- ✅ **Room creation and joining**
- ✅ **WebRTC with SFU architecture**

## 🐛 Troubleshooting

### Common Issues

**1. "Connection Failed" Error**
- Ensure LiveKit server is running on port 7880
- Check that no firewall is blocking the connection
- Verify environment variables are set correctly

**2. No Video/Audio**
- Grant browser permissions for camera and microphone
- Try refreshing the page and granting permissions again
- Test in an incognito/private browsing window

**3. "Failed to join room" Error**
- Make sure the backend server is running on port 3001
- Check browser console for detailed error messages
- Verify CORS configuration if accessing from different domains

**4. Screen Sharing Not Working**
- Screen sharing requires HTTPS in production
- Some browsers require user gesture to start screen sharing
- Check browser compatibility (Chrome/Edge work best)

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Good support |
| Safari | ⚠️ Limited | Some WebRTC limitations |
| Edge | ✅ Full | Chromium-based |

### Debugging Tips

1. **Check browser console** for JavaScript errors
2. **Monitor network tab** for failed API requests
3. **Verify LiveKit server logs** for connection issues
4. **Test with localhost** before deploying
5. **Use HTTPS** for production deployment

## 🚀 Production Deployment

### Frontend (Vite Build)

```bash
npm run build
# Serve the dist/ folder with your web server
```

### Backend (Express)

```bash
# Set production environment variables
export LIVEKIT_URL=wss://your-livekit-server.com
export LIVEKIT_API_KEY=your-production-key
export LIVEKIT_API_SECRET=your-production-secret

# Start the server
npm run server
```

### LiveKit Server

- **Cloud**: Use [LiveKit Cloud](https://cloud.livekit.io) (recommended)
- **Self-hosted**: Follow [deployment guide](https://docs.livekit.io/deploy)

## 📚 Next Steps

### Potential Enhancements

- **🔐 Authentication**: Add user accounts and room security
- **💬 Chat**: Real-time text messaging during calls
- **📝 Recording**: Save video call recordings
- **🎭 Virtual Backgrounds**: Background blur/replacement
- **📊 Analytics**: Call quality metrics and analytics
- **📱 Mobile App**: React Native mobile application

### Resources

- **LiveKit Documentation**: https://docs.livekit.io
- **WebRTC Guide**: https://webrtc.org/getting-started/
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

## ✨ Success!

If you can see the SmartMeet interface and successfully join video calls, you've successfully set up a complete real-time video communication platform! 

The platform now supports:
- Group video calls with multiple participants
- High-quality, low-latency audio and video
- Screen sharing functionality  
- Modern, responsive UI
- WebRTC with SFU architecture via LiveKit

Happy video calling! 📹🎉 
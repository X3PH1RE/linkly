import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// LiveKit configuration
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

// Store active rooms (in production, use a database)
const activeRooms = new Map();

// Generate access token for a participant
function generateAccessToken(roomName, participantName) {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    name: participantName,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', livekit_url: LIVEKIT_URL });
});

// Create or join a room
app.post('/api/rooms/join', (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ 
        error: 'Room name and participant name are required' 
      });
    }

    // Generate access token
    const token = generateAccessToken(roomName, participantName);

    // Track the room
    if (!activeRooms.has(roomName)) {
      activeRooms.set(roomName, {
        name: roomName,
        participants: new Set(),
        createdAt: new Date(),
      });
    }

    const room = activeRooms.get(roomName);
    room.participants.add(participantName);

    res.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      participantName,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get room info
app.get('/api/rooms/:roomName', (req, res) => {
  const { roomName } = req.params;
  const room = activeRooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    name: room.name,
    participantCount: room.participants.size,
    participants: Array.from(room.participants),
    createdAt: room.createdAt,
  });
});

// List all active rooms
app.get('/api/rooms', (req, res) => {
  const rooms = Array.from(activeRooms.values()).map(room => ({
    name: room.name,
    participantCount: room.participants.size,
    createdAt: room.createdAt,
  }));

  res.json(rooms);
});

// Remove participant from room
app.post('/api/rooms/:roomName/leave', (req, res) => {
  const { roomName } = req.params;
  const { participantName } = req.body;

  const room = activeRooms.get(roomName);
  if (room) {
    room.participants.delete(participantName);
    
    // Clean up empty rooms
    if (room.participants.size === 0) {
      activeRooms.delete(roomName);
    }
  }

  res.json({ success: true });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LiveKit URL: ${LIVEKIT_URL}`);
  console.log('Make sure LiveKit server is running for full functionality');
}); 
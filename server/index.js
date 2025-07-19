import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active rooms and participants
const rooms = new Map();

// Helper function to get room info
function getRoomInfo(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      name: roomName,
      participants: new Map(),
      createdAt: new Date()
    });
  }
  return rooms.get(roomName);
}

// REST API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    type: 'Socket.IO WebRTC',
    activeRooms: rooms.size 
  });
});

// Get room info
app.get('/api/rooms/:roomName', (req, res) => {
  const { roomName } = req.params;
  const room = rooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    name: room.name,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.keys()),
    createdAt: room.createdAt,
  });
});

// List all active rooms
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    name: room.name,
    participantCount: room.participants.size,
    createdAt: room.createdAt,
  }));

  res.json(roomList);
});

// Socket.IO WebRTC Signaling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join a room
  socket.on('join-room', (data) => {
    const { roomName, participantName } = data;
    console.log(`🚪 ${participantName} joining room: ${roomName}`);

    // Get or create room
    const room = getRoomInfo(roomName);
    
    // Add participant to room
    room.participants.set(socket.id, {
      id: socket.id,
      name: participantName,
      joinedAt: new Date()
    });

    // Join socket room
    socket.join(roomName);
    socket.roomName = roomName;
    socket.participantName = participantName;

    // Notify existing participants about new user
    socket.to(roomName).emit('user-joined', {
      id: socket.id,
      name: participantName
    });

    // Send current participants list to new user
    const participants = Array.from(room.participants.values())
      .filter(p => p.id !== socket.id);

    socket.emit('room-joined', {
      roomName,
      participants,
      yourId: socket.id
    });

    console.log(`✅ ${participantName} joined room ${roomName}. Total participants: ${room.participants.size}`);
  });

  // Handle WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    console.log(`📤 Forwarding offer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    console.log(`📤 Forwarding answer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    console.log(`🧊 Forwarding ICE candidate from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    
    if (socket.roomName) {
      const room = rooms.get(socket.roomName);
      if (room) {
        // Remove participant from room
        room.participants.delete(socket.id);
        
        // Notify other participants
        socket.to(socket.roomName).emit('user-left', {
          id: socket.id,
          name: socket.participantName
        });

        console.log(`👋 ${socket.participantName} left room ${socket.roomName}`);

        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomName);
          console.log(`🧹 Cleaned up empty room: ${socket.roomName}`);
        }
      }
    }
  });

  // Explicit leave room
  socket.on('leave-room', () => {
    if (socket.roomName) {
      const room = rooms.get(socket.roomName);
      if (room) {
        room.participants.delete(socket.id);
        socket.to(socket.roomName).emit('user-left', {
          id: socket.id,
          name: socket.participantName
        });
        socket.leave(socket.roomName);
        console.log(`🚪 ${socket.participantName} explicitly left room ${socket.roomName}`);
      }
    }
  });
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SmartMeet Server running on port ${PORT}`);
  console.log(`📡 Socket.IO WebRTC signaling server ready`);
  console.log(`🌐 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`💡 This version uses P2P WebRTC - no external servers needed!`);
}); 
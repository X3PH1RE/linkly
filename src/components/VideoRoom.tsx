import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  PhoneIcon,
} from '@heroicons/react/24/solid';
import {
  MicrophoneIcon as MicrophoneOffIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Participant {
  id: string;
  name: string;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream | null;
}

const VideoRoom: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: PeerConnection }>({});
  const participantName = searchParams.get('participant') || 'Anonymous';

  // WebRTC configuration
  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    const initializeRoom = async () => {
      console.log('🚀 Starting room initialization...');
      console.log('Room name:', roomName);
      console.log('Participant name:', participantName);

      if (!roomName) {
        setError('Room name is required');
        setIsLoading(false);
        return;
      }

      try {
        // Get user media first
        console.log('🎥 Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log('✅ Camera and microphone access granted');

        // Connect to Socket.IO
        console.log('📡 Connecting to Socket.IO server...');
        const newSocket = io('http://localhost:3001', {
          transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
          console.log('✅ Connected to server with ID:', newSocket.id);
          
          // Join the room
          console.log('🚪 Joining room...');
          newSocket.emit('join-room', {
            roomName,
            participantName,
          });
        });

        newSocket.on('room-joined', (data) => {
          console.log('✅ Successfully joined room:', data);
          setParticipants(data.participants);
          setIsLoading(false);

          // Create peer connections for existing participants
          data.participants.forEach((participant: Participant) => {
            createPeerConnection(participant.id, true);
          });
        });

        newSocket.on('user-joined', (data) => {
          console.log('👤 New user joined:', data);
          setParticipants(prev => [...prev, data]);
          createPeerConnection(data.id, false);
        });

        newSocket.on('user-left', (data) => {
          console.log('👋 User left:', data);
          setParticipants(prev => prev.filter(p => p.id !== data.id));
          
          // Clean up peer connection
          if (peerConnectionsRef.current[data.id]) {
            peerConnectionsRef.current[data.id].pc.close();
            delete peerConnectionsRef.current[data.id];
          }
        });

        // WebRTC signaling events
        newSocket.on('webrtc-offer', async (data) => {
          console.log('📥 Received offer from:', data.sender);
          await handleOffer(data.offer, data.sender);
        });

        newSocket.on('webrtc-answer', async (data) => {
          console.log('📥 Received answer from:', data.sender);
          await handleAnswer(data.answer, data.sender);
        });

        newSocket.on('webrtc-ice-candidate', async (data) => {
          console.log('🧊 Received ICE candidate from:', data.sender);
          await handleIceCandidate(data.candidate, data.sender);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          if (error.message.includes('CORS')) {
            setError('CORS error: Frontend and backend port mismatch. Check server configuration.');
          } else {
            setError('Failed to connect to server. Make sure the backend is running on port 3001.');
          }
          setIsLoading(false);
        });

        setSocket(newSocket);

      } catch (err) {
        console.error('❌ Error initializing room:', err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Camera and microphone access denied. Please allow permissions and try again.');
        } else {
          setError('Failed to initialize video chat. Please check your camera and microphone.');
        }
        setIsLoading(false);
      }
    };

    initializeRoom();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up room...');
      if (socket) {
        socket.emit('leave-room');
        socket.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(({ pc }) => pc.close());
    };
  }, [roomName, participantName]);

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    console.log(`🔗 Creating peer connection with ${peerId}, initiator: ${isInitiator}`);
    
    const pc = new RTCPeerConnection(pcConfig);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote track from:', peerId);
      const remoteStream = event.streams[0];
      
      // Update the peer connection with remote stream
      peerConnectionsRef.current[peerId] = {
        ...peerConnectionsRef.current[peerId],
        remoteStream,
      };

      // Find and update the video element
      const videoElement = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
      if (videoElement && remoteStream) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate to:', peerId);
        socket.emit('webrtc-ice-candidate', {
          target: peerId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionsRef.current[peerId] = { pc, remoteStream: null };

    // If we're the initiator, create and send offer
    if (isInitiator) {
      createOffer(peerId);
    }
  };

  const createOffer = async (peerId: string) => {
    const peerConnection = peerConnectionsRef.current[peerId];
    if (!peerConnection || !socket) return;

    try {
      console.log('📤 Creating offer for:', peerId);
      const offer = await peerConnection.pc.createOffer();
      await peerConnection.pc.setLocalDescription(offer);
      
      socket.emit('webrtc-offer', {
        target: peerId,
        offer: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection || !socket) return;

    try {
      console.log('📥 Handling offer from:', senderId);
      await peerConnection.pc.setRemoteDescription(offer);
      
      const answer = await peerConnection.pc.createAnswer();
      await peerConnection.pc.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        target: senderId,
        answer: answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection) return;

    try {
      console.log('📥 Handling answer from:', senderId);
      await peerConnection.pc.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection) return;

    try {
      await peerConnection.pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    // Basic screen share implementation
    if (!isScreenShareEnabled) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peerConnectionsRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        setIsScreenShareEnabled(true);
        
        videoTrack.onended = () => {
          setIsScreenShareEnabled(false);
          // Switch back to camera
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peerConnectionsRef.current).forEach(({ pc }) => {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(cameraTrack);
              }
            });
          }
        };
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const handleLeaveRoom = () => {
    console.log('🚪 Leaving room...');
    if (socket) {
      socket.emit('leave-room');
      socket.disconnect();
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Joining room...</p>
          <p className="text-gray-400 text-sm mt-2">Setting up camera and microphone</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-video-dark rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-red-400 mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="bg-gray-800 p-3 rounded mb-4 text-xs">
            <p className="text-gray-400 mb-1">Debug Info:</p>
            <p className="text-gray-300">Room: {roomName}</p>
            <p className="text-gray-300">Participant: {participantName}</p>
            <p className="text-gray-300">Type: Socket.IO + WebRTC P2P</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-video-bg">
      {/* Header */}
      <div className="bg-video-dark border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={handleLeaveRoom}
            className="mr-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{roomName}</h1>
            <p className="text-sm text-gray-400">Participant: {participantName}</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local participant */}
          <div className="video-tile relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="participant-info">
              {participantName} (You)
            </div>
          </div>

          {/* Remote participants */}
          {participants.map((participant) => (
            <div key={participant.id} className="video-tile relative">
              <video
                id={`video-${participant.id}`}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg bg-gray-900"
              />
              <div className="participant-info">
                {participant.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center p-4">
        <div className="flex items-center space-x-4 bg-video-dark bg-opacity-90 backdrop-blur-sm p-4 rounded-lg">
          {/* Microphone Toggle */}
          <button
            onClick={toggleMicrophone}
            className={clsx(
              'control-button',
              !isMicEnabled && 'active'
            )}
            title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicEnabled ? (
              <MicrophoneIcon className="h-6 w-6 text-white" />
            ) : (
              <MicrophoneOffIcon className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            className={clsx(
              'control-button',
              !isCameraEnabled && 'active'
            )}
            title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraEnabled ? (
              <VideoCameraIcon className="h-6 w-6 text-white" />
            ) : (
              <VideoCameraSlashIcon className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={clsx(
              'control-button',
              isScreenShareEnabled && 'primary'
            )}
            title={isScreenShareEnabled ? 'Stop screen share' : 'Share screen'}
          >
            <ComputerDesktopIcon className="h-6 w-6 text-white" />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveRoom}
            className="control-button active"
            title="Leave call"
          >
            <PhoneIcon className="h-6 w-6 text-white transform rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom; 
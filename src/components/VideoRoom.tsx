import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { ArrowLeftIcon, InformationCircleIcon, ClipboardIcon } from '@heroicons/react/24/solid';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  PhoneIcon,
} from '@heroicons/react/24/solid';
import {
  MicrophoneIcon as MicrophoneOffIcon,
  VideoCameraSlashIcon,
  ClipboardDocumentCheckIcon,
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
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: PeerConnection }>({});
  const participantName = searchParams.get('participant') || 'Anonymous';

  // Debug function to check video state
  const debugVideoState = () => {
    console.log('=== VIDEO DEBUG INFO ===');
    console.log('Local stream ref:', localStreamRef.current);
    console.log('Local video element:', localVideoRef.current);
    console.log('Camera enabled:', isCameraEnabled);
    if (localStreamRef.current) {
      console.log('Video tracks:', localStreamRef.current.getVideoTracks());
      console.log('Audio tracks:', localStreamRef.current.getAudioTracks());
    }
    if (localVideoRef.current) {
      console.log('Video element srcObject:', localVideoRef.current.srcObject);
      console.log('Video element paused:', localVideoRef.current.paused);
      console.log('Video element readyState:', localVideoRef.current.readyState);
    }
    console.log('=== END DEBUG INFO ===');
  };

  // Effect to ensure video element gets stream (in case it's created after stream)
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current && !localVideoRef.current.srcObject) {
      console.log('🔄 Setting video stream in secondary effect...');
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(e => console.warn('Secondary video play failed:', e));
    }
  }, [localStreamRef.current, localVideoRef.current]);

  // WebRTC configuration
  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Generate meeting link and code
  const meetingLink = `${window.location.origin}/room/${roomName}`;

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomName || '');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  useEffect(() => {
    let isConnecting = false;
    let currentSocket: Socket | null = null;
    
    const initializeRoom = async () => {
      // Prevent duplicate initialization
      if (isConnecting) {
        console.log('⚠️ Already connecting, skipping duplicate initialization');
        return;
      }
      
      isConnecting = true;
      console.log('🚀 Starting room initialization...');

      if (!roomName) {
        setError('Room name is required');
        setIsLoading(false);
        return;
      }

      try {
        // Get user media first
        console.log('🎥 Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        console.log('✅ Media stream obtained:', stream);
        localStreamRef.current = stream;
        
        // Set local video immediately with better error handling
        if (localVideoRef.current) {
          console.log('📺 Setting local video stream...');
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Always mute own audio to prevent feedback
          localVideoRef.current.autoplay = true;
          localVideoRef.current.playsInline = true;
          
          localVideoRef.current.onloadedmetadata = () => {
            console.log('📺 Local video metadata loaded, starting playback...');
            if (localVideoRef.current) {
              localVideoRef.current.play()
                .then(() => {
                  console.log('✅ Local video playing successfully');
                })
                .catch(e => {
                  console.error('❌ Error playing local video:', e);
                  // Try to play again after a short delay
                  setTimeout(() => {
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(err => 
                        console.error('❌ Second attempt to play local video failed:', err)
                      );
                    }
                  }, 1000);
                });
            }
          };
          
          // Force immediate play attempt
          localVideoRef.current.play().catch(e => {
            console.log('⏳ Initial play failed, waiting for metadata...', e.message);
          });
        } else {
          console.error('❌ Local video element not found!');
        }

        console.log('✅ Camera and microphone access granted');

        // Connect to Socket.IO
        const newSocket = io('http://localhost:3001', {
          transports: ['websocket', 'polling']
        });

        currentSocket = newSocket;

        newSocket.on('connect', () => {
          console.log('✅ Connected to server with ID:', newSocket.id);
          newSocket.emit('join-room', { roomName, participantName });
        });

        newSocket.on('room-joined', (data) => {
          console.log('✅ Successfully joined room, participants:', data.participants.length);
          setParticipants(data.participants);
          setIsLoading(false);

          data.participants.forEach((participant: Participant) => {
            createPeerConnection(participant.id, true);
          });
        });

        newSocket.on('user-joined', (data) => {
          console.log('👤 New user joined:', data);
          setParticipants(prev => {
            const exists = prev.some(p => p.id === data.id);
            if (exists) {
              console.warn('⚠️ Participant already exists, not adding duplicate');
              return prev;
            }
            return [...prev, data];
          });
          createPeerConnection(data.id, false);
        });

        newSocket.on('user-left', (data) => {
          console.log('👋 User left:', data);
          setParticipants(prev => prev.filter(p => p.id !== data.id));
          
          if (peerConnectionsRef.current[data.id]) {
            peerConnectionsRef.current[data.id].pc.close();
            delete peerConnectionsRef.current[data.id];
          }
        });

        // WebRTC signaling events
        newSocket.on('webrtc-offer', async (data) => {
          await handleOffer(data.offer, data.sender);
        });

        newSocket.on('webrtc-answer', async (data) => {
          await handleAnswer(data.answer, data.sender);
        });

        newSocket.on('webrtc-ice-candidate', async (data) => {
          await handleIceCandidate(data.candidate, data.sender);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          setError('Failed to connect to server. Make sure the backend is running.');
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

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up room...');
      isConnecting = false;
      
      if (currentSocket) {
        currentSocket.emit('leave-room');
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
        console.log('✅ Socket cleaned up properly');
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnectionsRef.current).forEach(({ pc }) => pc.close());
      peerConnectionsRef.current = {};
    };
  }, [roomName, participantName]);

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(pcConfig);
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        peerConnectionsRef.current[peerId] = {
          ...peerConnectionsRef.current[peerId],
          remoteStream,
        };

        setTimeout(() => {
          const videoElement = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
          if (videoElement) {
            videoElement.srcObject = remoteStream;
            videoElement.onloadedmetadata = () => {
              videoElement.play().catch(e => console.error('Error playing remote video:', e));
            };
          }
        }, 100);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          target: peerId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionsRef.current[peerId] = { pc, remoteStream: null };

    if (isInitiator) {
      setTimeout(() => createOffer(peerId), 100);
    }
  };

  const createOffer = async (peerId: string) => {
    const peerConnection = peerConnectionsRef.current[peerId];
    if (!peerConnection || !socket) return;

    try {
      const offer = await peerConnection.pc.createOffer();
      await peerConnection.pc.setLocalDescription(offer);
      
      socket.emit('webrtc-offer', {
        target: peerId,
        offer: offer,
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection || !socket) return;

    try {
      await peerConnection.pc.setRemoteDescription(offer);
      const answer = await peerConnection.pc.createAnswer();
      await peerConnection.pc.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        target: senderId,
        answer: answer,
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection) return;

    try {
      await peerConnection.pc.setRemoteDescription(answer);
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit, senderId: string) => {
    const peerConnection = peerConnectionsRef.current[senderId];
    if (!peerConnection) return;

    try {
      await peerConnection.pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
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
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const newEnabled = !isCameraEnabled;
      videoTrack.enabled = newEnabled;
      setIsCameraEnabled(newEnabled);
      
      // Update all peer connections
      Object.values(peerConnectionsRef.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && sender.track) {
          sender.track.enabled = newEnabled;
        }
      });
      
      // Ensure local video element shows the change immediately
      if (localVideoRef.current) {
        if (newEnabled) {
          // Camera is now ON - make sure video is playing
          localVideoRef.current.play().catch(e => {
            console.warn('Could not restart local video:', e);
          });
        }
        console.log('📹 Local video visibility updated:', newEnabled ? 'visible' : 'hidden');
      }
      
      console.log('📹 Camera:', newEnabled ? 'enabled' : 'disabled');
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenShareEnabled) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peerConnectionsRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenShareEnabled(true);
        
        videoTrack.onended = () => {
          setIsScreenShareEnabled(false);
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peerConnectionsRef.current).forEach(({ pc }) => {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(cameraTrack);
              }
            });
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        };
      } catch (error) {
        console.error('❌ Error starting screen share:', error);
      }
    }
  };

  const handleLeaveRoom = () => {
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
        
        <div className="flex items-center space-x-3">
          {/* Meeting Info Button */}
          <button
            onClick={() => setShowMeetingInfo(!showMeetingInfo)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Meeting details & invite"
          >
            <InformationCircleIcon className="h-5 w-5 text-white" />
          </button>
          
          <div className="text-sm text-gray-400">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Meeting Info Panel */}
      {showMeetingInfo && (
        <div className="bg-video-dark border-b border-gray-700 p-4">
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Meeting Details & Invite</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Meeting Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Code</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-800 px-3 py-2 rounded text-white font-mono text-sm flex-1 border border-gray-600">
                    {roomName}
                  </code>
                  <button
                    onClick={copyRoomCode}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    title="Copy meeting code"
                  >
                    {linkCopied ? (
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-white" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    className="bg-gray-800 px-3 py-2 rounded text-white text-sm flex-1 border border-gray-600"
                  />
                  <button
                    onClick={copyMeetingLink}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    title="Copy meeting link"
                  >
                    {linkCopied ? (
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-white" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {linkCopied && (
              <p className="text-green-400 text-sm mt-2">✅ Copied to clipboard!</p>
            )}
            
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-600">
              <p className="text-blue-200 text-sm">
                <strong>💡 Share with others:</strong> Send the meeting code or link to invite participants to join this meeting.
              </p>
            </div>
          </div>
        </div>
      )}

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
              {participantName} (You) {isScreenShareEnabled && '🖥️'}
            </div>
            {!isCameraEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
                <VideoCameraSlashIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
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

          {/* Debug Button - Temporary */}
          <button
            onClick={debugVideoState}
            className="control-button"
            title="Debug video state"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            🐛
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom; 
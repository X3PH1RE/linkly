import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
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

interface RoomData {
  token: string;
  url: string;
  roomName: string;
  participantName: string;
}

const VideoRoom: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});

  const participantName = searchParams.get('participant') || 'Anonymous';

  useEffect(() => {
    const joinRoom = async () => {
      if (!roomName) {
        setError('Room name is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/rooms/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName,
            participantName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to join room: ${response.statusText}`);
        }

        const data = await response.json();
        setRoomData(data);
        
        // Initialize LiveKit room
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: {
              width: 1280,
              height: 720,
            },
          },
        });

        // Set up event listeners
        newRoom
          .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
          .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
          .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
          .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
          .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
          .on(RoomEvent.Disconnected, handleDisconnected);

        // Connect to room
        await newRoom.connect(data.url, data.token);
        console.log('Connected to room:', newRoom.name);

        // Enable camera and microphone
        await newRoom.localParticipant.enableCameraAndMicrophone();

        setRoom(newRoom);
        setParticipants([newRoom.localParticipant, ...Array.from(newRoom.participants.values())]);
      } catch (err) {
        console.error('Error joining room:', err);
        setError(err instanceof Error ? err.message : 'Failed to join room');
      } finally {
        setIsLoading(false);
      }
    };

    joinRoom();

    // Cleanup
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomName, participantName]);

  const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
    console.log('Track subscribed:', track.kind, participant.identity);
    
    if (track.kind === Track.Kind.Video) {
      const element = track.attach();
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      
      // Find the video container for this participant
      const videoContainer = document.getElementById(`participant-${participant.identity}`);
      if (videoContainer) {
        videoContainer.appendChild(element);
      }
    } else if (track.kind === Track.Kind.Audio) {
      const element = track.attach();
      document.body.appendChild(element);
    }
  };

  const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
    console.log('Track unsubscribed:', track.kind, participant.identity);
    track.detach();
  };

  const handleLocalTrackPublished = (publication: any, participant: any) => {
    console.log('Local track published:', publication.kind);
    
    if (publication.kind === Track.Kind.Video && localVideoRef.current) {
      const track = publication.track;
      if (track) {
        const element = track.attach();
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
        
        // Clear any existing video and add the new one
        localVideoRef.current.innerHTML = '';
        localVideoRef.current.appendChild(element);
      }
    }
  };

  const handleParticipantConnected = (participant: any) => {
    console.log('Participant connected:', participant.identity);
    setParticipants(prev => [...prev, participant]);
  };

  const handleParticipantDisconnected = (participant: any) => {
    console.log('Participant disconnected:', participant.identity);
    setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
  };

  const handleDisconnected = () => {
    console.log('Disconnected from room');
    handleLeaveRoom();
  };

  const handleLeaveRoom = async () => {
    if (roomData) {
      try {
        await fetch(`http://localhost:3001/api/rooms/${roomData.roomName}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantName: roomData.participantName,
          }),
        });
      } catch (err) {
        console.error('Error leaving room:', err);
      }
    }
    
    if (room) {
      room.disconnect();
    }
    
    navigate('/');
  };

  const toggleMicrophone = async () => {
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleCamera = async () => {
    if (room) {
      await room.localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (room) {
      await room.localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
      setIsScreenShareEnabled(!isScreenShareEnabled);
    }
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

  if (!roomData) {
    return null;
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
            <h1 className="text-lg font-semibold text-white">{roomData.roomName}</h1>
            <p className="text-sm text-gray-400">Participant: {participantName}</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local participant */}
          <div className="video-tile relative">
            <div 
              ref={localVideoRef}
              id="participant-local"
              className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center"
            >
              <div className="text-white text-lg">
                {participantName} (You)
              </div>
            </div>
            <div className="participant-info">
              {participantName} (You)
            </div>
          </div>

          {/* Remote participants */}
          {participants.slice(1).map((participant) => (
            <div key={participant.identity} className="video-tile relative">
              <div 
                id={`participant-${participant.identity}`}
                className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center"
              >
                <div className="text-white text-lg">
                  {participant.identity}
                </div>
              </div>
              <div className="participant-info">
                {participant.identity}
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon, UserGroupIcon, LinkIcon, ClipboardIcon } from '@heroicons/react/24/solid';

const HomePage: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const navigate = useNavigate();

  // Generate Google Meet-style room code (e.g., abc-defg-hij)
  const generateRoomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${part1}-${part2}-${part3}`;
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && participantName.trim()) {
      const params = new URLSearchParams({
        participant: participantName.trim()
      });
      navigate(`/room/${roomName.trim()}?${params.toString()}`);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && participantName.trim()) {
      const params = new URLSearchParams({
        participant: participantName.trim()
      });
      navigate(`/room/${roomCode.trim()}?${params.toString()}`);
    }
  };

  const handleNewMeeting = () => {
    if (!participantName.trim()) {
      alert('Please enter your name first');
      return;
    }
    
    const meetingCode = generateRoomCode();
    const params = new URLSearchParams({
      participant: participantName.trim()
    });
    navigate(`/room/${meetingCode}?${params.toString()}`);
  };

  const handleQuickJoin = () => {
    const quickRoomName = `room-${Math.random().toString(36).substr(2, 9)}`;
    const quickParticipantName = `user-${Math.random().toString(36).substr(2, 6)}`;
    const params = new URLSearchParams({
      participant: quickParticipantName
    });
    navigate(`/room/${quickRoomName}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-video-dark rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <VideoCameraIcon className="h-12 w-12 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-white">SmartMeet</h1>
          </div>
          <p className="text-gray-300">High-quality video calls with WebRTC</p>
        </div>

        {/* Participant Name - Always required */}
        <div className="mb-6">
          <label htmlFor="participantName" className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            id="participantName"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Meeting Options */}
        <div className="space-y-4">
          {/* New Meeting */}
          <button
            onClick={handleNewMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            New Meeting
          </button>

          {/* Join by Code Toggle */}
          <button
            onClick={() => setShowJoinByCode(!showJoinByCode)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <LinkIcon className="h-5 w-5 mr-2" />
            {showJoinByCode ? 'Hide Join Options' : 'Join with Code'}
          </button>

          {/* Join by Code Form */}
          {showJoinByCode && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Meeting Code
                  </label>
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="abc-defg-hij"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Join Meeting
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Legacy Options */}
        <div className="space-y-4">
          {/* Custom Room Name */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                Custom Room Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Join Custom Room
            </button>
          </form>

          {/* Quick Start */}
          <button
            onClick={handleQuickJoin}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            Quick Start (Random Room)
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>✨ HD Video Quality</div>
            <div>🎙️ Crystal Clear Audio</div>
            <div>🖥️ Screen Sharing</div>
            <div>👥 Multiple Participants</div>
            <div>🔗 Shareable Room Codes</div>
            <div>📱 Easy to Join</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
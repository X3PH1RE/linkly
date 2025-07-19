import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const HomePage: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && participantName.trim()) {
      const params = new URLSearchParams({
        participant: participantName.trim()
      });
      navigate(`/room/${roomName.trim()}?${params.toString()}`);
    }
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

        {/* Join Room Form */}
        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
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

          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
              Room Name
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Join Room
          </button>
        </form>

        {/* Quick Join */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <button
            onClick={handleQuickJoin}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
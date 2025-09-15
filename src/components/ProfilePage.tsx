import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Settings, Share, Grid3X3, Play, Heart, Users, Trophy } from 'lucide-react';
import { User, Video } from '../types';
import { supabase } from '../lib/supabase';
import { mockUsers, mockVideos } from '../data/mockData';
import VideoPlayer from './VideoPlayer';
import ProfileEditModal from './ProfileEditModal';
import FollowButton from './FollowButton';

interface ProfilePageProps {
  userId: string;
  currentUser?: User;
  onBack: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  onStartMessage?: (userId: string) => void;
}

export default function ProfilePage({ userId, currentUser, onBack, onUserUpdate, onStartMessage }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'battles'>('videos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProfile();
    loadUserVideos();
  }, [userId]);

  const loadProfile = async () => {
    if (!supabase) {
      // Use mock data when Supabase is not configured
      let mockUser = mockUsers.find(u => u.id === userId);
      
      // If it's the demo user, use the first mock user
      if (!mockUser && userId === '550e8400-e29b-41d4-a716-446655440000') {
        mockUser = mockUsers[0];
      }
      
      // If still no user found, use the first mock user
      if (!mockUser) {
        mockUser = mockUsers[0];
      }
      
      setUser(mockUser);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        // Fall back to mock data
        let mockUser = mockUsers.find(u => u.id === userId);
        if (!mockUser && userId === '550e8400-e29b-41d4-a716-446655440000') {
          mockUser = mockUsers[0];
        }
        if (!mockUser) {
          mockUser = mockUsers[0];
        }
        setUser(mockUser);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fall back to mock data
      let mockUser = mockUsers.find(u => u.id === userId);
      if (!mockUser && userId === '550e8400-e29b-41d4-a716-446655440000') {
        mockUser = mockUsers[0];
      }
      if (!mockUser) {
        mockUser = mockUsers[0];
      }
      setUser(mockUser);
    }
  };

  const loadUserVideos = async () => {
    if (!supabase) {
      // Use mock data when Supabase is not configured
      let userVideos = mockVideos.filter(v => v.user_id === userId);
      
      // If it's the demo user, show videos from the first mock user
      if (userVideos.length === 0 && userId === 'demo-user') {
        userVideos = mockVideos.filter(v => v.user_id === '1');
      }
      
      setVideos(userVideos);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading videos:', error);
        // Fall back to mock data
        let userVideos = mockVideos.filter(v => v.user_id === userId);
        if (userVideos.length === 0 && userId === 'demo-user') {
          userVideos = mockVideos.filter(v => v.user_id === '1');
        }
        setVideos(userVideos);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      // Fall back to mock data
      let userVideos = mockVideos.filter(v => v.user_id === userId);
      if (userVideos.length === 0 && userId === 'demo-user') {
        userVideos = mockVideos.filter(v => v.user_id === '1');
      }
      setVideos(userVideos);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    onUserUpdate?.(updatedUser);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        
        <span className="text-lg font-medium">@{user.username}</span>

        <div className="flex space-x-2">
          {isOwnProfile && (
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          )}
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Share size={20} />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 text-center">
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-purple-500"
        />
        
        <h1 className="text-2xl font-bold mb-2">@{user.username}</h1>
        
        {user.bio && (
          <p className="text-gray-300 mb-4 max-w-md mx-auto">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="text-center">
            <div className="text-xl font-bold">{user.videos_count}</div>
            <div className="text-gray-400 text-sm">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{user.followers_count}</div>
            <div className="text-gray-400 text-sm">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{user.following_count}</div>
            <div className="text-gray-400 text-sm">Following</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{user.battles_won}</div>
            <div className="text-gray-400 text-sm">Battles Won</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          {isOwnProfile ? (
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              <Edit size={16} className="inline mr-2" />
              Edit Profile
            </button>
          ) : (
            <>
              {currentUser && user && (
                <FollowButton 
                  currentUser={currentUser} 
                  targetUser={user}
                  onFollowChange={(isFollowing) => {
                    console.log('Follow status changed:', isFollowing);
                  }}
                />
              )}
              <button 
                onClick={() => onStartMessage?.(userId)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 ${
            activeTab === 'videos' ? 'border-b-2 border-white' : 'text-gray-400'
          }`}
        >
          <Grid3X3 size={16} />
          <span>Videos</span>
        </button>
        <button
          onClick={() => setActiveTab('battles')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 ${
            activeTab === 'battles' ? 'border-b-2 border-white' : 'text-gray-400'
          }`}
        >
          <Trophy size={16} />
          <span>Battles</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'videos' && (
          <div className="grid grid-cols-3 gap-1">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-[9/16] bg-gray-800 rounded cursor-pointer overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                <img
                  src={video.thumbnail_url || 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play size={24} className="text-white" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center space-x-1">
                      <Heart size={12} />
                      <span>{video.like_count}</span>
                    </div>
                    <span>{Math.floor(video.duration)}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'battles' && (
          <div className="text-center text-gray-400 py-8">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p>Battle history coming soon</p>
          </div>
        )}

        {videos.length === 0 && activeTab === 'videos' && (
          <div className="text-center text-gray-400 py-8">
            <Grid3X3 size={48} className="mx-auto mb-4 opacity-50" />
            <p>{isOwnProfile ? 'Upload your first video!' : 'No videos yet'}</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <ArrowLeft size={24} />
          </button>
          <VideoPlayer
            videoId={selectedVideo.cloudflare_video_id}
            className="w-full max-w-md h-screen"
            autoplay={true}
            muted={false}
          />
        </div>
      )}

      {/* Profile Edit Modal */}
      {showEditModal && user && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
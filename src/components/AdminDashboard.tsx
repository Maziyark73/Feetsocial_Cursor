import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flag, Users, Video, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Flag as FlagType, User, Video as VideoType } from '../types';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  onBack: () => void;
  currentUser?: User;
}

export default function AdminDashboard({ onBack, currentUser }: AdminDashboardProps) {
  const [flags, setFlags] = useState<FlagType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [activeTab, setActiveTab] = useState<'flags' | 'users' | 'videos'>('flags');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.is_admin) {
      loadAdminData();
    }
  }, [currentUser]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load flags
      const { data: flagsData } = await supabase
        .from('flags')
        .select('*')
        .order('created_at', { ascending: false });

      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Load flagged videos
      const { data: videosData } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(*)
        `)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      setFlags(flagsData || []);
      setUsers(usersData || []);
      setVideos(videosData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagAction = async (flagId: string, action: 'resolve' | 'dismiss') => {
    try {
      const { error } = await supabase
        .from('flags')
        .update({
          status: action === 'resolve' ? 'resolved' : 'reviewed',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(prev => prev.map(flag => 
        flag.id === flagId 
          ? { ...flag, status: action === 'resolve' ? 'resolved' : 'reviewed' }
          : flag
      ));
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

  const banUser = async (userId: string) => {
    try {
      // In a real app, you'd implement proper user banning
      // For now, we'll just mark their videos as flagged
      const { error } = await supabase
        .from('videos')
        .update({ is_flagged: true, is_public: false })
        .eq('user_id', userId);

      if (error) throw error;
      
      alert('User content has been flagged and hidden');
      loadAdminData();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const toggleVideoVisibility = async (videoId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_public: !isPublic })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, is_public: !isPublic }
          : video
      ));
    } catch (error) {
      console.error('Error updating video visibility:', error);
    }
  };

  if (!currentUser?.is_admin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">You don't have admin privileges.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
        
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        
        <div className="w-16" />
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
          <Flag className="mx-auto mb-2 text-red-400" size={24} />
          <div className="text-2xl font-bold">{flags.filter(f => f.status === 'pending').length}</div>
          <div className="text-sm text-gray-400">Pending Flags</div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <Users className="mx-auto mb-2 text-blue-400" size={24} />
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
          <Video className="mx-auto mb-2 text-yellow-400" size={24} />
          <div className="text-2xl font-bold">{videos.length}</div>
          <div className="text-sm text-gray-400">Flagged Videos</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('flags')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 ${
            activeTab === 'flags' ? 'border-b-2 border-red-500 text-red-400' : 'text-gray-400'
          }`}
        >
          <Flag size={16} />
          <span>Flags</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 ${
            activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'
          }`}
        >
          <Users size={16} />
          <span>Users</span>
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 ${
            activeTab === 'videos' ? 'border-b-2 border-yellow-500 text-yellow-400' : 'text-gray-400'
          }`}
        >
          <Video size={16} />
          <span>Videos</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'flags' && (
          <div className="space-y-4">
            {flags.filter(flag => flag.status === 'pending').map((flag) => (
              <div key={flag.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        flag.target_type === 'video' ? 'bg-red-900 text-red-300' :
                        flag.target_type === 'user' ? 'bg-blue-900 text-blue-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {flag.target_type}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{flag.reason}</h3>
                    {flag.description && (
                      <p className="text-gray-300 text-sm">{flag.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFlagAction(flag.id, 'resolve')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                    >
                      <CheckCircle size={14} />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => handleFlagAction(flag.id, 'dismiss')}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      <XCircle size={14} />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {flags.filter(flag => flag.status === 'pending').length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No pending flags</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.slice(0, 20).map((user) => (
              <div key={user.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-white">@{user.username}</h3>
                      <p className="text-sm text-gray-400">
                        {user.videos_count} videos • {user.followers_count} followers
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => banUser(user.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Flag Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start space-x-3">
                  <img
                    src={video.thumbnail_url || 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=150'}
                    alt={video.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{video.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">
                      by @{video.user?.username}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {video.view_count} views • {video.like_count} likes
                    </p>
                    
                    <button
                      onClick={() => toggleVideoVisibility(video.id, video.is_public)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        video.is_public
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {video.is_public ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {videos.length === 0 && (
              <div className="col-span-2 text-center text-gray-400 py-8">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No flagged videos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
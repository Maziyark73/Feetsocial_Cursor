import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User, Swords, Settings } from 'lucide-react';
import { User as UserType } from './types';
import { supabase } from './lib/supabase';
import FeetSocialLogo from './components/FeetSocialLogo';

// Components
import VideoFeed from './components/VideoFeed';
import UploadModal from './components/UploadModal';
import AuthPage from './components/AuthPage';
import BattlePage from './components/BattlePage';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import MessagesPage from './components/MessagesPage';

function App() {
  console.log('🚀 App component loaded - Version 1.2.3 with updated usernames!');
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'feed' | 'search' | 'messages' | 'profile' | 'admin'>('feed');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [selectedBattleId, setSelectedBattleId] = useState<string | undefined>();
  const [profileUserId, setProfileUserId] = useState<string>('');
  const [messageUserId, setMessageUserId] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Force demo mode to avoid authentication issues
    console.log('🎭 Forcing demo mode - bypassing all authentication');
    setLoading(false);
    setUser(null); // Always show auth page
    return;
    
    // Check if Supabase is configured
    if (!supabase) {
      console.log('Supabase not configured. Running in demo mode.');
      setLoading(false);
      setUser(null); // Show auth page
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (!supabase) {
      console.log('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User profile doesn't exist, create it
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authUser.user.id,
              username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'User',
              avatar_url: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150',
              bio: '',
            })
            .select()
            .single();

          if (createError) throw createError;
          setUser(newUser);
        }
      } else if (error) {
        console.error('Error loading user profile:', error);
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentView('feed');
  };

  const handleUploadSuccess = () => {
    // Trigger refresh of the video feed
    setRefreshTrigger(prev => prev + 1);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'feed':
        return (
          <VideoFeed 
            userId={user?.id}
            currentUser={user}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'search':
        return (
          <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="text-center">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">Search</h2>
              <p className="text-gray-400">Coming soon</p>
            </div>
          </div>
        );
      case 'messages':
        return (
          <MessagesPage
            currentUser={user}
            onBack={() => setCurrentView('feed')}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            userId={profileUserId || user?.id || ''}
            currentUser={user}
            onBack={() => setCurrentView('feed')}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
            onStartMessage={(userId) => {
              setMessageUserId(userId);
              setCurrentView('messages');
            }}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            onBack={() => setCurrentView('feed')}
            currentUser={user}
          />
        );
      default:
        return <VideoFeed userId={user?.id} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Feet Social...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={() => {
      // Create a mock user for demo mode with proper UUID
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID for demo user
        username: 'alex_johnson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        bio: 'Content creator and tech enthusiast 🚀',
        followers_count: 150,
        following_count: 25,
        videos_count: 12,
        battles_won: 3,
        battles_lost: 1,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(mockUser);
    }} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <div className="pb-20">
        {renderCurrentView()}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        user={user}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Battle Modal */}
      {showBattleModal && selectedBattleId && (
        <div className="fixed inset-0 bg-black z-50">
          <BattlePage
            battleId={selectedBattleId}
            onBack={() => {
              setShowBattleModal(false);
              setSelectedBattleId(undefined);
            }}
            userId={user?.id}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-800">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setCurrentView('feed')}
            className={`flex flex-col items-center p-2 ${
              currentView === 'feed' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          <button
            onClick={() => setCurrentView('search')}
            className={`flex flex-col items-center p-2 ${
              currentView === 'search' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <Search size={24} />
            <span className="text-xs mt-1">Search</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center p-2"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-2">
              <Plus size={24} className="text-white" />
            </div>
            <span className="text-xs mt-1 text-gray-400">Upload</span>
          </button>

          <button
            onClick={() => setCurrentView('messages')}
            className={`flex flex-col items-center p-2 ${
              currentView === 'messages' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Messages</span>
          </button>

          <button
            onClick={() => {
              setProfileUserId(user.id);
              setCurrentView('profile');
            }}
            className={`flex flex-col items-center p-2 ${
              currentView === 'profile' ? 'text-white' : 'text-gray-400'
            }`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* Top Navigation (when not on feed) */}
      {currentView !== 'feed' && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-40 border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex items-center space-x-2">
                <FeetSocialLogo size={24} color="white" />
                <h1 className="text-lg font-bold">Feet Social</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {user.is_admin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`p-2 rounded-full transition-colors ${
                    currentView === 'admin' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Admin Dashboard"
                >
                  <Settings size={20} />
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
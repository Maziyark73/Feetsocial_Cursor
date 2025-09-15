import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, TrendingUp } from 'lucide-react';
import { Battle, Vote } from '../types';
import { mockBattles } from '../data/mockData';
import { supabase } from '../lib/supabase';
import VideoPlayer from './VideoPlayer';

interface BattlePageProps {
  battleId?: string;
  onBack: () => void;
  userId?: string;
}

export default function BattlePage({ battleId, onBack, userId }: BattlePageProps) {
  const [battles, setBattles] = useState<Battle[]>(mockBattles);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (battleId) {
      loadBattle(battleId);
    } else {
      loadActiveBattles();
    }
  }, [battleId]);

  useEffect(() => {
    if (currentBattle && userId) {
      checkUserVote();
    }
  }, [currentBattle, userId]);

  useEffect(() => {
    if (currentBattle) {
      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [currentBattle]);

  const loadBattle = async (id: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        setCurrentBattle(battles.find(b => b.id === id) || battles[0]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          video1:videos!battles_video1_id_fkey(*,user:users(*)),
          video2:videos!battles_video2_id_fkey(*,user:users(*)),
          creator:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading battle:', error);
        setCurrentBattle(battles.find(b => b.id === id) || battles[0]);
        return;
      }

      if (data) {
        setCurrentBattle(data);
      }
    } catch (error) {
      console.error('Error loading battle:', error);
      setCurrentBattle(battles[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBattles = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        setCurrentBattle(battles[0]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          video1:videos!battles_video1_id_fkey(*,user:users(*)),
          video2:videos!battles_video2_id_fkey(*,user:users(*)),
          creator:users(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading battles:', error);
        setCurrentBattle(battles[0]);
        return;
      }

      if (data && data.length > 0) {
        setBattles(data);
        setCurrentBattle(data[0]);
      } else {
        setCurrentBattle(battles[0]);
      }
    } catch (error) {
      console.error('Error loading battles:', error);
      setCurrentBattle(battles[0]);
    } finally {
      setLoading(false);
    }
  };

  const checkUserVote = async () => {
    if (!currentBattle || !userId) return;

    try {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('battle_id', currentBattle.id)
        .eq('user_id', userId)
        .single();

      setUserVote(data);
    } catch (error) {
      console.log('No existing vote found');
      setUserVote(null);
    }
  };

  const handleVote = async (videoId: string) => {
    if (!currentBattle || !userId || userVote) return;

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          battle_id: currentBattle.id,
          user_id: userId,
          video_id: videoId,
        });

      if (error) throw error;

      // Update battle counts
      const isVideo1 = videoId === currentBattle.video1_id;
      const updatedBattle = {
        ...currentBattle,
        votes1_count: isVideo1 ? currentBattle.votes1_count + 1 : currentBattle.votes1_count,
        votes2_count: !isVideo1 ? currentBattle.votes2_count + 1 : currentBattle.votes2_count,
        total_votes: currentBattle.total_votes + 1,
      };

      setCurrentBattle(updatedBattle);
      setUserVote({
        id: '',
        battle_id: currentBattle.id,
        user_id: userId,
        video_id: videoId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const updateTimeLeft = () => {
    if (!currentBattle) return;

    const now = new Date().getTime();
    const endTime = new Date(currentBattle.end_time).getTime();
    const timeRemaining = endTime - now;

    if (timeRemaining <= 0) {
      setTimeLeft('Ended');
    } else {
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    }
  };

  const getVotePercentage = (isVideo1: boolean): number => {
    if (!currentBattle || currentBattle.total_votes === 0) return 50;
    
    const votes = isVideo1 ? currentBattle.votes1_count : currentBattle.votes2_count;
    return Math.round((votes / currentBattle.total_votes) * 100);
  };

  if (loading && !currentBattle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading battle...</p>
        </div>
      </div>
    );
  }

  if (!currentBattle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No battles available</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const video1Percentage = getVotePercentage(true);
  const video2Percentage = getVotePercentage(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold">{currentBattle.title}</h1>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <Users size={16} />
              <span>{currentBattle.total_votes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>{timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Video 1 */}
        <div className="flex-1 relative">
          <VideoPlayer
            videoId={currentBattle.video1?.cloudflare_video_id || 'demo-video-1'}
            className="w-full h-96 md:h-screen"
            autoplay={false}
            muted={true}
          />
          
          {/* Vote Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            {/* Vote Button */}
            {!userVote && userId && (
              <button
                onClick={() => handleVote(currentBattle.video1_id)}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-colors"
              >
                Vote for this
              </button>
            )}

            {/* Results */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">@{currentBattle.video1?.user?.username}</span>
                  <span className="text-lg font-bold">{video1Percentage}%</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${video1Percentage}%` }}
                  />
                </div>
                
                <p className="text-sm mt-2 text-gray-300">
                  {currentBattle.video1?.description}
                </p>

                {userVote?.video_id === currentBattle.video1_id && (
                  <div className="mt-2 text-green-400 text-sm font-medium">
                    ✓ Your vote
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center bg-black/80 p-4 md:w-16 md:flex-col">
          <div className="text-2xl font-bold text-purple-400 transform md:rotate-90">
            VS
          </div>
        </div>

        {/* Video 2 */}
        <div className="flex-1 relative">
          <VideoPlayer
            videoId={currentBattle.video2?.cloudflare_video_id || 'demo-video-2'}
            className="w-full h-96 md:h-screen"
            autoplay={false}
            muted={true}
          />
          
          {/* Vote Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            {/* Vote Button */}
            {!userVote && userId && (
              <button
                onClick={() => handleVote(currentBattle.video2_id)}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full transition-colors"
              >
                Vote for this
              </button>
            )}

            {/* Results */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">@{currentBattle.video2?.user?.username}</span>
                  <span className="text-lg font-bold">{video2Percentage}%</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${video2Percentage}%` }}
                  />
                </div>
                
                <p className="text-sm mt-2 text-gray-300">
                  {currentBattle.video2?.description}
                </p>

                {userVote?.video_id === currentBattle.video2_id && (
                  <div className="mt-2 text-green-400 text-sm font-medium">
                    ✓ Your vote
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      {currentBattle.description && (
        <div className="p-4 bg-black/80">
          <p className="text-center text-gray-300">{currentBattle.description}</p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface FollowButtonProps {
  currentUser: User;
  targetUser: User;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ currentUser, targetUser, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show follow button for own profile
  if (currentUser.id === targetUser.id) {
    return null;
  }

  useEffect(() => {
    checkFollowStatus();
  }, [currentUser.id, targetUser.id]);

  const checkFollowStatus = async () => {
    if (!supabase) {
      // Demo mode - simulate some follows
      const demoFollows = ['user2', 'user3']; // Demo users we're following
      setIsFollowing(demoFollows.includes(targetUser.id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
      } else {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        if (!supabase) {
          // Demo mode
          console.log('🎭 Demo: Unfollowing user', targetUser.username);
          setIsFollowing(false);
          onFollowChange?.(false);
        } else {
          const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUser.id);

          if (error) {
            console.error('Error unfollowing user:', error);
            alert('Failed to unfollow user');
            return;
          }

          setIsFollowing(false);
          onFollowChange?.(false);
        }
      } else {
        // Follow
        if (!supabase) {
          // Demo mode
          console.log('🎭 Demo: Following user', targetUser.username);
          setIsFollowing(true);
          onFollowChange?.(true);
        } else {
          const { error } = await supabase
            .from('follows')
            .insert({
              follower_id: currentUser.id,
              following_id: targetUser.id,
            });

          if (error) {
            console.error('Error following user:', error);
            alert('Failed to follow user');
            return;
          }

          setIsFollowing(true);
          onFollowChange?.(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all
        ${isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={16} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Follow
        </>
      )}
    </button>
  );
}

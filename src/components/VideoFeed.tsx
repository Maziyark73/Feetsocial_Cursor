import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Heart, MessageCircle, Share, Music, MoreHorizontal, Swords } from 'lucide-react';
import { Video, User } from '../types';
import { mockVideos } from '../data/mockData';
import { supabase } from '../lib/supabase';
import VideoPlayer from './VideoPlayer';
import CommentsModal from './CommentsModal';
import FollowButton from './FollowButton';

interface VideoFeedProps {
  userId?: string;
  currentUser?: User;
  refreshTrigger?: number; // Add this to trigger refresh
}

export default function VideoFeed({ userId, currentUser, refreshTrigger }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.7,
  });

  useEffect(() => {
    loadVideos();
  }, []);

  // Refresh videos when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadVideos();
    }
  }, [refreshTrigger]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.log('Supabase not configured. Using mock data.');
        console.log('📱 Mock videos loaded:', mockVideos.map(v => ({ id: v.id, title: v.title, username: v.user?.username })));
        setVideos(mockVideos);
        setLoading(false);
        return;
      }

      // Load videos, posts, and live streams
      const [videosResult, postsResult, liveStreamsResult] = await Promise.all([
        supabase
          .from('videos')
          .select(`
            *,
            user:users(*)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('posts')
          .select(`
            *,
            user:users(*)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('live_streams')
          .select(`
            *,
            user:users(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (videosResult.error) {
        console.error('Error loading videos:', videosResult.error);
      }
      if (postsResult.error) {
        console.error('Error loading posts:', postsResult.error);
      }
      if (liveStreamsResult.error) {
        console.error('Error loading live streams:', liveStreamsResult.error);
      }

      // Combine videos and posts, convert posts to video format for display
      const allContent = [];
      
      if (videosResult.data) {
        console.log('🎬 Videos loaded from database:', videosResult.data);
        // Debug: Log each video to see what we're getting
        videosResult.data.forEach((video, index) => {
          console.log(`🎬 Video ${index + 1}:`, {
            id: video.id,
            title: video.title,
            cloudflare_video_id: video.cloudflare_video_id,
            thumbnail_url: video.thumbnail_url,
            video_file_path: video.video_file_path,
            isRealVideo: video.cloudflare_video_id?.startsWith('http'),
            fullVideoObject: video
          });
        });
        allContent.push(...videosResult.data);
      }
      
      if (postsResult.data) {
        console.log('📸 Posts loaded from database:', postsResult.data);
        // Convert posts to video format for display
        const postsAsVideos = postsResult.data.map(post => {
          console.log('📸 Processing post:', {
            id: post.id,
            caption: post.caption,
            image_url: post.image_url,
            user: post.user
          });
          return {
            id: post.id,
            title: post.caption || 'Image Post',
            description: post.caption || '',
            cloudflare_video_id: `post-${post.id}`,
            thumbnail_url: post.image_url,
            user_id: post.user_id,
            user: post.user,
            view_count: 0,
            like_count: post.like_count || 0,
            comment_count: post.comment_count || 0,
            share_count: post.share_count || 0,
            duration: 0, // Posts don't have duration
            is_public: post.is_public,
            is_flagged: false,
            hashtags: post.hashtags || [],
            battle_id: null,
            created_at: post.created_at,
            updated_at: post.updated_at,
            is_post: true // Flag to identify posts
          };
        });
        allContent.push(...postsAsVideos);
      }

      if (liveStreamsResult.data) {
        console.log('🔴 Live streams loaded from database:', liveStreamsResult.data);
        // Convert live streams to video format for display
        const liveStreamsAsVideos = liveStreamsResult.data.map(stream => {
          console.log('🔴 Processing live stream:', {
            id: stream.id,
            title: stream.title,
            user: stream.user
          });
          return {
            id: stream.id,
            title: stream.title,
            description: stream.description || '',
            cloudflare_video_id: `live-${stream.id}`,
            thumbnail_url: `https://picsum.photos/400/600?random=live-${stream.id}`,
            user_id: stream.user_id,
            user: stream.user,
            view_count: stream.viewer_count || 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            duration: 0, // Live streams don't have duration
            is_public: true,
            is_flagged: false,
            hashtags: [],
            battle_id: null,
            created_at: stream.created_at,
            updated_at: stream.updated_at,
            is_live: true, // Flag to identify live streams
            playback_url: stream.playback_url,
            rtmp_url: stream.rtmp_url,
            stream_key: stream.stream_key
          };
        });
        allContent.push(...liveStreamsAsVideos);
      }

      // Sort by created_at and take the most recent
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const recentContent = allContent.slice(0, 20);

      if (recentContent.length > 0) {
        console.log('Loaded content from database:', recentContent.length);
        console.log('🎬 Final content being set to videos state:', recentContent);
        setVideos(recentContent);
      } else {
        // If no content in database, use mock data
        console.log('No content found in database, using mock data');
        setVideos(mockVideos);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setVideos(mockVideos);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    if (!userId || !supabase) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error unliking video:', error);
          return;
        }
        
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, like_count: Math.max(0, video.like_count - 1) }
            : video
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ video_id: videoId, user_id: userId });

        if (error) {
          console.error('Error liking video:', error);
          return;
        }
        
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, like_count: video.like_count + 1 }
            : video
        ));
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleShare = async (video: Video) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
    
    // Update share count
    setVideos(prev => prev.map(v => 
      v.id === video.id 
        ? { ...v, share_count: v.share_count + 1 }
        : v
    ));
  };

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const handleCommentClick = (video: Video) => {
    setSelectedVideo(video);
    setShowComments(true);
  };

  const handleCommentUpdate = (videoId: string, newCount: number) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, comment_count: newCount }
        : video
    ));
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          ref={index === currentVideoIndex ? inViewRef : undefined}
          className="relative h-screen w-full snap-start bg-black flex items-center justify-center"
        >
          {/* Video Player, Image Display, or Live Stream */}
          {video.is_post ? (
            // Display image for posts
            <div className="w-full h-full flex items-center justify-center bg-black">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', video.thumbnail_url);
                }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', video.thumbnail_url);
                  console.error('Video data:', video);
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Debug info overlay */}
              <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
                <div>Post ID: {video.id}</div>
                <div>Image URL: {video.thumbnail_url ? 'Present' : 'Missing'}</div>
                <div>Is Post: {video.is_post ? 'Yes' : 'No'}</div>
              </div>
            </div>
          ) : video.is_live ? (
            // Display live stream
            <div className="w-full h-full flex items-center justify-center bg-black relative">
              <div className="w-full h-full bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🔴</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{video.title}</h3>
                  <p className="text-gray-300 mb-4">{video.description}</p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <span>👥 {video.view_count} viewers</span>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span>LIVE</span>
                  </div>
                </div>
              </div>
              {/* Live indicator */}
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🔴 LIVE
              </div>
              {/* Debug info overlay */}
              <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
                <div>Live ID: {video.id}</div>
                <div>Is Live: {video.is_live ? 'Yes' : 'No'}</div>
                <div>Viewers: {video.view_count}</div>
              </div>
            </div>
          ) : (
            // Display video player for videos
            <VideoPlayer
              video={video}
              className="w-full h-full"
              autoplay={index === currentVideoIndex}
              muted={false}
              controls={true}
            />
          )}

          {/* Video Info Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            {/* Right Action Bar */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
              {/* Profile Avatar */}
              <div className="relative">
                <img
                  src={video.user?.avatar_url}
                  alt={video.user?.username}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              </div>

              {/* Battle Indicator */}

              {/* Like Button */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
              >
                <Heart
                  size={28}
                  className="fill-current text-white hover:text-red-500"
                />
                <span className="text-xs font-medium">
                  {formatCount(video.like_count)}
                </span>
              </button>

              {/* Comment Button */}
              <button 
                onClick={() => handleCommentClick(video)}
                className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
              >
                <MessageCircle size={28} />
                <span className="text-xs font-medium">
                  {formatCount(video.comment_count)}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => handleShare(video)}
                className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
              >
                <Share size={28} />
                <span className="text-xs font-medium">
                  {formatCount(video.share_count)}
                </span>
              </button>

              {/* More Options */}
              <button className="text-white hover:scale-110 transition-transform">
                <MoreHorizontal size={28} />
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-4 left-4 right-20 text-white">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">@{video.user?.username}</span>
                  {currentUser && video.user && currentUser.id !== video.user.id && (
                    <FollowButton 
                      currentUser={currentUser} 
                      targetUser={video.user}
                      onFollowChange={(isFollowing) => {
                        console.log('Follow status changed in feed:', isFollowing);
                      }}
                    />
                  )}
                </div>
                
                <p className="text-sm leading-relaxed">
                  {video.description}
                </p>

                {video.hashtags && video.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.hashtags.map((hashtag, idx) => (
                      <span key={idx} className="text-sm text-blue-300">
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sound Info */}
                {video.sound && (
                  <div className="flex items-center space-x-2 bg-black/30 rounded-full px-3 py-1 w-fit">
                    <Music size={14} />
                    <span className="text-xs truncate max-w-40">
                      {video.sound.title} - {video.sound.artist}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Thumbnail (fallback) */}
          {video.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover -z-10"
            />
          )}
        </div>
      ))}

      {loading && (
        <div className="h-screen flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading videos...</p>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {selectedVideo && currentUser && (
        <CommentsModal
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedVideo(null);
          }}
          video={selectedVideo}
          currentUser={currentUser}
          onCommentUpdate={handleCommentUpdate}
        />
      )}
    </div>
  );
}
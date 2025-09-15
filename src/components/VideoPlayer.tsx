import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { getCloudflareVideoEmbedUrl } from '../lib/cloudflare';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function VideoPlayer({
  video,
  className = '',
  autoplay = false,
  muted = false,
  controls = true,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);

  const embedUrl = getCloudflareVideoEmbedUrl(video.cloudflare_video_id);

  useEffect(() => {
    const video = videoRef.current;
    const iframe = iframeRef.current;

    if (video) {
      // Handle video element
      video.autoplay = autoplay;
      video.muted = muted;
      video.controls = controls;
    } else if (iframe && embedUrl) {
      // Handle iframe (Cloudflare Stream)
      const url = new URL(embedUrl);
      if (autoplay) url.searchParams.set('autoplay', 'true');
      if (muted) url.searchParams.set('muted', 'true');
      url.searchParams.set('loop', 'true');
      url.searchParams.set('controls', controls ? 'true' : 'false');
      
      iframe.src = url.toString();
    }
  }, [video.cloudflare_video_id, embedUrl, autoplay, muted, controls]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    const iframe = iframeRef.current;

    if (video) {
      // Handle video element
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        video.play();
        setIsPlaying(true);
        onPlay?.();
      }
    } else if (iframe && iframe.contentWindow) {
      // Handle iframe (Cloudflare Stream)
      if (isPlaying) {
        iframe.contentWindow.postMessage('{"event":"pause"}', '*');
        setIsPlaying(false);
        onPause?.();
      } else {
        iframe.contentWindow.postMessage('{"event":"play"}', '*');
        setIsPlaying(true);
        onPlay?.();
      }
    }
  };

  const handleMute = () => {
    const video = videoRef.current;
    const iframe = iframeRef.current;

    if (video) {
      // Handle video element
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    } else if (iframe && iframe.contentWindow) {
      // Handle iframe (Cloudflare Stream)
      if (isMuted) {
        iframe.contentWindow.postMessage('{"event":"unmute"}', '*');
        setIsMuted(false);
      } else {
        iframe.contentWindow.postMessage('{"event":"mute"}', '*');
        setIsMuted(true);
      }
    }
  };

  // Check if we have a real video URL (Supabase Storage)
  const videoUrl = video.cloudflare_video_id?.startsWith('http') ? video.cloudflare_video_id : null;
  
  console.log('🎬 URL validation:', {
    cloudflare_video_id: video.cloudflare_video_id,
    startsWithHttp: video.cloudflare_video_id?.startsWith('http'),
    videoUrl: videoUrl,
    isRealVideo: video.cloudflare_video_id?.startsWith('http')
  });
  
  console.log('🎬 VideoPlayer received video:', {
    id: video.id,
    title: video.title,
    cloudflare_video_id: video.cloudflare_video_id,
    video_file_path: video.video_file_path,
    thumbnail_url: video.thumbnail_url,
    isRealVideo: video.cloudflare_video_id?.startsWith('http'),
    videoUrl: videoUrl
  });
  
  if (!videoUrl) {
    console.log('🎬 VideoPlayer: No video URL, showing demo video UI', { video });
    return (
      <div className={`bg-gray-900 flex items-center justify-center relative ${className}`}>
        {video.thumbnail_url && (
          <img 
            src={video.thumbnail_url} 
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => console.log('✅ Thumbnail loaded:', video.thumbnail_url)}
            onError={() => console.log('❌ Thumbnail failed to load:', video.thumbnail_url)}
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Play size={32} className="text-white" />
            </div>
            <p className="text-white text-lg font-medium">🎬 Demo Video</p>
            <p className="text-sm text-gray-200">
              Video uploaded successfully!
            </p>
            <p className="text-xs text-gray-300 mt-2">
              (Demo mode - Cloudflare Stream not configured)
            </p>
            <p className="text-xs text-yellow-300 mt-1">
              Version 1.0.3 - Real video upload!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use the real video URL instead of embedUrl
  const finalVideoUrl = videoUrl;

  const handleVideoClick = () => {
    if (videoRef.current) {
      console.log('🎬 Video clicked, checking mute status:', videoRef.current.muted);
      if (videoRef.current.muted) {
        console.log('🎬 Unmuting video on click');
        videoRef.current.muted = false;
      }
      if (videoRef.current.paused) {
        console.log('🎬 Playing video on click');
        videoRef.current.play();
      }
    }
  };

  return (
    <div 
      className={`relative bg-black ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={finalVideoUrl}
        autoPlay={autoplay}
        muted={false}
        loop
        playsInline
        controls={true}
        preload="metadata"
        onPlay={() => {
          console.log('🎬 Video started playing');
          setIsPlaying(true);
        }}
        onPause={() => {
          console.log('🎬 Video paused');
          setIsPlaying(false);
        }}
        onLoadedMetadata={() => {
          console.log('🎬 Video metadata loaded:', {
            duration: videoRef.current?.duration,
            muted: videoRef.current?.muted,
            volume: videoRef.current?.volume,
            src: videoRef.current?.src,
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState
          });
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            // Force unmute
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            console.log('🎬 Set video to unmuted, volume 1.0');
          }
        }}
        onError={(e) => {
          console.error('🎬 Video error:', e);
          console.error('🎬 Video error details:', {
            error: videoRef.current?.error,
            networkState: videoRef.current?.networkState,
            readyState: videoRef.current?.readyState,
            src: videoRef.current?.src
          });
        }}
        onCanPlay={() => {
          console.log('🎬 Video can play');
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            console.log('🎬 Video ready - unmuted, volume 1.0');
          }
        }}
        onVolumeChange={() => {
          console.log('🎬 Volume changed:', {
            muted: videoRef.current?.muted,
            volume: videoRef.current?.volume
          });
        }}
      />
      
      {/* Native HTML5 controls are enabled, no custom overlay needed */}
    </div>
  );
}
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Camera, Video, Radio, Zap, Swords, Mic, Settings, RotateCcw, Square, Play } from 'lucide-react';
import { uploadVideoToCloudflare } from '../lib/cloudflare';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onUploadSuccess?: () => void;
}

export default function UploadModal({ isOpen, onClose, user, onUploadSuccess }: UploadModalProps) {
  const [uploadMode, setUploadMode] = useState<'post' | 'video' | 'live'>('post');
  
  // Post mode states
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  
  // Video mode states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoHashtags, setVideoHashtags] = useState('');
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Live mode states
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveCategory, setLiveCategory] = useState('general');
  const [isBattle, setIsBattle] = useState(false);
  const [battleTitle, setBattleTitle] = useState('');
  const [battleDescription, setBattleDescription] = useState('');
  const [invitedUser, setInvitedUser] = useState('');
  const [invitedUserId, setInvitedUserId] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserSearch) {
        setShowUserSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserSearch]);

  // Camera functionality - all useCallback hooks must be at the top level
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const constraints = {
        video: {
          facingMode: cameraFacing === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  }, []);

  const switchCamera = useCallback(() => {
    setCameraFacing(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      setVideoFile(file);
      if (!videoTitle) {
        setVideoTitle(`Recording ${new Date().toLocaleTimeString()}`);
      }
      setShowCamera(false);
      stopCamera();
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    // Start recording timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, [recordedChunks, videoTitle, stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // User search functionality
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (!supabase) {
      // Demo mode - filter mock users
      const mockUsers = [
        { id: '1', username: 'alex_dancer', display_name: 'Alex Dancer', follower_count: 1200, avatar_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '2', username: 'sarah_music', display_name: 'Sarah Music', follower_count: 800, avatar_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '3', username: 'mike_creator', display_name: 'Mike Creator', follower_count: 300, avatar_url: 'https://images.pexels.com/photos/1040882/pexels-photo-1040882.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '4', username: 'lisa_artist', display_name: 'Lisa Artist', follower_count: 1500, avatar_url: 'https://images.pexels.com/photos/1040883/pexels-photo-1040883.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '5', username: 'john_performer', display_name: 'John Performer', follower_count: 600, avatar_url: 'https://images.pexels.com/photos/1040884/pexels-photo-1040884.jpeg?auto=compress&cs=tinysrgb&w=400' },
      ];
      
      const filtered = mockUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.display_name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, follower_count, avatar_url')
        .ilike('username', `%${query}%`)
        .gte('follower_count', 500) // Only show users with 500+ followers
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const selectUser = (user: User) => {
    setInvitedUser(user.username);
    setInvitedUserId(user.id);
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearInvitation = () => {
    setInvitedUser('');
    setInvitedUserId('');
  };

  // Check if current user has 500+ followers
  const canCreateBattle = user && user.follower_count >= 500;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (uploadMode === 'post' && selectedFile.type.startsWith('image/')) {
      setPostImage(selectedFile);
    } else if (uploadMode === 'video' && selectedFile.type.startsWith('video/')) {
      setVideoFile(selectedFile);
      if (!videoTitle) {
        setVideoTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      if (uploadMode === 'post') {
        await handlePostUpload();
      } else if (uploadMode === 'video') {
        await handleVideoUpload();
      } else if (uploadMode === 'live') {
        await handleLiveUpload();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePostUpload = async () => {
    if (!postImage) {
      alert('Please select an image');
      return;
    }

    if (!user) {
      alert('Please log in to upload posts');
      return;
    }

    setUploadProgress(50);
    
    // Demo mode - simulate post upload
    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(100);
      alert('Post uploaded successfully! (Demo mode)');
      resetForm();
      onClose();
      onUploadSuccess?.();
      return;
    }

    try {
      // Convert image to data URL for simple storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageDataUrl = e.target?.result as string;
          
          setUploadProgress(70);

          // Parse hashtags
          const parsedHashtags = postHashtags
            .split(/[,\s]+/)
            .filter(tag => tag.trim())
            .map(tag => tag.replace('#', '').trim());

          // Save post to database with data URL
          const { data: postData, error: postError } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              caption: postCaption,
              image_url: imageDataUrl,
              hashtags: parsedHashtags,
              is_public: true,
            })
            .select()
            .single();

          if (postError) {
            throw new Error(`Failed to save post: ${postError.message}`);
          }

          setUploadProgress(100);
          alert('Post uploaded successfully!');
          resetForm();
          onClose();
          onUploadSuccess?.();
        } catch (error) {
          console.error('Error uploading post:', error);
          alert(`Error uploading post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsDataURL(postImage);
    } catch (error) {
      console.error('Error uploading post:', error);
      alert(`Error uploading post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      alert('Please select a video');
      return;
    }

    const parsedHashtags = videoHashtags
      .split(/[,\s]+/)
      .filter(tag => tag.trim())
      .map(tag => tag.replace('#', '').trim());

    setUploadProgress(10);

    if (!supabase) {
      // Demo mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(100);
      alert('Video uploaded successfully! (Demo mode)');
      resetForm();
      onClose();
      onUploadSuccess?.();
      return;
    }

    // Generate unique file names
    const videoFileName = `${user.id}/${Date.now()}-${videoFile.name}`;
    const thumbnailFileName = `${user.id}/${Date.now()}-thumbnail.jpg`;

    setUploadProgress(20);

    // Upload video file to Supabase Storage
    const { data: videoUploadData, error: videoUploadError } = await supabase.storage
      .from('videos')
      .upload(videoFileName, videoFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (videoUploadError) {
      throw new Error(`Failed to upload video: ${videoUploadError.message}`);
    }

    setUploadProgress(50);

    // Generate thumbnail (for now, use a placeholder)
    const thumbnailUrl = `https://picsum.photos/400/600?random=${Date.now()}`;

    // Upload thumbnail to Supabase Storage
    const thumbnailResponse = await fetch(thumbnailUrl);
    const thumbnailBlob = await thumbnailResponse.blob();
    
    const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
      .from('video-thumbnails')
      .upload(thumbnailFileName, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (thumbnailUploadError) {
      console.warn('Failed to upload thumbnail:', thumbnailUploadError.message);
    }

    setUploadProgress(70);

    // Get public URLs
    const { data: videoUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(videoFileName);

    const { data: thumbnailUrlData } = supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(thumbnailFileName);

    setUploadProgress(80);

    // Save video metadata to Supabase
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .insert({
        title: videoTitle,
        description: videoDescription,
        cloudflare_video_id: videoUrlData.publicUrl, // Store the public URL
        video_file_path: videoFileName,
        thumbnail_url: thumbnailUrlData.publicUrl,
        thumbnail_file_path: thumbnailFileName,
        user_id: user.id,
        hashtags: parsedHashtags,
        is_public: true,
        duration: Math.floor(Math.random() * 60) + 10, // TODO: Get real duration
      })
      .select()
      .single();

    if (videoError) {
      throw new Error(`Failed to save video metadata: ${videoError.message}`);
    }

    setUploadProgress(70);

    // If battle mode, create battle
    if (isBattle && videoData) {
      const { error: battleError } = await supabase
        .from('battles')
        .insert({
          title: battleTitle || `${videoTitle} Battle`,
          description: battleDescription,
          video1_id: videoData.id,
          video2_id: videoData.id,
          creator_id: user.id,
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (battleError) {
        console.error('Failed to create battle:', battleError);
      }
    }

    setUploadProgress(100);
    console.log('🎬 Video upload completed successfully!', { videoData });
    alert('Video uploaded successfully!');
    resetForm();
    onClose();
    onUploadSuccess?.();
  };

  const handleLiveUpload = async () => {
    if (!liveTitle.trim()) {
      alert('Please enter a live stream title');
      return;
    }

    if (!user) {
      alert('Please log in to start a live stream');
      return;
    }

    setUploadProgress(50);

    try {
      if (!supabase) {
        // Demo mode - simulate live stream creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUploadProgress(100);
        alert('Live stream started! (Demo mode)');
        resetForm();
        onClose();
        onUploadSuccess?.();
        return;
      }

      // Create live stream
      const { data: liveStreamData, error: liveError } = await supabase
        .from('live_streams')
        .insert({
          user_id: user.id,
          cloudflare_live_input_id: `live-${Date.now()}`,
          title: liveTitle,
          description: liveDescription,
          rtmp_url: `rtmp://live.cloudflare.com/live/${Date.now()}`,
          stream_key: `stream-${Date.now()}`,
          playback_url: `https://live.cloudflare.com/playback/${Date.now()}`,
          is_active: true,
        })
        .select()
        .single();

      if (liveError) {
        throw new Error(`Failed to create live stream: ${liveError.message}`);
      }

      setUploadProgress(100);
      alert('Live stream created successfully!');
      resetForm();
      onClose();
      onUploadSuccess?.();
    } catch (error) {
      console.error('Error creating live stream:', error);
      alert(`Error creating live stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setPostImage(null);
    setPostCaption('');
    setPostHashtags('');
    setVideoFile(null);
    setVideoTitle('');
    setVideoDescription('');
    setVideoHashtags('');
    setLiveTitle('');
    setLiveDescription('');
    setLiveCategory('general');
    setIsBattle(false);
    setBattleTitle('');
    setBattleDescription('');
    setInvitedUser('');
    setInvitedUserId('');
    setShowUserSearch(false);
    setSearchResults([]);
    setSearchQuery('');
    setShowCamera(false);
    setIsRecording(false);
    setRecordedChunks([]);
    setRecordingTime(0);
    setCameraError(null);
    stopCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Create</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Mode Selection - TikTok Style */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUploadMode('post')}
              className={`flex-1 flex flex-col items-center space-y-1 p-3 rounded-md transition-colors ${
                uploadMode === 'post'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Camera size={20} />
              <span className="text-sm font-medium">Post</span>
            </button>
            <button
              onClick={() => setUploadMode('video')}
              className={`flex-1 flex flex-col items-center space-y-1 p-3 rounded-md transition-colors ${
                uploadMode === 'video'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Video size={20} />
              <span className="text-sm font-medium">Video</span>
            </button>
            <button
              onClick={() => setUploadMode('live')}
              className={`flex-1 flex flex-col items-center space-y-1 p-3 rounded-md transition-colors ${
                uploadMode === 'live'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Radio size={20} />
              <span className="text-sm font-medium">Live</span>
            </button>
          </div>

          {/* Post Mode Content */}
          {uploadMode === 'post' && (
            <div className="space-y-4">
              {/* Camera Interface for Photos */}
              {showCamera && uploadMode === 'post' ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Top Controls */}
                    <div className="flex justify-between items-start">
                      <button
                        onClick={stopCamera}
                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={switchCamera}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <RotateCcw size={20} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Bottom Controls */}
                    <div className="flex justify-center">
                      <button
                        onClick={async () => {
                          if (videoRef.current) {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = videoRef.current.videoWidth;
                            canvas.height = videoRef.current.videoHeight;
                            ctx?.drawImage(videoRef.current, 0, 0);
                            
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                                setPostImage(file);
                                setShowCamera(false);
                                stopCamera();
                              }
                            }, 'image/jpeg', 0.9);
                          }
                        }}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center"
                      >
                        <Camera size={24} className="text-gray-800" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : !postImage ? (
                <div className="space-y-4">
                  {/* Single Upload/Capture Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  >
                    <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Choose a photo to share
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      JPG, PNG up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Camera Capture Button */}
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Camera size={20} />
                    <span>Take Photo with Camera</span>
                  </button>
                  
                  {/* Camera Error */}
                  {cameraError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{cameraError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={URL.createObjectURL(postImage)}
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {postImage.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(postImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={startCamera}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        disabled={uploading}
                        title="Take new photo"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={() => setPostImage(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        disabled={uploading}
                        title="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                placeholder="Write a caption..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-900"
                disabled={uploading}
              />

              <input
                type="text"
                placeholder="Add hashtags..."
                value={postHashtags}
                onChange={(e) => setPostHashtags(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={uploading}
              />
            </div>
          )}

          {/* Video Mode Content */}
          {uploadMode === 'video' && (
            <div className="space-y-4">
              {/* Camera Interface */}
              {showCamera ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Top Controls */}
                    <div className="flex justify-between items-start">
                      <button
                        onClick={stopCamera}
                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={switchCamera}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <RotateCcw size={20} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Bottom Controls */}
                    <div className="flex flex-col items-center space-y-4">
                      {/* Recording Timer */}
                      {isRecording && (
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {formatTime(recordingTime)}
                        </div>
                      )}
                      
                      {/* Record Button */}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {isRecording ? (
                          <Square size={24} className="text-white" />
                        ) : (
                          <Play size={24} className="text-gray-800 ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : !videoFile ? (
                <div className="space-y-4">
                  {/* Single Upload/Record Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  >
                    <Video size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Choose a video to upload
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      MP4, MOV, WebM up to 100MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Camera Record Button */}
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Camera size={20} />
                    <span>Record Video with Camera</span>
                  </button>
                  
                  {/* Camera Error */}
                  {cameraError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{cameraError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Video size={24} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={startCamera}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        disabled={uploading}
                        title="Record new video"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={() => setVideoFile(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        disabled={uploading}
                        title="Remove video"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Video title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={uploading}
              />

              <textarea
                placeholder="Description (optional)"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-900"
                disabled={uploading}
              />

              <input
                type="text"
                placeholder="Hashtags (separated by spaces or commas)"
                value={videoHashtags}
                onChange={(e) => setVideoHashtags(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={uploading}
              />
            </div>
          )}

          {/* Live Mode Content */}
          {uploadMode === 'live' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio size={32} className="text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Go Live</h3>
                <p className="text-sm text-gray-500">
                  Start a live stream and connect with your audience
                </p>
              </div>

              <input
                type="text"
                placeholder="Live stream title"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={uploading}
              />

              <textarea
                placeholder="Describe your live stream..."
                value={liveDescription}
                onChange={(e) => setLiveDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-900"
                disabled={uploading}
              />

              <select
                value={liveCategory}
                onChange={(e) => setLiveCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={uploading}
              >
                <option value="general">General</option>
                <option value="gaming">Gaming</option>
                <option value="music">Music</option>
                <option value="dance">Dance</option>
                <option value="cooking">Cooking</option>
                <option value="education">Education</option>
                <option value="battle">Battle</option>
              </select>

              {/* Battle Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="battle-toggle"
                  checked={isBattle}
                  onChange={(e) => setIsBattle(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={uploading || !canCreateBattle}
                />
                <div className="flex-1">
                  <label htmlFor="battle-toggle" className="text-sm font-medium text-gray-700">
                    Create as live battle
                  </label>
                  {!canCreateBattle && (
                    <p className="text-xs text-red-600 mt-1">
                      Requires 500+ followers to create battles
                    </p>
                  )}
                </div>
              </div>

              {/* Battle Settings */}
              {isBattle && (
                <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800">Battle Settings</h3>
                  <input
                    type="text"
                    placeholder="Battle title"
                    value={battleTitle}
                    onChange={(e) => setBattleTitle(e.target.value)}
                    className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    disabled={uploading}
                  />
                  <textarea
                    placeholder="Battle description"
                    value={battleDescription}
                    onChange={(e) => setBattleDescription(e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900"
                    disabled={uploading}
                  />
                  
                  {/* Invite Opponent */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-red-800">Invite Opponent</label>
                    {!invitedUser ? (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for user to battle..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                            setShowUserSearch(true);
                          }}
                          onFocus={() => setShowUserSearch(true)}
                          className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                          disabled={uploading}
                        />
                        
                        {/* Search Results Dropdown */}
                        {showUserSearch && searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                              >
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    @{user.username}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.follower_count.toLocaleString()} followers
                                  </p>
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                  ✓ Eligible
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {showUserSearch && searchQuery && searchResults.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg p-3">
                            <p className="text-sm text-gray-500">No users found with 500+ followers</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">@{invitedUser}</span>
                          <span className="text-xs text-green-600 font-medium">✓ Invited</span>
                        </div>
                        <button
                          onClick={clearInvitation}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={uploading}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-red-600">
                    Live battles allow viewers to vote in real-time as you compete! Only users with 500+ followers can be invited.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {uploadMode === 'post' ? 'Uploading post...' : 
                   uploadMode === 'video' ? 'Uploading video...' : 
                   'Starting live stream...'}
                </span>
                <span className="text-purple-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={
              uploading || 
              (uploadMode === 'post' && !postImage) ||
              (uploadMode === 'video' && !videoFile) ||
              (uploadMode === 'live' && !liveTitle.trim()) ||
              (uploadMode === 'live' && isBattle && !invitedUserId)
            }
            className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={20} />
            <span>
              {uploading ? 'Processing...' : 
               uploadMode === 'post' ? 'Share Post' :
               uploadMode === 'video' ? 'Upload Video' :
               uploadMode === 'live' ? (isBattle ? 'Start Live Battle' : 'Go Live') :
               'Go Live'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
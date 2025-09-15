import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, MoreHorizontal } from 'lucide-react';
import { Video, Comment, User } from '../types';
import { supabase } from '../lib/supabase';
import { mockUsers } from '../data/mockData';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video;
  currentUser: User;
  onCommentUpdate?: (videoId: string, newCount: number) => void;
}

export default function CommentsModal({ 
  isOpen, 
  onClose, 
  video, 
  currentUser, 
  onCommentUpdate 
}: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, video.id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadComments = async () => {
    if (!supabase) {
      // Demo mode - create mock comments
      const mockComments: Comment[] = [
        {
          id: 'comment-1',
          video_id: video.id,
          user_id: '1',
          user: mockUsers[0],
          content: 'This is amazing! 🔥',
          likes_count: 12,
          is_flagged: false,
          created_at: new Date(Date.now() - 300000).toISOString(),
          updated_at: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'comment-2',
          video_id: video.id,
          user_id: '2',
          user: mockUsers[1],
          content: 'Love the creativity! Keep it up! 💪',
          likes_count: 8,
          is_flagged: false,
          created_at: new Date(Date.now() - 180000).toISOString(),
          updated_at: new Date(Date.now() - 180000).toISOString(),
        },
        {
          id: 'comment-3',
          video_id: video.id,
          user_id: currentUser.id,
          user: currentUser,
          content: 'Thanks for watching! 🙏',
          likes_count: 3,
          is_flagged: false,
          created_at: new Date(Date.now() - 120000).toISOString(),
          updated_at: new Date(Date.now() - 120000).toISOString(),
        },
      ];
      setComments(mockComments);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('video_id', video.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    if (!newComment.trim() || sending) return;

    const commentContent = newComment.trim();
    setNewComment('');
    setSending(true);

    if (!supabase) {
      // Demo mode - add comment to local state
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        video_id: video.id,
        user_id: currentUser.id,
        user: currentUser,
        content: commentContent,
        likes_count: 0,
        is_flagged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, newCommentObj]);
      onCommentUpdate?.(video.id, video.comment_count + 1);
      setSending(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          video_id: video.id,
          user_id: currentUser.id,
          content: commentContent,
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) {
        console.error('Error sending comment:', error);
        return;
      }

      setComments(prev => [...prev, data]);
      onCommentUpdate?.(video.id, video.comment_count + 1);
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-end z-50">
      <div className="bg-black w-full h-3/4 rounded-t-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            Comments ({comments.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user?.avatar_url}
                  alt={comment.user?.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      @{comment.user?.username}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="flex items-center space-x-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={14} />
                      <span className="text-xs">{comment.likes_count}</span>
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={sending}
              />
              <button
                onClick={sendComment}
                disabled={!newComment.trim() || sending}
                className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

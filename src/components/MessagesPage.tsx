import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { User, Conversation, Message } from '../types';
import { supabase } from '../lib/supabase';
import { mockUsers } from '../data/mockData';

interface MessagesPageProps {
  currentUser: User;
  onBack: () => void;
}

export default function MessagesPage({ currentUser, onBack }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!supabase) {
      // Demo mode - create mock conversations
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          user1_id: currentUser.id,
          user2_id: '1',
          user1: currentUser,
          user2: mockUsers[0],
          last_message_at: new Date().toISOString(),
          last_message: {
            id: 'msg-1',
            conversation_id: 'conv-1',
            sender_id: '1',
            sender: mockUsers[0],
            content: 'Hey! How are you doing?',
            message_type: 'text',
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          unread_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'conv-2',
          user1_id: currentUser.id,
          user2_id: '2',
          user1: currentUser,
          user2: mockUsers[1],
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          last_message: {
            id: 'msg-2',
            conversation_id: 'conv-2',
            sender_id: currentUser.id,
            sender: currentUser,
            content: 'Thanks for the follow!',
            message_type: 'text',
            is_read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
          },
          unread_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setConversations(mockConversations);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!conversations_user1_id_fkey(*),
          user2:users!conversations_user2_id_fkey(*),
          last_message:messages(*, sender:users(*))
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!supabase) {
      // Demo mode - create mock messages
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          conversation_id: conversationId,
          sender_id: '1',
          sender: mockUsers[0],
          content: 'Hey! How are you doing?',
          message_type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 300000).toISOString(),
          updated_at: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'msg-2',
          conversation_id: conversationId,
          sender_id: currentUser.id,
          sender: currentUser,
          content: 'I\'m doing great! Thanks for asking 😊',
          message_type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 240000).toISOString(),
          updated_at: new Date(Date.now() - 240000).toISOString(),
        },
        {
          id: 'msg-3',
          conversation_id: conversationId,
          sender_id: '1',
          sender: mockUsers[0],
          content: 'That\'s awesome! I saw your latest video, it was amazing! 🔥',
          message_type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 180000).toISOString(),
          updated_at: new Date(Date.now() - 180000).toISOString(),
        },
        {
          id: 'msg-4',
          conversation_id: conversationId,
          sender_id: currentUser.id,
          sender: currentUser,
          content: 'Thank you so much! I really appreciate the support 🙏',
          message_type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 120000).toISOString(),
          updated_at: new Date(Date.now() - 120000).toISOString(),
        },
      ];
      setMessages(mockMessages);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    if (!supabase) {
      // Demo mode - add message to local state
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        sender: currentUser,
        content: messageContent,
        message_type: 'text',
        is_read: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMsg]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          content: messageContent,
          message_type: 'text',
        })
        .select(`
          *,
          sender:users(*)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  const getOtherUser = (conversation: Conversation) => {
    return conversation.user1_id === currentUser.id ? conversation.user2 : conversation.user1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading messages...</p>
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
        </button>
        
        <h1 className="text-lg font-bold">Messages</h1>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-800 bg-gray-900/50`}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-purple-600/20 border border-purple-500/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={otherUser?.avatar_url}
                        alt={otherUser?.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{otherUser?.username}</h3>
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.last_message?.content}
                        </p>
                      </div>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center space-x-3">
                  <img
                    src={getOtherUser(selectedConversation)?.avatar_url}
                    alt={getOtherUser(selectedConversation)?.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{getOtherUser(selectedConversation)?.username}</h3>
                    <p className="text-sm text-gray-400">Active now</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Video size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUser.id ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

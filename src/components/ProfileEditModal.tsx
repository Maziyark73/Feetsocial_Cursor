import React, { useState, useRef } from 'react';
import { X, Upload, Camera, User } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
}

export default function ProfileEditModal({ isOpen, onClose, user, onUpdate }: ProfileEditModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setAvatarFile(selectedFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      alert('Username is required');
      return;
    }

    setUploading(true);

    try {
      let avatarUrl = user.avatar_url;

      // If a new avatar file is selected, convert it to data URL
      if (avatarFile) {
        console.log('📸 Converting avatar to data URL');
        
        // Convert the selected file to a data URL (base64)
        const reader = new FileReader();
        avatarUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      }

      // Update user profile
      console.log('📝 Updating profile with new avatar');
      
      // Update local state with the actual selected image
      const updatedUser = {
        ...user,
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };
      
      onUpdate(updatedUser);
      alert('Profile updated successfully!');

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setUsername(user.username);
    setBio(user.bio || '');
    setAvatarFile(null);
    setAvatarPreview(user.avatar_url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Avatar Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto border-2 border-purple-500 object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
                disabled={uploading}
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Tap the camera icon to change your profile picture
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="Enter your username"
              disabled={uploading}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-900"
              placeholder="Tell us about yourself..."
              disabled={uploading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!username.trim() || uploading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

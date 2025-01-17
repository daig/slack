import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useUser } from '../../context/UserContext';
import { cloudinaryConfig, getCloudinaryUploadUrl } from '../../config/cloudinary';

const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: UUID!) {
    userById(id: $userId) {
      id
      displayName
      bio
      avatarUrl
    }
  }
`;

const UPDATE_USER_BIO = gql`
  mutation UpdateUserBio($userId: UUID!, $bio: String!) {
    updateUserById(
      input: {
        id: $userId
        userPatch: {
          bio: $bio
        }
      }
    ) {
      user {
        id
        bio
      }
    }
  }
`;

const UPDATE_AVATAR_URL = gql`
  mutation UpdateAvatarUrl($userId: UUID!, $avatarUrl: String!) {
    updateUserById(
      input: {
        id: $userId
        userPatch: {
          avatarUrl: $avatarUrl
        }
      }
    ) {
      user {
        id
        avatarUrl
      }
    }
  }
`;

const GET_DM_CHANNEL = gql`
  mutation GetDmChannel($userId1: UUID!, $userId2: UUID!) {
    getDmChannel(input: { userId1: $userId1, userId2: $userId2 }) {
      uuid
    }
  }
`;

const UserProfile: React.FC = () => {
  const { userId: loggedInUserId } = useUser();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loading, error, data } = useQuery(GET_USER_PROFILE, {
    variables: { userId },
    skip: !userId
  });

  const [updateBio, { loading: updating }] = useMutation(UPDATE_USER_BIO, {
    onCompleted: () => setIsEditing(false),
    refetchQueries: ['GetUserProfile']
  });

  const [updateAvatarUrl] = useMutation(UPDATE_AVATAR_URL, {
    refetchQueries: ['GetUserProfile']
  });

  const [getDmChannel, { loading: creatingDm }] = useMutation(GET_DM_CHANNEL, {
    onCompleted: (data) => {
      const channelId = data.getDmChannel.uuid;
      navigate(`/channels/${channelId}`);
    },
    onError: (error) => {
      console.error('Error creating DM channel:', error);
    }
  });

  const handleEditClick = () => {
    setBioInput(data?.userById?.bio || '');
    setIsEditing(true);
  };

  const handleSaveBio = async () => {
    if (!userId) return;
    
    try {
      await updateBio({
        variables: {
          userId,
          bio: bioInput
        }
      });
    } catch (err) {
      console.error('Error updating bio:', err);
    }
  };

  const handleImageClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      console.log('Image clicked, opening file dialog');
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) {
      console.log('No file selected or no userId');
      return;
    }

    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      console.error('Missing Cloudinary configuration');
      return;
    }

    console.log('Starting image upload for file:', file.name);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const uploadUrl = getCloudinaryUploadUrl(cloudinaryConfig.cloudName);
      console.log('Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary response:', data);
      
      if (data.secure_url) {
        console.log('Updating avatar URL in database...');
        await updateAvatarUrl({
          variables: {
            userId,
            avatarUrl: data.secure_url
          }
        });
        console.log('Avatar URL updated successfully');
      } else {
        console.error('No secure_url in Cloudinary response:', data);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the file input
      }
    }
  };

  const handleStartDm = async () => {
    if (!loggedInUserId || !userId) return;
    
    try {
      await getDmChannel({
        variables: {
          userId1: loggedInUserId,
          userId2: userId
        }
      });
    } catch (err) {
      console.error('Error starting DM:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg shadow-sm">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      </div>
    );
  }

  const user = data?.userById;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 bg-gray-50 px-4 py-2 rounded-lg shadow-sm">
          User not found
        </div>
      </div>
    );
  }

  const isOwnProfile = loggedInUserId === userId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm">
        <div className="p-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0 relative group">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                onClick={(e) => {
                  // Reset the file input value before opening dialog
                  (e.target as HTMLInputElement).value = '';
                }}
              />
              {uploadingImage ? (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {user.avatarUrl ? (
                    <div 
                      className={`relative ${isOwnProfile ? 'cursor-pointer' : ''}`}
                      onClick={handleImageClick}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={`${user.displayName}'s avatar`}
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.removeAttribute('style');
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className={`w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-medium shadow-lg ${isOwnProfile ? 'cursor-pointer' : ''}`}
                      onClick={handleImageClick}
                    >
                      {user.displayName[0].toUpperCase()}
                    </div>
                  )}
                  {isOwnProfile && (
                    <div 
                      className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all cursor-pointer"
                      onClick={handleImageClick}
                    >
                      <svg 
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {user.displayName}
              </h1>
              
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Write something about yourself..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBio}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {user.bio ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">
                      No bio provided
                    </p>
                  )}
                  {isOwnProfile ? (
                    <button
                      onClick={handleEditClick}
                      className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {user.bio ? 'Edit bio' : 'Add bio'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartDm}
                      disabled={creatingDm}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {creatingDm ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating chat...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Message
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 
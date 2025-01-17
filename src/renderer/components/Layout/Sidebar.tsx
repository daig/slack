import React from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ArrowLeftOnRectangleIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { JoinChannelModal } from './JoinChannelModal';

const GET_USER_CHANNELS = gql`
  query GetUserChannels($userId: UUID!) {
    userById(id: $userId) {
      channelMembersByUserId {
        nodes {
          channelByChannelId {
            id
            name
            isDm
            channelMembersByChannelId {
              nodes {
                userByUserId {
                  id
                  displayName
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_AVAILABLE_CHANNELS = gql`
  query GetAvailableChannels {
    allChannels {
      nodes {
        id
        name
        isDm
        channelMembersByChannelId {
          nodes {
            userId
          }
        }
      }
    }
  }
`;

const JOIN_CHANNEL = gql`
  mutation JoinChannel($userId: UUID!, $channelId: UUID!) {
    createChannelMember(
      input: {
        channelMember: {
          userId: $userId
          channelId: $channelId
        }
      }
    ) {
      channelMember {
        channelId
        userId
      }
    }
  }
`;

interface SidebarProps {
    onChannelSelect: (channelId: string) => void;
    selectedChannelId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onChannelSelect, selectedChannelId }) => {
    const { userId } = useUser();
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    
    const [joinChannel] = useMutation(JOIN_CHANNEL, {
        refetchQueries: ['GetUserChannels'],
    });
    
    const { 
        loading: loadingAvailable, 
        data: availableData, 
        error: availableError 
    } = useQuery(GET_AVAILABLE_CHANNELS);

    const handleJoinChannel = async (channelId: string) => {
        if (!userId) return;
        
        try {
            await joinChannel({
                variables: {
                    userId,
                    channelId,
                },
            });
            setIsJoinModalOpen(false);
        } catch (error) {
            console.error('Error joining channel:', error);
        }
    };

    const { loading, error, data } = useQuery(GET_USER_CHANNELS, {
        variables: { userId },
    });
    const navigate = useNavigate();

    if (loading) return <div className="sidebar">Loading...</div>;
    if (error) return <div className="sidebar">Error: {error.message}</div>;

    const channels = data?.userById?.channelMembersByUserId?.nodes || [];

    const getChannelDisplayName = (channel: any) => {
        if (!channel.isDm) {
            return `# ${channel.name}`;
        }

        // For DM channels, find the other user's display name
        const otherUser = channel.channelMembersByChannelId.nodes.find(
            (member: any) => member.userByUserId.id !== userId
        );
        return `@${otherUser?.userByUserId?.displayName || 'Unknown User'}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('userId');
        navigate('/login');
    };

    return (
        <div className="sidebar flex h-screen w-64 flex-col bg-gray-800">
            <div className="p-4">
                <h1 className="text-xl font-bold text-white">Chat App</h1>
                <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-gray-700 py-2 px-4 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Join Channel</span>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="px-2">
                    {channels.map((channel: any) => (
                        <li 
                            key={channel.channelByChannelId.id}
                            onClick={() => onChannelSelect(channel.channelByChannelId.id)}
                            className={`cursor-pointer p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors ${
                                channel.channelByChannelId.id === selectedChannelId 
                                    ? 'bg-gray-700 text-white font-medium' 
                                    : ''
                            }`}
                        >
                            {getChannelDisplayName(channel.channelByChannelId)}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-gray-700 space-y-2">
                <button
                    onClick={() => navigate(`/profile/${userId}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700 py-2 px-4 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors"
                >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>My Profile</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700 py-2 px-4 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>

            <JoinChannelModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                availableChannels={availableData?.allChannels?.nodes ?? []}
                onJoinChannel={handleJoinChannel}
                userId={userId}
                isLoading={loadingAvailable}
            />
        </div>
    );
} 
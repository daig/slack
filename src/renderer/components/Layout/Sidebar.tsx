import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const GET_USER_CHANNELS = gql`
  query GetUserChannels($userId: UUID!) {
    userById(id: $userId) {
      channelMembersByUserId {
        nodes {
          channelByChannelId {
            id
            name
          }
        }
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
    const { loading, error, data } = useQuery(GET_USER_CHANNELS, {
        variables: { userId },
    });
    const navigate = useNavigate();

    if (loading) return <div className="sidebar">Loading...</div>;
    if (error) return <div className="sidebar">Error: {error.message}</div>;

    const channels = data?.userById?.channelMembersByUserId?.nodes || [];

    const handleLogout = () => {
        localStorage.removeItem('userId');
        navigate('/login');
    };

    return (
        <div className="sidebar flex h-screen w-64 flex-col bg-gray-800">
            <div className="p-4">
                <h1 className="text-xl font-bold text-white">Chat App</h1>
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
                            # {channel.channelByChannelId.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700 py-2 px-4 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}; 
import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const GET_USER_CHANNELS = gql`
  query GetUserChannels {
    userByDisplayName(displayName: "alice") {
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
    const { loading, error, data } = useQuery(GET_USER_CHANNELS);
    const navigate = useNavigate();

    if (loading) return <div className="sidebar">Loading...</div>;
    if (error) return <div className="sidebar">Error: {error.message}</div>;

    const channels = data?.userByDisplayName?.channelMembersByUserId?.nodes || [];

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
                    onClick={() => navigate('/signup')}
                    className="w-full rounded-md bg-indigo-600 py-2 px-4 text-white hover:bg-indigo-700 transition-colors"
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
}; 
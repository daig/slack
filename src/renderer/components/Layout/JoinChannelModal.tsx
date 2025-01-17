import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Channel {
  id: string;
  name: string;
  isDm: boolean;
  channelMembersByChannelId: {
    nodes: Array<{
      userId: string;
    }>;
  };
}

interface JoinChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableChannels: Channel[];
  onJoinChannel: (channelId: string) => void;
  userId: string | null;
  isLoading: boolean;
}

export const JoinChannelModal: React.FC<JoinChannelModalProps> = ({
  isOpen,
  onClose,
  availableChannels,
  onJoinChannel,
  userId,
  isLoading
}) => {
  // Filter out channels the user is already a member of and DM channels
  const filteredChannels = availableChannels.filter(channel => 
    userId && 
    !channel.isDm && 
    !channel.channelMembersByChannelId.nodes.some(member => member.userId === userId)
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-gray-800 p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-white">
              Join a Channel
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-gray-300">Loading available channels...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-gray-300">No available channels to join</div>
          ) : (
            <div className="space-y-2">
              {filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onJoinChannel(channel.id)}
                  className="w-full text-left p-3 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors flex items-center"
                >
                  <span className="flex-1"># {channel.name}</span>
                </button>
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 
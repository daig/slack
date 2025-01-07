import React, { useState, KeyboardEvent } from 'react';
import { gql, useMutation } from '@apollo/client';

const CREATE_MESSAGE = gql`
  mutation CreateMessageWithChannel($content: String!, $userId: UUID!, $channelId: UUID!) {
    createMessageWithChannel(
      input: {
        content: $content
        userId: $userId
        channelId: $channelId
      }
    ) {
      message {
        id
        content
        userId
        updatedAt
        messageChannelsByMessageId {
          nodes {
            channelId
            postedAt
            isEdited
          }
        }
      }
    }
  }
`;

const useCreateMessage = () => {
  const [createMessage, { loading, error }] = useMutation(CREATE_MESSAGE);

  const sendMessage = async (content: string, userId: string, channelId: string) => {
    try {
      const response = await createMessage({
        variables: {
          content,
          userId,
          channelId
        }
      });
      return response.data.createMessageWithChannel.message;
    } catch (err) {
      console.error('Error creating message:', err);
      throw err;
    }
  };

  return {
    sendMessage,
    loading,
    error
  };
};

interface MessageComposerProps {
    channelId: string;
    userId: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ channelId, userId }) => {
    const { sendMessage, loading, error } = useCreateMessage();
    const [messageContent, setMessageContent] = useState('');

    const handleSend = async () => {
        if (!messageContent.trim()) return;
        
        try {
            await sendMessage(
                messageContent.trim(),
                userId,
                channelId
            );
            setMessageContent('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 bg-white px-6 py-4">
            {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                        Failed to send message: {error.message}
                    </p>
                </div>
            )}
            <div className="flex items-end space-x-3">
                <div className="flex-1 min-w-0">
                    <textarea
                        rows={1}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-none"
                        style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={loading || !messageContent.trim()}
                    className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        loading || !messageContent.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'
                    }`}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}; 

import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const GET_MESSAGES = gql`
  query GetMessages($channelId: UUID!) {
    channelById(id: $channelId) {
      name
      messageChannelsByChannelId(orderBy: POSTED_AT_ASC) {
        nodes {
          isEdited
          messageByMessageId {
            id
            content
            userByUserId {
              id
              displayName
              avatarUrl
            }
          }
          postedAt
        }
      }
    }
  }
`;

interface MessageFeedProps {
    channelId: string;
    userId: string;
    onChannelSelect: (channelId: string) => void;
}

const renderMessageWithMentions = (content: string, onChannelSelect: (channelId: string) => void) => {
  if (!content) return '';
  
  // This regex matches both @ and # mentions in the format @[name](id) or #[name](id)
  const mentionRegex = /[@#]\[(.*?)\]\((.*?)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add the text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the mention as a link
    const [fullMatch, display, id] = match;
    const isChannel = fullMatch.startsWith('#');
    parts.push(
      <a
        key={match.index}
        href="#"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e) => {
          e.preventDefault();
          if (isChannel) {
            onChannelSelect(id);
          }
        }}
      >
        {fullMatch.startsWith('@') ? '@' : '#'}{display}
      </a>
    );

    lastIndex = match.index + fullMatch.length;
  }

  // Add any remaining text after the last mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <>{parts}</>;
};

const MessageList: React.FC<{ channelId: string, userId: string, onChannelSelect: (channelId: string) => void }> = ({ channelId, userId, onChannelSelect }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  if (!channelId) {
    return <div className="flex-1 min-h-0 bg-gray-50"></div>;
  }

  const { loading, error, data } = useQuery(GET_MESSAGES, {
    variables: { channelId },
    pollInterval: 100,
    fetchPolicy: 'network-only',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [data?.channelById?.messageChannelsByChannelId?.nodes]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg shadow-sm">
        <span className="font-medium">Error:</span> {error.message}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <span className="text-gray-500 text-2xl mr-2">#</span>
          <h1 className="text-xl font-semibold text-gray-900">
            {data?.channelById?.name || 'Unknown Channel'}
          </h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth">
        {data?.channelById?.messageChannelsByChannelId?.nodes?.length > 0 ? (
          <>
            {data.channelById.messageChannelsByChannelId.nodes.map((messageChannel: any) => (
              <div key={messageChannel.postedAt} className="group animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {messageChannel.messageByMessageId?.userByUserId?.avatarUrl ? (
                      <img
                        src={messageChannel.messageByMessageId.userByUserId.avatarUrl}
                        alt={`${messageChannel.messageByMessageId.userByUserId.displayName}'s avatar`}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white cursor-pointer"
                        onClick={() => navigate(`/profile/${messageChannel.messageByMessageId.userByUserId.id}`)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.removeAttribute('style');
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium cursor-pointer"
                      style={{ display: messageChannel.messageByMessageId?.userByUserId?.avatarUrl ? 'none' : 'flex' }}
                      onClick={() => navigate(`/profile/${messageChannel.messageByMessageId.userByUserId.id}`)}
                    >
                      {messageChannel.messageByMessageId?.userByUserId?.displayName?.[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/profile/${messageChannel.messageByMessageId.userByUserId.id}`)}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {messageChannel.messageByMessageId?.userByUserId?.displayName}
                      </button>
                      <span className="text-xs text-gray-500">
                        {new Date(messageChannel.postedAt).toLocaleString()}
                      </span>
                      {messageChannel.isEdited && (
                        <span className="text-xs text-gray-400 italic">(edited)</span>
                      )}
                    </div>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                      {renderMessageWithMentions(messageChannel.messageByMessageId?.content, onChannelSelect)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-center">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const MessageFeed: React.FC<MessageFeedProps> = ({ channelId, userId, onChannelSelect }) => {
  if (!channelId) {
    return <div className="flex-1 min-h-0 bg-gray-50"></div>;
  }

  return (
    <div className="flex-1 min-h-0 bg-gray-50">
      <MessageList channelId={channelId} userId={userId} onChannelSelect={onChannelSelect} />
    </div>
  );
};

export default MessageFeed;

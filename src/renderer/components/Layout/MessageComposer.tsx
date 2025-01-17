import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { gql, useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { FileUploadModal } from './FileUploadModal';

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

const ASK_MESSAGE = gql`
  query AskMessage($question: String!) {
    askMessage(question: $question)
  }
`;

const GET_CHANNEL_MEMBERS = gql`
  query GetChannelMembers($channelId: UUID!) {
    channelById(id: $channelId) {
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
`;

const GET_USER_CHANNELS = gql`
  query GetUserChannels($userId: UUID!) {
    userById(id: $userId) {
      channelMembersByUserId {
        nodes {
          channelByChannelId {
            id
            name
            isDm
          }
        }
      }
    }
  }
`;

const CREATE_MESSAGE_WITH_FILE = gql`
  mutation CreateMessageWithFile(
    $content: String!
    $userId: UUID!
    $channelId: UUID!
    $fileKey: String!
    $bucket: String!
    $contentType: String!
  ) {
    createMessageWithFile(
      input: {
        content: $content
        userId: $userId
        channelId: $channelId
        fileKey: $fileKey
        bucket: $bucket
        contentType: $contentType
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

const SEARCH_DOCUMENTS = gql`
  query SearchDocuments($query: String!, $maxResults: Int) {
    searchDocumentsList(query: $query, maxResults: $maxResults) {
      fileKey
      bucket
      score
      metadata
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

const useTextToSpeech = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'blob'
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();

      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      console.error('Error in text-to-speech:', err);
      setError('Failed to convert text to speech');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    speak,
    isLoading,
    error
  };
};

interface FileAttachment {
    file: File;
    uploadInfo: {
        fileKey: string;
        bucket: string;
        contentType: string;
    };
}

interface MessageComposerProps {
    channelId: string;
    userId: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ channelId, userId }) => {
    const { sendMessage, loading, error } = useCreateMessage();
    const { speak, isLoading: speechLoading, error: speechError } = useTextToSpeech();
    const [messageContent, setMessageContent] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState('');
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState<FileAttachment | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [createMessageWithFile] = useMutation(CREATE_MESSAGE_WITH_FILE);

    const { data: channelData } = useQuery(GET_CHANNEL_MEMBERS, {
        variables: { channelId },
        skip: !channelId
    });

    const { data: userChannelsData } = useQuery(GET_USER_CHANNELS, {
        variables: { userId },
        skip: !userId
    });

    const [searchDocuments, { loading: searchLoading }] = useLazyQuery(SEARCH_DOCUMENTS, {
        onCompleted: (data) => {
            console.log('Search results:', data.searchDocumentsList); // Debug log
            setSearchResults(data.searchDocumentsList || []);
            setShowSearchResults(true);
        },
        onError: (error) => {
            console.error('Failed to search documents:', error);
            setSearchResults([]);
            setShowSearchResults(true);
        }
    });

    const users: SuggestionDataItem[] = React.useMemo(() => {
        if (!channelData?.channelById?.channelMembersByChannelId?.nodes) return [];
        return channelData.channelById.channelMembersByChannelId.nodes.map(
            (node: any) => ({
                id: node.userByUserId.id,
                display: node.userByUserId.displayName
            })
        );
    }, [channelData]);

    const channels: SuggestionDataItem[] = React.useMemo(() => {
        if (!userChannelsData?.userById?.channelMembersByUserId?.nodes) return [];
        return userChannelsData.userById.channelMembersByUserId.nodes
            .filter((node: any) => !node.channelByChannelId.isDm && node.channelByChannelId.name)
            .map((node: any) => ({
                id: node.channelByChannelId.id,
                display: node.channelByChannelId.name
            }));
    }, [userChannelsData]);

    const [askQuestion, { loading: askLoading }] = useLazyQuery(ASK_MESSAGE, {
        onCompleted: (data) => {
            setPopupContent(data.askMessage);
            setShowPopup(true);
            speak(data.askMessage);
        },
        onError: (error) => {
            console.error('Failed to ask question:', error);
            setPopupContent('Failed to get an answer. Please try again.');
            setShowPopup(true);
        }
    });

    const handleSend = async () => {
        if (!messageContent.trim() && !pendingAttachment) return;
        
        try {
            if (pendingAttachment) {
                await createMessageWithFile({
                    variables: {
                        content: messageContent.trim(),
                        userId,
                        channelId,
                        fileKey: pendingAttachment.uploadInfo.fileKey,
                        bucket: pendingAttachment.uploadInfo.bucket,
                        contentType: pendingAttachment.uploadInfo.contentType
                    }
                });
            } else {
                await sendMessage(
                    messageContent.trim(),
                    userId,
                    channelId
                );
            }
            setMessageContent('');
            setPendingAttachment(null);
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleFileUploadComplete = (file: File, uploadInfo: { fileKey: string; bucket: string; contentType: string }) => {
        setPendingAttachment({ file, uploadInfo });
        setIsFileUploadModalOpen(false);
    };

    const handleAsk = async () => {
        if (!messageContent.trim()) return;
        
        askQuestion({
            variables: {
                question: messageContent.trim()
            }
        });
    };

    const handleSearch = async () => {
        if (!messageContent.trim()) return;
        
        searchDocuments({
            variables: {
                query: messageContent.trim(),
                maxResults: 3
            }
        });
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const composerStyles = {
        opacity: channelId ? 1 : 0.5,
        pointerEvents: channelId ? 'auto' : 'none' as React.CSSProperties['pointerEvents'],
    };

    const mentionInputStyle = {
        control: {
            backgroundColor: '#fff',
            fontSize: 16,
            fontWeight: 'normal',
            marginBottom: '0.5rem',
        },
        input: {
            margin: 0,
            padding: '12px 16px',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            width: '100%',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            minHeight: '2.5rem',
            maxHeight: '10rem',
            overflow: 'hidden',
        },
        suggestions: {
            list: {
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: '0.5rem',
                bottom: '100%',
                marginBottom: '0.5rem',
                width: '100%',
                maxHeight: '200px',
                overflow: 'auto',
                zIndex: 1,
            },
            item: {
                padding: '8px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.15)',
                '&focused': {
                    backgroundColor: '#f3f4f6',
                },
            },
        },
        highlighter: {
            padding: '12px 16px',
            border: '1px solid transparent',
        }
    };

    return (
        <div className="message-composer relative" style={composerStyles}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex flex-col gap-2">
                <div className="relative">
                    <MentionsInput
                        value={messageContent}
                        onChange={(_: any, newValue: string) => setMessageContent(newValue)}
                        style={mentionInputStyle}
                        placeholder={channelId ? "Type a message... Use @ to mention someone or # for channels" : "Select a channel to start messaging"}
                        disabled={!channelId}
                        forceSuggestionsAboveCursor
                    >
                        <Mention
                            trigger="@"
                            data={users}
                            renderSuggestion={(
                                suggestion: SuggestionDataItem,
                                search: string,
                                highlightedDisplay: React.ReactNode
                            ) => (
                                <div className="user-suggestion">
                                    {highlightedDisplay}
                                </div>
                            )}
                            style={{
                                backgroundColor: 'transparent',
                                borderRadius: '3px',
                                padding: '1px 3px',
                                margin: '-1px 0',
                            }}
                        />
                        <Mention
                            trigger="#"
                            data={channels}
                            markup="#[__display__](__id__)"
                            renderSuggestion={(
                                suggestion: SuggestionDataItem,
                                search: string,
                                highlightedDisplay: React.ReactNode
                            ) => (
                                <div className="channel-suggestion">
                                    {highlightedDisplay}
                                </div>
                            )}
                            style={{
                                backgroundColor: 'transparent',
                                borderRadius: '3px',
                                padding: '1px 3px',
                                margin: '-1px 0',
                            }}
                        />
                    </MentionsInput>
                    {pendingAttachment && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-center gap-2">
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm text-gray-700">{pendingAttachment.file.name}</span>
                            <button
                                type="button"
                                onClick={() => setPendingAttachment(null)}
                                className="ml-auto text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsFileUploadModalOpen(true)}
                        disabled={!channelId}
                        className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 ${
                            !channelId
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-600 text-white hover:bg-gray-500 active:bg-gray-700'
                        }`}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    <button
                        type="submit"
                        disabled={!channelId || (!messageContent.trim() && !pendingAttachment)}
                        className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                            loading || (!messageContent.trim() && !pendingAttachment)
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
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={!messageContent.trim() || searchLoading}
                        className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                            searchLoading || !messageContent.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700'
                        }`}
                    >
                        {searchLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleAsk}
                        disabled={!messageContent.trim() || askLoading}
                        className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                            askLoading || !messageContent.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700'
                        }`}
                    >
                        {askLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

            <FileUploadModal
                isOpen={isFileUploadModalOpen}
                onClose={() => setIsFileUploadModalOpen(false)}
                channelId={channelId}
                userId={userId}
                onUploadComplete={handleFileUploadComplete}
            />

            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">Answer</h3>
                            <button
                                onClick={() => setShowPopup(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{popupContent}</p>
                    </div>
                </div>
            )}

            {showSearchResults && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">Search Results</h3>
                            <button
                                onClick={() => setShowSearchResults(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {searchResults && searchResults.length > 0 ? (
                            <div className="space-y-4">
                                {searchResults.map((result, index) => {
                                    try {
                                        const metadata = JSON.parse(result.metadata);
                                        console.log('Parsed metadata:', metadata); // Debug log
                                        return (
                                            <div key={result.fileKey} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">{metadata.fileName || result.fileKey}</span>
                                                    <span className="text-sm text-gray-500">
                                                        Score: {(result.score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-2">
                                                    <p>File Key: {result.fileKey}</p>
                                                    <p>Bucket: {result.bucket}</p>
                                                    <p>Content Type: {metadata.contentType || 'Unknown'}</p>
                                                    <p>Uploaded at: {metadata.uploadedAt ? new Date(metadata.uploadedAt).toLocaleString() : 'Unknown'}</p>
                                                    <a 
                                                        href={metadata.downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const url = metadata.downloadUrl;
                                                            console.log('Opening URL:', url); // Debug log
                                                            window.open(url, '_blank', 'noopener,noreferrer');
                                                        }}
                                                    >
                                                        Download File
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    } catch (error) {
                                        console.error('Error parsing metadata:', error, result);
                                        return null;
                                    }
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-700">No matching documents found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}; 

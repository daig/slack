import React, { useState, KeyboardEvent } from 'react';
import { gql, useMutation, useLazyQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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

    const [askQuestion, { loading: askLoading }] = useLazyQuery(ASK_MESSAGE, {
        onCompleted: (data) => {
            setPopupContent(data.askMessage);
            setShowPopup(true);
        },
        onError: (error) => {
            console.error('Failed to ask question:', error);
            setPopupContent('Failed to get an answer. Please try again.');
            setShowPopup(true);
        }
    });

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

    const handleAsk = async () => {
        if (!messageContent.trim()) return;
        
        askQuestion({
            variables: {
                question: messageContent.trim()
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

    return (
        <div className="message-composer relative" style={composerStyles}>
            <form onSubmit={handleSend}>
                <textarea
                    rows={1}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={channelId ? "Type a message..." : "Select a channel to start messaging"}
                    disabled={!channelId}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-none"
                    style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
                />
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={!channelId}
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
                    <button
                        type="button"
                        onClick={() => speak(messageContent)}
                        disabled={!messageContent.trim() || speechLoading}
                        className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                            speechLoading || !messageContent.trim()
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700'
                        }`}
                    >
                        {speechLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M12 9.64a3 3 0 010 4.72m3.536-9.864a7 7 0 010 12.728M19.072 5.929a9 9 0 010 18.142" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

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
        </div>
    );
}; 

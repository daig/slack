import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';

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

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { loading, error, data } = useQuery(GET_USER_PROFILE, {
    variables: { userId },
    skip: !userId
  });

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
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
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
              ) : (
                <div 
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-medium shadow-lg"
                >
                  {user.displayName[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {user.displayName}
              </h1>
              {user.bio ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {user.bio}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  No bio provided
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 
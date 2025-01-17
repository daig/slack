import React, { useState, useRef } from 'react';
import { ApolloProvider } from '@apollo/client';
import { Sidebar } from './components/Layout/Sidebar';
import { MessageFeed } from './components/Layout/MessageFeed';
import { MessageComposer } from './components/Layout/MessageComposer';
import { client } from './apollo/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';
import UserProfile from './components/Profile/UserProfile';
import { UserProvider, useUser } from './context/UserContext';

interface MessageListRef {
  scrollToUserMessage: (userId: string) => boolean;
}

const MainLayout: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const messageListRef = useRef<MessageListRef>(null);
  const { userId } = useUser();

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        onChannelSelect={handleChannelSelect} 
        selectedChannelId={selectedChannelId} 
      />
      <main className="flex flex-col flex-1 h-full">
        <MessageFeed 
          ref={messageListRef}
          channelId={selectedChannelId} 
          userId={userId} 
          onChannelSelect={handleChannelSelect}
        />
        <MessageComposer 
          channelId={selectedChannelId} 
          userId={userId} 
          onChannelSelect={handleChannelSelect}
          onScrollToUserMessage={(userId) => messageListRef.current?.scrollToUserMessage(userId)}
        />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/chat" element={<MainLayout />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ApolloProvider>
  );
};

export default App; 
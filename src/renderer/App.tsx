import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { MessageFeed } from './components/Layout/MessageFeed';
import { MessageComposer } from './components/Layout/MessageComposer';
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';
import { UserProvider, useUser } from './context/UserContext';

const MainLayout: React.FC = () => {
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const { userId } = useUser();

    if (!userId) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar 
                onChannelSelect={setSelectedChannelId} 
                selectedChannelId={selectedChannelId} 
            />
            <main className="flex flex-col flex-1 h-full">
                <MessageFeed 
                    channelId={selectedChannelId} 
                    userId={userId} 
                    onChannelSelect={setSelectedChannelId}
                />
                <MessageComposer channelId={selectedChannelId} userId={userId} />
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
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </UserProvider>
        </ApolloProvider>
    );
};

export default App; 
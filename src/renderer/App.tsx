import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { MessageFeed } from './components/Layout/MessageFeed';
import { MessageComposer } from './components/Layout/MessageComposer';
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';

const MainLayout: React.FC = () => {
    const [selectedChannelId, setSelectedChannelId] = useState<string>('44444444-4444-4444-4444-444444444444');
    const userId = '11111111-1111-1111-1111-111111111111';

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar 
                onChannelSelect={setSelectedChannelId} 
                selectedChannelId={selectedChannelId} 
            />
            <main className="flex flex-col flex-1 h-full">
                <MessageFeed channelId={selectedChannelId} userId={userId} />
                <MessageComposer channelId={selectedChannelId} userId={userId} />
            </main>
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <ApolloProvider client={client}>
            <Router>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/chat" element={<MainLayout />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ApolloProvider>
    );
};

export default App; 
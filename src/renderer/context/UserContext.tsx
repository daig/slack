import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserIdState] = useState<string | null>(() => {
    // Initialize from localStorage on mount
    return localStorage.getItem('userId');
  });

  const setUserId = (id: string | null) => {
    setUserIdState(id);
    if (id) {
      localStorage.setItem('userId', id);
    } else {
      localStorage.removeItem('userId');
    }
  };

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
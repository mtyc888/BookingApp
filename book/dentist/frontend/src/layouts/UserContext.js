import React, { createContext, useState, useContext } from 'react';
import Cookie from 'react-cookies'
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookie.load('isLoggedIn'));
  
  return (
    <UserContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
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

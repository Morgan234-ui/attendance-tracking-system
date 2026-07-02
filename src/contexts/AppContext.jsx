'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';

const initialState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  notifications: [],
  unreadCount: 0,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    case 'TOGGLE_MOBILE_SIDEBAR':
      return { ...state, mobileSidebarOpen: !state.mobileSidebarOpen };
    case 'CLOSE_MOBILE_SIDEBAR':
      return { ...state, mobileSidebarOpen: false };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebar = useCallback((open) => {
    dispatch({ type: 'SET_SIDEBAR', payload: open });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' });
  }, []);

  const closeMobileSidebar = useCallback(() => {
    dispatch({ type: 'CLOSE_MOBILE_SIDEBAR' });
  }, []);

  const setNotifications = useCallback((notifications) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }, []);

  const markNotificationRead = useCallback((id) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  }, []);

  const value = {
    ...state,
    toggleSidebar,
    setSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setNotifications,
    markNotificationRead,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

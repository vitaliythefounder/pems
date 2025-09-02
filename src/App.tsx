import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PlatformLogin from './components/PlatformLogin';
import PlatformDashboard from './components/PlatformDashboard';
import PimsApp from './components/PimsApp';
import TaskManagerApp from './components/TaskManagerApp';
import InvitationAccept from './components/InvitationAccept';
import './index.css';

function App() {
  const [platformUser, setPlatformUser] = useState<any>(null);
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  // Load platform user from localStorage on mount
  useEffect(() => {
    const savedPlatformUser = localStorage.getItem('platformUser');
    const platformToken = localStorage.getItem('platformToken');
    const savedCurrentApp = localStorage.getItem('currentApp');
    
    if (platformToken && savedPlatformUser) {
      try {
        const userData = JSON.parse(savedPlatformUser);
        setPlatformUser(userData);
        console.log('Platform user loaded from localStorage:', userData);
        
        // Restore the current app selection if it exists
        if (savedCurrentApp) {
          setCurrentApp(savedCurrentApp);
          console.log('Restored current app:', savedCurrentApp);
        }
      } catch (error) {
        console.error('Error parsing platform user data:', error);
        // Clear invalid data
        localStorage.removeItem('platformUser');
        localStorage.removeItem('platformToken');
        localStorage.removeItem('currentApp');
      }
    }
  }, []);

  const handlePlatformLogin = (userData: any) => {
    setPlatformUser(userData);
    console.log('Platform user logged in:', userData);
  };

  const handlePlatformLogout = () => {
    // Clear platform auth data
    localStorage.removeItem('platformToken');
    localStorage.removeItem('platformUser');
    localStorage.removeItem('currentApp');
    setPlatformUser(null);
    setCurrentApp(null);
    console.log('Platform user logged out');
  };

  const handleAppSelect = (appId: string) => {
    setCurrentApp(appId);
    localStorage.setItem('currentApp', appId);
    console.log('Selected app:', appId);
  };

  const handleBackToPlatform = () => {
    setCurrentApp(null);
    localStorage.removeItem('currentApp');
    console.log('Returned to platform dashboard');
  };

  // Render micro apps if selected
  if (platformUser && currentApp) {
    switch (currentApp) {
      case 'pims':
        return (
          <PimsApp 
            platformUser={platformUser}
            onBackToPlatform={handleBackToPlatform}
          />
        );
      case 'task-manager':
        return (
          <TaskManagerApp 
            platformUser={platformUser}
            onBackToPlatform={handleBackToPlatform}
          />
        );
      default:
        return (
          <PlatformDashboard 
            user={platformUser}
            onLogout={handlePlatformLogout}
            onAppSelect={handleAppSelect}
          />
        );
    }
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Platform invitation acceptance route */}
          <Route 
            path="/invite/:token" 
            element={<InvitationAccept />} 
          />
          
          {/* Main platform route */}
          <Route 
            path="/" 
            element={
              !platformUser ? (
                <PlatformLogin onLogin={handlePlatformLogin} />
              ) : (
                <PlatformDashboard 
                  user={platformUser}
                  onLogout={handlePlatformLogout}
                  onAppSelect={handleAppSelect}
                />
              )
            } 
          />
          
          {/* Catch all other routes and redirect to platform */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

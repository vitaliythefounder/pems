import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Grid, 
  User, 
  Settings, 
  LogOut, 
  Plus,
  CheckCircle,
  XCircle,
  Star,
  Users,
  Briefcase,
  Home
} from 'lucide-react';

interface MicroApp {
  appId: string;
  name: string;
  displayName: string;
  description: string;
  category: 'personal' | 'business' | 'all';
  icon: string;
  color: string;
  route: string;
  isActive: boolean;
  isActivated: boolean;
  userPermissions: string[];
  subscriptionRequired: boolean;
  requiredPlan: string;
  features: Array<{
    name: string;
    description: string;
    isEnabled: boolean;
  }>;
}

interface PlatformUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
  };
  activatedApps: Array<{
    appId: string;
    activatedAt: string;
    permissions: string[];
  }>;
  preferences: {
    theme: string;
    language: string;
    timezone: string;
  };
}

interface PlatformDashboardProps {
  user: PlatformUser;
  onLogout: () => void;
  onAppSelect: (appId: string) => void;
}

const PlatformDashboard: React.FC<PlatformDashboardProps> = ({
  user,
  onLogout,
  onAppSelect
}) => {
  const [apps, setApps] = useState<MicroApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'business'>('all');
  const [error, setError] = useState('');

  // Load available apps
  useEffect(() => {
    const loadApps = async () => {
      try {
        const token = localStorage.getItem('platformToken');
        const response = await fetch('http://localhost:5001/api/platform/apps', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load apps');
        }

        const data = await response.json();
        setApps(data.apps);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  // Activate app
  const activateApp = async (appId: string) => {
    try {
      const token = localStorage.getItem('platformToken');
      const response = await fetch(`http://localhost:5001/api/platform/apps/${appId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions: ['read', 'write'] })
      });

      if (!response.ok) {
        throw new Error('Failed to activate app');
      }

      // Update local state
      setApps(prev => prev.map(app => 
        app.appId === appId 
          ? { ...app, isActivated: true, userPermissions: ['read', 'write'] }
          : app
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Deactivate app
  const deactivateApp = async (appId: string) => {
    try {
      const token = localStorage.getItem('platformToken');
      const response = await fetch(`http://localhost:5001/api/platform/apps/${appId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate app');
      }

      // Update local state
      setApps(prev => prev.map(app => 
        app.appId === appId 
          ? { ...app, isActivated: false, userPermissions: [] }
          : app
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter apps by category
  const filteredApps = apps.filter(app => {
    if (activeTab === 'all') return true;
    return app.category === activeTab;
  });

  // Check if user can access app based on subscription
  const canAccessApp = (app: MicroApp) => {
    if (!app.subscriptionRequired) return true;
    
    const planHierarchy = ['free', 'personal', 'business', 'enterprise'];
    const userPlanIndex = planHierarchy.indexOf(user.subscription.plan);
    const requiredPlanIndex = planHierarchy.indexOf(app.requiredPlan);
    
    return userPlanIndex >= requiredPlanIndex;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Just Everything</h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.firstName} {user.lastName}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {user.subscription.plan}
                </span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your productivity apps and tools all in one place.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>All Apps</span>
            </button>
            
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'personal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal</span>
            </button>
            
            <button
              onClick={() => setActiveTab('business')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'business'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Business</span>
            </button>
          </nav>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.appId}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                app.isActivated 
                  ? 'border-green-200 hover:border-green-300' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* App Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${app.color}20`, color: app.color }}
                  >
                    {app.icon}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {app.isActivated && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {app.subscriptionRequired && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* App Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {app.displayName}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {app.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {app.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {feature.name}
                      </span>
                    ))}
                    {app.features.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{app.features.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {app.isActivated ? (
                    <>
                      <button
                        onClick={() => onAppSelect(app.appId)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Open App
                      </button>
                      <button
                        onClick={() => deactivateApp(app.appId)}
                        className="px-3 py-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Deactivate app"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => canAccessApp(app) ? activateApp(app.appId) : null}
                      disabled={!canAccessApp(app)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canAccessApp(app)
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canAccessApp(app) ? 'Activate App' : `Requires ${app.requiredPlan} plan`}
                    </button>
                  )}
                </div>

                {/* Subscription Badge */}
                {app.subscriptionRequired && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Requires {app.requiredPlan} plan
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No apps found</h3>
            <p className="text-gray-500">
              {activeTab === 'all' 
                ? 'No apps are available at the moment.'
                : `No ${activeTab} apps are available at the moment.`
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlatformDashboard;

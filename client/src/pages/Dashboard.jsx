import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTestnets } from '../hooks/useTestnets';
import { useFaucets } from '../hooks/useFaucets';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { testnets, stats, loading: testnetsLoading, fetchTestnets, fetchTestnetStats } = useTestnets();
  const { faucets, loading: faucetsLoading, fetchFaucets } = useFaucets();

  useEffect(() => {
    fetchTestnets();
    fetchTestnetStats();
    fetchFaucets();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (testnetsLoading || faucetsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Testrack</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link to="/testnets" className="text-gray-500 hover:text-gray-700">Testnets</Link>
              <Link to="/faucets" className="text-gray-500 hover:text-gray-700">Faucets</Link>
              <Link to="/notifications" className="text-gray-500 hover:text-gray-700">Notifications</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-gray-500 hover:text-gray-700">
                {user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.email?.split('@')[0]}!
            </h2>
            <p className="text-gray-600">
              Manage your testnet activities and track your progress.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Testnets
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.total || testnets?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.completed || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        In Progress
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.in_progress || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">🚰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Faucets
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {faucets?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Testnets */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Testnets</h3>
              </div>
              <div className="p-6">
                {testnets && testnets.length > 0 ? (
                  <div className="space-y-4">
                    {testnets.slice(0, 3).map((testnet) => (
                      <div key={testnet.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{testnet.name}</p>
                          <p className="text-sm text-gray-500">{testnet.chain}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          testnet.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : testnet.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {testnet.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No testnets yet</p>
                )}
                <div className="mt-4">
                  <Link
                    to="/testnets"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View all testnets →
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <Link
                    to="/testnets"
                    className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add New Testnet
                  </Link>
                  <Link
                    to="/faucets"
                    className="block w-full bg-green-600 text-white text-center px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Browse Faucets
                  </Link>
                  <Link
                    to="/notifications"
                    className="block w-full bg-purple-600 text-white text-center px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Check Notifications
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
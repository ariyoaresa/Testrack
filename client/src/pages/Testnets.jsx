import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTestnets } from '../hooks/useTestnets';
import LoadingSpinner from '../components/LoadingSpinner';

const Testnets = () => {
  const { user, logout } = useAuth();
  const { 
    testnets, 
    loading, 
    error, 
    fetchTestnets, 
    createTestnet, 
    updateTestnet, 
    deleteTestnet,
    completeTestnet 
  } = useTestnets();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTestnet, setEditingTestnet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    chain: '',
    description: '',
    deadline: '',
    priority: 'medium',
    status: 'pending'
  });

  useEffect(() => {
    fetchTestnets();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestnet) {
        await updateTestnet(editingTestnet.id, formData);
        setEditingTestnet(null);
      } else {
        await createTestnet(formData);
        setShowCreateForm(false);
      }
      setFormData({
        name: '',
        chain: '',
        description: '',
        deadline: '',
        priority: 'medium',
        status: 'pending'
      });
      fetchTestnets();
    } catch (error) {
      console.error('Failed to save testnet:', error);
    }
  };

  const handleEdit = (testnet) => {
    setEditingTestnet(testnet);
    setFormData({
      name: testnet.name,
      chain: testnet.chain,
      description: testnet.description || '',
      deadline: testnet.deadline ? testnet.deadline.split('T')[0] : '',
      priority: testnet.priority || 'medium',
      status: testnet.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this testnet?')) {
      try {
        await deleteTestnet(id);
        fetchTestnets();
      } catch (error) {
        console.error('Failed to delete testnet:', error);
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTestnet(id);
      fetchTestnets();
    } catch (error) {
      console.error('Failed to complete testnet:', error);
    }
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingTestnet(null);
    setFormData({
      name: '',
      chain: '',
      description: '',
      deadline: '',
      priority: 'medium',
      status: 'pending'
    });
  };

  if (loading && !testnets) {
    return <LoadingSpinner message="Loading testnets..." />;
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
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</Link>
              <Link to="/testnets" className="text-blue-600 font-medium">Testnets</Link>
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
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Testnets</h2>
              <p className="text-gray-600 mt-2">Manage your testnet activities and track progress</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Testnet
            </button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTestnet ? 'Edit Testnet' : 'Create New Testnet'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Testnet Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Ethereum Goerli"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chain
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.chain}
                      onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Ethereum, Polygon, Solana"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what you're testing..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTestnet ? 'Update' : 'Create'} Testnet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Testnets List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Testnets</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {testnets && testnets.length > 0 ? (
                testnets.map((testnet) => (
                  <div key={testnet.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{testnet.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            testnet.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : testnet.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {testnet.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            testnet.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : testnet.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {testnet.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Chain: {testnet.chain}</p>
                        {testnet.description && (
                          <p className="text-sm text-gray-600 mt-1">{testnet.description}</p>
                        )}
                        {testnet.deadline && (
                          <p className="text-sm text-gray-600 mt-1">
                            Deadline: {new Date(testnet.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {testnet.status !== 'completed' && (
                          <button
                            onClick={() => handleComplete(testnet.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(testnet)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(testnet.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No testnets found. Create your first testnet to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Testnets;
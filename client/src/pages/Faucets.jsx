import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFaucets } from '../hooks/useFaucets';
import LoadingSpinner from '../components/LoadingSpinner';

const Faucets = () => {
  const { user, logout } = useAuth();
  const { 
    faucets, 
    chains, 
    networks, 
    loading, 
    error, 
    fetchFaucets, 
    searchFaucets, 
    fetchChains, 
    fetchNetworks 
  } = useFaucets();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [filteredFaucets, setFilteredFaucets] = useState([]);

  useEffect(() => {
    fetchFaucets();
    fetchChains();
    fetchNetworks();
  }, []);

  useEffect(() => {
    let filtered = faucets || [];

    if (searchTerm) {
      filtered = filtered.filter(faucet => 
        faucet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faucet.chain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faucet.token.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedChain) {
      filtered = filtered.filter(faucet => faucet.chain === selectedChain);
    }

    if (selectedNetwork) {
      filtered = filtered.filter(faucet => faucet.network === selectedNetwork);
    }

    setFilteredFaucets(filtered);
  }, [faucets, searchTerm, selectedChain, selectedNetwork]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      try {
        await searchFaucets(searchTerm);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      fetchFaucets();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedChain('');
    setSelectedNetwork('');
    fetchFaucets();
  };

  if (loading && !faucets) {
    return <LoadingSpinner message="Loading faucets..." />;
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
              <Link to="/testnets" className="text-gray-500 hover:text-gray-700">Testnets</Link>
              <Link to="/faucets" className="text-blue-600 font-medium">Faucets</Link>
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Faucet Library</h2>
            <p className="text-gray-600 mt-2">Discover and access testnet faucets for various blockchain networks</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Faucets
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, chain, or token..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chain
                    </label>
                    <select
                      value={selectedChain}
                      onChange={(e) => setSelectedChain(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Chains</option>
                      {chains && chains.map((chain) => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <select
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Networks</option>
                      {networks && networks.map((network) => (
                        <option key={network} value={network}>{network}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Results Count */}
          {filteredFaucets.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-600">
                Showing {filteredFaucets.length} faucet{filteredFaucets.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Faucets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaucets.length > 0 ? (
              filteredFaucets.map((faucet) => (
                <div key={faucet.id || `${faucet.name}-${faucet.chain}`} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{faucet.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {faucet.chain}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Network:</span>
                        <span className="text-gray-900">{faucet.network}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Token:</span>
                        <span className="text-gray-900">{faucet.token}</span>
                      </div>
                      {faucet.daily_limit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Daily Limit:</span>
                          <span className="text-gray-900">{faucet.daily_limit}</span>
                        </div>
                      )}
                    </div>

                    {faucet.requirements && faucet.requirements.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {faucet.requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <a
                      href={faucet.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Visit Faucet
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No faucets found</h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedChain || selectedNetwork
                      ? 'Try adjusting your search criteria or filters.'
                      : 'No faucets are currently available.'}
                  </p>
                  {(searchTerm || selectedChain || selectedNetwork) && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Loading indicator for search */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Faucets;
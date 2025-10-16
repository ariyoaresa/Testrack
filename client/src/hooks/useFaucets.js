import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService.js';

export const useFaucets = () => {
  const [faucets, setFaucets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chains, setChains] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [filters, setFilters] = useState({
    chain: '',
    network: '',
    token: '',
    search: '',
  });

  // Fetch all faucets
  const fetchFaucets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getFaucets(params);
      setFaucets(data.faucets || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching faucets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search faucets
  const searchFaucets = useCallback(async (query, searchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.searchFaucets(query, searchFilters);
      setFaucets(data.faucets || data);
    } catch (err) {
      setError(err.message);
      console.error('Error searching faucets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available chains
  const fetchChains = useCallback(async () => {
    try {
      const data = await apiService.getFaucetChains();
      setChains(data.chains || data);
    } catch (err) {
      console.error('Error fetching chains:', err);
    }
  }, []);

  // Fetch available networks
  const fetchNetworks = useCallback(async () => {
    try {
      const data = await apiService.getFaucetNetworks();
      setNetworks(data.networks || data);
    } catch (err) {
      console.error('Error fetching networks:', err);
    }
  }, []);

  // Get a single faucet
  const getFaucet = useCallback(async (id) => {
    try {
      return await apiService.getFaucet(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const params = {};
    
    if (filters.chain) params.chain = filters.chain;
    if (filters.network) params.network = filters.network;
    if (filters.token) params.token = filters.token;
    
    if (filters.search) {
      searchFaucets(filters.search, params);
    } else {
      fetchFaucets(params);
    }
  }, [filters, fetchFaucets, searchFaucets]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      chain: '',
      network: '',
      token: '',
      search: '',
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Filter faucets locally (for immediate UI feedback)
  const filteredFaucets = faucets.filter(faucet => {
    if (filters.chain && faucet.chain !== filters.chain) return false;
    if (filters.network && faucet.network !== filters.network) return false;
    if (filters.token && !faucet.token.toLowerCase().includes(filters.token.toLowerCase())) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        faucet.name.toLowerCase().includes(searchTerm) ||
        faucet.chain.toLowerCase().includes(searchTerm) ||
        faucet.network.toLowerCase().includes(searchTerm) ||
        faucet.token.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  // Load initial data
  useEffect(() => {
    fetchFaucets();
    fetchChains();
    fetchNetworks();
  }, [fetchFaucets, fetchChains, fetchNetworks]);

  // Apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300); // Debounce filter application

    return () => clearTimeout(timeoutId);
  }, [applyFilters]);

  return {
    faucets: filteredFaucets,
    loading,
    error,
    chains,
    networks,
    filters,
    fetchFaucets,
    searchFaucets,
    fetchChains,
    fetchNetworks,
    getFaucet,
    updateFilters,
    applyFilters,
    clearFilters,
    clearError,
  };
};

export default useFaucets;
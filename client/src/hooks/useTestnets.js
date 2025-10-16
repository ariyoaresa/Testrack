import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService.js';

export const useTestnets = () => {
  const [testnets, setTestnets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch all testnets
  const fetchTestnets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTestnets(params);
      setTestnets(data.testnets || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching testnets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch testnet stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiService.getTestnetStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching testnet stats:', err);
    }
  }, []);

  // Create a new testnet
  const createTestnet = useCallback(async (testnetData) => {
    try {
      const newTestnet = await apiService.createTestnet(testnetData);
      setTestnets(prev => [newTestnet, ...prev]);
      return newTestnet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update an existing testnet
  const updateTestnet = useCallback(async (id, testnetData) => {
    try {
      const updatedTestnet = await apiService.updateTestnet(id, testnetData);
      setTestnets(prev => 
        prev.map(testnet => 
          testnet.id === id ? updatedTestnet : testnet
        )
      );
      return updatedTestnet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete a testnet
  const deleteTestnet = useCallback(async (id) => {
    try {
      await apiService.deleteTestnet(id);
      setTestnets(prev => prev.filter(testnet => testnet.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Complete a testnet
  const completeTestnet = useCallback(async (id) => {
    try {
      const updatedTestnet = await apiService.completeTestnet(id);
      setTestnets(prev => 
        prev.map(testnet => 
          testnet.id === id ? updatedTestnet : testnet
        )
      );
      return updatedTestnet;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get a single testnet
  const getTestnet = useCallback(async (id) => {
    try {
      return await apiService.getTestnet(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load testnets on mount
  useEffect(() => {
    fetchTestnets();
    fetchStats();
  }, [fetchTestnets, fetchStats]);

  return {
    testnets,
    loading,
    error,
    stats,
    fetchTestnets,
    fetchStats,
    createTestnet,
    updateTestnet,
    deleteTestnet,
    completeTestnet,
    getTestnet,
    clearError,
  };
};

export default useTestnets;
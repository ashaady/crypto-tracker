import { fetchAPI } from './fetch-helper';

const API_BASE_URL = '/api';

export interface Asset {
  id: number;
  symbol: string;
  amount: number;
  current_price?: number;
  total_value?: number;
  change_24h?: number;
}

export interface ValuationAsset {
  id: number;
  symbol: string;
  amount: number;
  current_price: number;
  value_usd: number;
  percent_change_24h: number;
  created_at: string;
  updated_at: string;
}

export interface ValuationResponse {
  total_value: number;
  currency: string;
  assets: ValuationAsset[];
  last_updated: string;
}

export interface DiversificationItem {
  symbol: string;
  percentage: number;
  value_usd: number;
}

export interface DiversificationResponse {
  total_value_usd: number;
  diversification: DiversificationItem[];
}

export interface HistoryPoint {
  timestamp: string;
  total_value: number;
}

export const portfolioAPI = {
  // Get all assets
  getAssets: async (): Promise<Asset[]> => {
    try {
      const data = await fetchAPI<Asset[]>(`${API_BASE_URL}/portfolio/assets`);
      return data || [];
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  },

  // Add an asset
  addAsset: async (symbol: string, amount: number): Promise<Asset> => {
    const data = await fetchAPI<Asset>(`${API_BASE_URL}/portfolio/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, amount }),
    });
    return data;
  },

  // Delete an asset
  deleteAsset: async (assetId: number): Promise<{ success: boolean }> => {
    try {
      const data = await fetchAPI<{ success: boolean }>(
        `${API_BASE_URL}/portfolio/assets/${assetId}`,
        { method: 'DELETE' }
      );
      return data || { success: true };
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  },

  // Get portfolio valuation
  getValuation: async (
    currency: string = 'USD'
  ): Promise<ValuationResponse> => {
    try {
      const data = await fetchAPI<ValuationResponse>(
        `${API_BASE_URL}/portfolio/valuation?currency=${currency}`
      );
      return (
        data || {
          total_value: 0,
          currency,
          change_24h: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching valuation:', error);
      return {
        total_value: 0,
        currency,
        change_24h: 0,
      };
    }
  },

  // Get diversification
  getDiversification: async (): Promise<DiversificationItem[]> => {
    try {
      const data = await fetchAPI<DiversificationItem[]>(
        `${API_BASE_URL}/portfolio/diversification`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching diversification:', error);
      return [];
    }
  },

  // Get history
  getHistory: async (days: number = 7): Promise<HistoryPoint[]> => {
    try {
      const data = await fetchAPI<HistoryPoint[]>(
        `${API_BASE_URL}/portfolio/history?days=${days}`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  },

  // Save a snapshot
  saveSnapshot: async (): Promise<{ success: boolean; message?: string }> => {
    const data = await fetchAPI<{ success: boolean; message?: string }>(
      `${API_BASE_URL}/portfolio/history/save`,
      { method: 'POST' }
    );
    return data || { success: true };
  },
};

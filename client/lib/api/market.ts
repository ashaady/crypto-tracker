import { fetchAPI } from './fetch-helper';

const API_BASE_URL = '/api';

export interface TopCrypto {
  rank: number;
  name: string;
  symbol: string;
  current_price: number;
  change_24h: number;
  market_cap: number;
  market_cap_usd?: number;
}

export const marketAPI = {
  // Get top cryptocurrencies
  getTopCryptos: async (limit: number = 10): Promise<TopCrypto[]> => {
    try {
      const data = await fetchAPI<TopCrypto[]>(
        `${API_BASE_URL}/market/top?limit=${limit}`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      return [];
    }
  },
};

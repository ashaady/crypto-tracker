import { fetchAPI } from "./fetch-helper";

const API_BASE_URL = "/api";

export interface TopCrypto {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  market_cap: number;
}

export const marketAPI = {
  // Get top cryptocurrencies
  getTopCryptos: async (limit: number = 10): Promise<TopCrypto[]> => {
    try {
      const response = await fetchAPI<{ top_cryptos: TopCrypto[] }>(
        `${API_BASE_URL}/market/top?limit=${limit}`,
      );
      return response?.top_cryptos || [];
    } catch (error) {
      console.error("Error fetching top cryptos:", error);
      return [];
    }
  },
};

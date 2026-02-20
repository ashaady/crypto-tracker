import type {
  PortfolioValuation,
  DiversificationData,
  Asset,
  Alert,
  AlertCheckResult,
  PerformanceHistory,
  CryptoMarketInfo,
  Currency,
} from "./types";

const API_BASE = "http://localhost:8000";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Portfolio endpoints
export const portfolioAPI = {
  getValuation: (currency: Currency = "USD"): Promise<PortfolioValuation> =>
    fetchApi(`/portfolio/valuation?currency=${currency}`),

  getDiversification: (): Promise<DiversificationData[]> =>
    fetchApi("/portfolio/diversification"),

  getAssets: (): Promise<Asset[]> => fetchApi("/portfolio/assets"),

  addAsset: (symbol: string, amount: number): Promise<Asset> =>
    fetchApi("/portfolio/assets", {
      method: "POST",
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        amount: parseFloat(amount.toString()),
      }),
    }),

  deleteAsset: (assetId: string): Promise<void> =>
    fetchApi(`/portfolio/assets/${assetId}`, {
      method: "DELETE",
    }),

  getHistory: (days: number = 7): Promise<PerformanceHistory> =>
    fetchApi(`/portfolio/history?days=${days}`),

  saveSnapshot: (): Promise<HistoryEntry> =>
    fetchApi("/portfolio/history/save", {
      method: "POST",
    }),
};

// Alert endpoints
export const alertsAPI = {
  getAlerts: (status?: string): Promise<Alert[]> => {
    const url = status ? `/alerts?status=${status}` : "/alerts";
    return fetchApi(url);
  },

  createAlert: (
    symbol: string,
    targetPrice: number,
    condition: "above" | "below",
  ): Promise<Alert> =>
    fetchApi("/alerts", {
      method: "POST",
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        target_price: parseFloat(targetPrice.toString()),
        condition,
      }),
    }),

  deleteAlert: (alertId: string): Promise<void> =>
    fetchApi(`/alerts/${alertId}`, {
      method: "DELETE",
    }),

  checkAlerts: (): Promise<AlertCheckResult> =>
    fetchApi("/alerts/check", {
      method: "POST",
    }),
};

// Market endpoints
export const marketAPI = {
  getTopCryptos: async (limit: number = 10): Promise<CryptoMarketInfo[]> => {
    const response = await fetchApi<{
      top_cryptos: Array<{
        rank: number;
        symbol: string;
        name: string;
        price: number;
        percent_change_24h: number;
        market_cap: number;
      }>;
    }>(`/market/top?limit=${limit}`);

    return response.top_cryptos.map((crypto) => ({
      rank: crypto.rank,
      name: crypto.name,
      symbol: crypto.symbol,
      price: crypto.price,
      change_24h: crypto.percent_change_24h,
      market_cap: crypto.market_cap,
    }));
  },
};

interface HistoryEntry {
  timestamp: string;
  value: number;
}

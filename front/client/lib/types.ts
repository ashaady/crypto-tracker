// Portfolio types
export interface Asset {
  id: string;
  symbol: string;
  amount: number;
  added_date: string;
}

export interface PortfolioValuation {
  total_value: number;
  currency: string;
  last_updated: string;
  assets: AssetValuation[];
}

export interface AssetValuation {
  symbol: string;
  amount: number;
  current_price: number;
  total_value: number;
  change_24h: number;
}

export interface DiversificationData {
  symbol: string;
  value: number;
  percentage: number;
}

// Alert types
export interface Alert {
  id: string;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  status: "active" | "triggered" | "cancelled";
  created_date: string;
}

export interface AlertCheckResult {
  total_checked: number;
  triggered_count: number;
  triggered_alerts: Alert[];
}

// Performance types
export interface HistoryEntry {
  timestamp: string;
  value: number;
}

export interface PerformanceHistory {
  data: HistoryEntry[];
  start_date: string;
  end_date: string;
  total_change: number;
  percentage_change: number;
}

// Market types
export interface CryptoMarketInfo {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
}

export type Currency = "USD" | "EUR" | "FCFA";

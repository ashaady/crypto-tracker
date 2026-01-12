import { RequestHandler } from "express";

interface Asset {
  id: number;
  symbol: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface AssetWithPrice extends Asset {
  current_price: number;
  value_usd: number;
  percent_change_24h: number;
}

interface ValuationResponse {
  total_value: number;
  currency: string;
  assets: AssetWithPrice[];
  last_updated: string;
}

interface DiversificationItem {
  symbol: string;
  value_usd: number;
  percentage: number;
}

interface DiversificationResponse {
  total_value_usd: number;
  diversification: DiversificationItem[];
}

interface HistoryPoint {
  timestamp: string;
  value_usd: number;
}

interface HistoryResponse {
  period_days: number;
  data_points: number;
  percent_change: number;
  data: HistoryPoint[];
}

// In-memory storage (replace with database in production)
let assetStorage: Asset[] = [];
let assetIdCounter = 1;
let historyStorage: HistoryPoint[] = [];

// Mock prices for cryptocurrencies
const mockPrices: Record<string, { price: number; change_24h: number }> = {
  BTC: { price: 45000, change_24h: 2.5 },
  ETH: { price: 2500, change_24h: 1.8 },
  ADA: { price: 0.95, change_24h: -0.5 },
  SOL: { price: 210, change_24h: 3.2 },
  XRP: { price: 2.4, change_24h: 1.2 },
  DOT: { price: 35, change_24h: 2.1 },
  DOGE: { price: 0.38, change_24h: 1.5 },
  LINK: { price: 22, change_24h: 2.8 },
  MATIC: { price: 0.9, change_24h: -0.3 },
  ATOM: { price: 12.5, change_24h: 1.9 },
};

function getMockPrice(
  symbol: string
): { price: number; change_24h: number } {
  return (
    mockPrices[symbol.toUpperCase()] || {
      price: Math.random() * 50000,
      change_24h: (Math.random() - 0.5) * 5,
    }
  );
}

// Get all assets
export const handleGetAssets: RequestHandler = (_req, res) => {
  res.json(assetStorage);
};

// Add an asset
export const handleAddAsset: RequestHandler = (req, res) => {
  const { symbol, amount } = req.body;

  if (!symbol || amount === undefined) {
    res.status(400).json({ error: "Missing required fields: symbol, amount" });
    return;
  }

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }

  const newAsset: Asset = {
    id: assetIdCounter++,
    symbol: symbol.toUpperCase(),
    amount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assetStorage.push(newAsset);
  res.status(201).json(newAsset);
};

// Delete an asset
export const handleDeleteAsset: RequestHandler = (req, res) => {
  const { assetId } = req.params;
  const id = parseInt(assetId);

  const index = assetStorage.findIndex((asset) => asset.id === id);
  if (index === -1) {
    res.status(404).json({ message: "Asset not found" });
    return;
  }

  assetStorage.splice(index, 1);
  res.json({ message: "Actif supprimé avec succès" });
};

// Get portfolio valuation
export const handleGetValuation: RequestHandler = (req, res) => {
  const currency = (req.query.currency as string) || "USD";

  const assets: AssetWithPrice[] = assetStorage.map((asset) => {
    const { price, change_24h } = getMockPrice(asset.symbol);
    return {
      ...asset,
      current_price: price,
      value_usd: asset.amount * price,
      percent_change_24h: change_24h,
    };
  });

  const total_value = assets.reduce((sum, asset) => sum + asset.value_usd, 0);

  const response: ValuationResponse = {
    total_value,
    currency,
    assets,
    last_updated: new Date().toISOString(),
  };

  res.json(response);
};

// Get portfolio diversification
export const handleGetDiversification: RequestHandler = (_req, res) => {
  const assets: AssetWithPrice[] = assetStorage.map((asset) => {
    const { price } = getMockPrice(asset.symbol);
    return {
      ...asset,
      current_price: price,
      value_usd: asset.amount * price,
      percent_change_24h: 0,
    };
  });

  const total_value_usd = assets.reduce((sum, asset) => sum + asset.value_usd, 0);

  const diversification: DiversificationItem[] = assets.map((asset) => ({
    symbol: asset.symbol,
    value_usd: asset.value_usd,
    percentage:
      total_value_usd > 0
        ? (asset.value_usd / total_value_usd) * 100
        : 0,
  }));

  const response: DiversificationResponse = {
    total_value_usd,
    diversification,
  };

  res.json(response);
};

// Get portfolio history
export const handleGetHistory: RequestHandler = (req, res) => {
  const period_days = parseInt((req.query.days as string) || "7");

  if (historyStorage.length === 0) {
    // Return mock history if empty
    const mockData: HistoryPoint[] = [];
    const now = new Date();
    const baseValue = 25000;

    for (let i = period_days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      mockData.push({
        timestamp: date.toISOString(),
        value_usd: baseValue + Math.random() * 10000,
      });
    }

    historyStorage = mockData;
  }

  const filteredData = historyStorage.slice(-period_days);
  const firstValue = filteredData[0]?.value_usd || 0;
  const lastValue = filteredData[filteredData.length - 1]?.value_usd || 0;
  const percent_change =
    firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  const response: HistoryResponse = {
    period_days,
    data_points: filteredData.length,
    percent_change,
    data: filteredData,
  };

  res.json(response);
};

// Save portfolio snapshot
export const handleSaveSnapshot: RequestHandler = (_req, res) => {
  const assets: AssetWithPrice[] = assetStorage.map((asset) => {
    const { price } = getMockPrice(asset.symbol);
    return {
      ...asset,
      current_price: price,
      value_usd: asset.amount * price,
      percent_change_24h: 0,
    };
  });

  const value = assets.reduce((sum, asset) => sum + asset.value_usd, 0);

  historyStorage.push({
    timestamp: new Date().toISOString(),
    value_usd: value,
  });

  res.json({ message: "Snapshot enregistré", value });
};

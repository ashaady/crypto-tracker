import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleGetAlerts,
  handleCreateAlert,
  handleDeleteAlert,
  handleCheckAlerts,
} from "./routes/alerts";
import {
  handleGetAssets,
  handleAddAsset,
  handleDeleteAsset,
  handleGetValuation,
  handleGetDiversification,
  handleGetHistory,
  handleSaveSnapshot,
} from "./routes/portfolio";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint
  app.get("/api", (_req, res) => {
    res.json({
      message: "Crypto-Tracker API",
      version: "1.0.0",
      endpoints: {
        portfolio:
          "/portfolio/assets, /portfolio/valuation, /portfolio/diversification",
        alerts: "/alerts, /alerts/check",
        history: "/portfolio/history",
        market: "/market/top",
      },
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Portfolio endpoints
  app.get("/api/portfolio/assets", handleGetAssets);
  app.post("/api/portfolio/assets", handleAddAsset);
  app.delete("/api/portfolio/assets/:assetId", handleDeleteAsset);
  app.get("/api/portfolio/valuation", handleGetValuation);
  app.get("/api/portfolio/diversification", handleGetDiversification);
  app.get("/api/portfolio/history", handleGetHistory);
  app.post("/api/portfolio/history/save", handleSaveSnapshot);

  // Alerts endpoints
  app.get("/api/alerts", handleGetAlerts);
  app.post("/api/alerts", handleCreateAlert);
  app.delete("/api/alerts/:id", handleDeleteAlert);
  app.post("/api/alerts/check", handleCheckAlerts);

  // Market endpoints (mock data)
  app.get("/api/market/top", (_req, res) => {
    const topCryptos = [
      {
        rank: 1,
        symbol: "BTC",
        name: "Bitcoin",
        price: 91393.19726277099,
        percent_change_24h: 0.90774224,
        market_cap: 1825583959163.3054,
      },
      {
        rank: 2,
        symbol: "ETH",
        name: "Ethereum",
        price: 3099.432115378593,
        percent_change_24h: -0.36159052,
        market_cap: 374085087884.57214,
      },
      {
        rank: 3,
        symbol: "USDT",
        name: "Tether USDt",
        price: 0.9991469230559697,
        percent_change_24h: 0.06395956,
        market_cap: 186806897908.47046,
      },
      {
        rank: 4,
        symbol: "XRP",
        name: "XRP",
        price: 2.063407994736507,
        percent_change_24h: 0.10355915,
        market_cap: 125248798327.04337,
      },
      {
        rank: 5,
        symbol: "BNB",
        name: "BNB",
        price: 904.4957870973841,
        percent_change_24h: 0.39698023,
        market_cap: 124579642112.26244,
      },
    ];

    res.json({ top_cryptos: topCryptos });
  });

  return app;
}

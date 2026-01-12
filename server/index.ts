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
        price: 45000.5,
        percent_change_24h: 2.5,
        market_cap: 900000000000,
      },
      {
        rank: 2,
        symbol: "ETH",
        name: "Ethereum",
        price: 2500.25,
        percent_change_24h: 1.8,
        market_cap: 300000000000,
      },
      {
        rank: 3,
        symbol: "ADA",
        name: "Cardano",
        price: 0.95,
        percent_change_24h: -0.5,
        market_cap: 34000000000,
      },
      {
        rank: 4,
        symbol: "SOL",
        name: "Solana",
        price: 210.0,
        percent_change_24h: 3.2,
        market_cap: 75000000000,
      },
      {
        rank: 5,
        symbol: "XRP",
        name: "Ripple",
        price: 2.4,
        percent_change_24h: 1.2,
        market_cap: 130000000000,
      },
    ];

    res.json({ top_cryptos: topCryptos });
  });

  return app;
}

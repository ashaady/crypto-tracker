import { RequestHandler } from "express";

interface Alert {
  id: number;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  status: "active" | "triggered";
  created_at: string;
  triggered_at: string | null;
}

// In-memory storage for alerts (in production, use a database)
let alertsStorage: Alert[] = [];
let alertIdCounter = 1;

export const handleGetAlerts: RequestHandler = (_req, res) => {
  res.json(alertsStorage);
};

export const handleCreateAlert: RequestHandler = (req, res) => {
  const { symbol, target_price, condition } = req.body;

  // Validation
  if (!symbol || target_price === undefined || !condition) {
    res.status(400).json({
      error: "Missing required fields: symbol, target_price, condition",
    });
    return;
  }

  if (typeof target_price !== "number" || target_price <= 0) {
    res.status(400).json({ error: "target_price must be a positive number" });
    return;
  }

  if (!["above", "below"].includes(condition)) {
    res.status(400).json({ error: "condition must be 'above' or 'below'" });
    return;
  }

  const newAlert: Alert = {
    id: alertIdCounter++,
    symbol: symbol.toUpperCase(),
    target_price,
    condition,
    status: "active",
    created_at: new Date().toISOString(),
    triggered_at: null,
  };

  alertsStorage.push(newAlert);
  res.status(201).json(newAlert);
};

export const handleDeleteAlert: RequestHandler = (req, res) => {
  const { id } = req.params;
  const alertId = parseInt(id);

  const index = alertsStorage.findIndex((alert) => alert.id === alertId);
  if (index === -1) {
    res.status(404).json({ message: "Alert not found" });
    return;
  }

  alertsStorage.splice(index, 1);
  res.json({ message: "Alert deleted successfully" });
};

export const handleCheckAlerts: RequestHandler = (_req, res) => {
  // This endpoint would check current prices against alert conditions
  // For now, it returns empty triggered alerts
  // In production, this would fetch real prices from a market data API
  res.json({
    checked: alertsStorage.length,
    triggered: [],
  });
};

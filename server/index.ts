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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Alerts endpoints
  app.get("/api/alerts", handleGetAlerts);
  app.post("/api/alerts", handleCreateAlert);
  app.delete("/api/alerts/:id", handleDeleteAlert);
  app.post("/api/alerts/check", handleCheckAlerts);

  return app;
}

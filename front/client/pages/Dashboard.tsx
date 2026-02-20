import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { portfolioAPI } from "@/lib/api";
import {
  formatCurrency,
  formatCryptoAmount,
  formatPercentage,
  formatDate,
  getChangeColor,
  getChangeBgColor,
} from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import type {
  Currency,
  PortfolioValuation,
  DiversificationData,
} from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const COLORS = [
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

export function Dashboard() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);

  // Fetch portfolio valuation
  const valuation = useApi(
    () => portfolioAPI.getValuation(currency),
    [currency],
  );

  // Fetch diversification data
  const diversification = useApi(() => portfolioAPI.getDiversification(), []);

  // Auto-refresh timer
  useEffect(() => {
    if (!refreshInterval) return;

    const timer = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          valuation.refetch();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, valuation]);

  const handleRefresh = async () => {
    await valuation.refetch();
    setNextRefreshIn(refreshInterval || 30);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setNextRefreshIn(refreshInterval || 30);
  };

  // Prepare chart data
  const chartData = (
    Array.isArray(diversification.data) ? diversification.data : []
  ).map((item, idx) => ({
    name: item.symbol,
    value: item.percentage,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre portefeuille
          </p>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto">
          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            className="px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="FCFA">FCFA</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={valuation.loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw
              size={18}
              className={valuation.loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Main Valuation Card */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border border-primary/30 p-8">
        {valuation.loading ? (
          <CardSkeleton />
        ) : valuation.error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{valuation.error.message}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 text-primary hover:underline"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Valeur totale du portefeuille
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {formatCurrency(valuation.data?.total_value || 0, currency)}
            </h2>
            <p className="text-xs text-muted-foreground">
              Mise à jour:{" "}
              {formatDate(valuation.data?.last_updated || new Date())}
            </p>
            {refreshInterval && (
              <p className="text-xs text-primary">
                Prochain rafraîchissement dans {nextRefreshIn}s
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Assets Table */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-foreground">Vos actifs</h3>
          </div>

          {valuation.loading ? (
            <TableSkeleton />
          ) : valuation.error ? (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-red-500">{valuation.error.message}</p>
            </div>
          ) : (valuation.data?.assets || []).length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                Aucun actif dans votre portefeuille
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Allez à "Mon Portefeuille" pour ajouter des cryptos
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Symbole
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                      24h
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(valuation.data?.assets || []).map((asset) => (
                    <tr
                      key={asset.symbol}
                      className="hover:bg-card/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {asset.symbol}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                        {formatCryptoAmount(asset.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                        {formatCurrency(asset.current_price, currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-foreground">
                        {formatCurrency(asset.total_value, currency)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-medium flex items-center justify-end gap-1 ${getChangeColor(
                          asset.change_24h,
                        )}`}
                      >
                        {asset.change_24h > 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        {formatPercentage(asset.change_24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Diversification Chart */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Diversification</h3>

          {diversification.loading ? (
            <CardSkeleton />
          ) : diversification.error ? (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-red-500 text-sm">
                {diversification.error.message}
              </p>
            </div>
          ) : (chartData || []).length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground text-sm">
                Aucune donnée disponible
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-4 space-y-2">
                {chartData.map((item, idx) => {
                  const diversItem = diversification.data?.[idx];
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

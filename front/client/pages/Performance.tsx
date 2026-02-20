import { useState } from "react";
import { Save } from "lucide-react";
import { portfolioAPI } from "@/lib/api";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  getChangeColor,
} from "@/lib/format";
import { useApi, useMutation } from "@/hooks/useApi";
import { CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

type Period = 7 | 14 | 30;

export function Performance() {
  const [period, setPeriod] = useState<Period>(7);

  // Fetch performance history
  const history = useApi(() => portfolioAPI.getHistory(period), [period]);

  // Save snapshot mutation
  const saveSnapshot = useMutation(() => portfolioAPI.saveSnapshot(), {
    onSuccess: (result: any) => {
      toast.success(
        `Snapshot enregistré: ${formatCurrency(result.value, "USD")}`,
      );
      history.refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSaveSnapshot = async () => {
    await saveSnapshot.mutate();
  };

  // Prepare chart data
  const chartData = (history.data?.data || []).map((entry) => ({
    timestamp: entry.timestamp,
    date: format(new Date(entry.timestamp), "dd MMM", { locale: undefined }),
    value: entry.value,
  }));

  const formatChartValue = (value: any) => {
    return `$${parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Historique de Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez l'évolution de votre portefeuille
          </p>
        </div>
        <button
          onClick={handleSaveSnapshot}
          disabled={saveSnapshot.loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Save size={18} />
          <span className="hidden sm:inline">Enregistrer un snapshot</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {([7, 14, 30] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p} jours
          </button>
        ))}
      </div>

      {/* Summary Card */}
      {history.loading ? (
        <CardSkeleton />
      ) : history.error ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
          <p className="text-red-500">{history.error.message}</p>
          <button
            onClick={() => history.refetch()}
            className="text-primary hover:underline"
          >
            Réessayer
          </button>
        </div>
      ) : (history.data?.data || []).length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground text-lg">
            Aucun historique disponible
          </p>
          <p className="text-sm text-muted-foreground">
            Enregistrez votre premier snapshot pour commencer le suivi
          </p>
          <button
            onClick={handleSaveSnapshot}
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Enregistrer un snapshot
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Period Card */}
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-muted-foreground text-sm">Période</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {period} jours
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {history.data?.start_date && history.data?.end_date
                  ? `Du ${formatDate(history.data.start_date, "short")} au ${formatDate(
                      history.data.end_date,
                      "short",
                    )}`
                  : "-"}
              </p>
            </div>

            {/* Data Points Card */}
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-muted-foreground text-sm">Points de données</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {history.data?.data?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Enregistrements disponibles
              </p>
            </div>

            {/* Change Card */}
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-muted-foreground text-sm">Variation</p>
              <p
                className={`text-2xl font-bold mt-1 ${getChangeColor(
                  history.data?.percentage_change || 0,
                )}`}
              >
                {formatPercentage(history.data?.percentage_change || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {history.data?.total_change && history.data.total_change !== 0
                  ? formatCurrency(history.data.total_change, "USD")
                  : "-"}
              </p>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Évolution de la valeur
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatChartValue}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value) => formatChartValue(value)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

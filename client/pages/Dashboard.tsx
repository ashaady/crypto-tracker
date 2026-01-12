import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfolioAPI } from '@/lib/api/portfolio';
import { alertsAPI } from '@/lib/api/alerts';
import { marketAPI } from '@/lib/api/market';
import { ValueCard } from '@/components/ValueCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryData {
  name: string;
  value: number;
}

interface DiversificationData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [historyDays, setHistoryDays] = useState(7);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [diversificationData, setDiversificationData] = useState<DiversificationData[]>([]);

  // Fetch valuation
  const { data: valuation = { total_value: 0, currency: selectedCurrency, change_24h: 0 }, isLoading: valuationLoading, refetch: refetchValuation } = useQuery({
    queryKey: ['valuation', selectedCurrency],
    queryFn: () => portfolioAPI.getValuation(selectedCurrency),
  });

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: portfolioAPI.getAssets,
  });

  // Fetch history
  useQuery({
    queryKey: ['history', historyDays],
    queryFn: async () => {
      const response = await portfolioAPI.getHistory(historyDays);
      setHistoryData(
        response.data.map((point) => ({
          name: new Date(point.timestamp).toLocaleDateString(),
          value: point.value_usd,
        }))
      );
      return response;
    },
  });

  // Fetch diversification
  useQuery({
    queryKey: ['diversification'],
    queryFn: async () => {
      const response = await portfolioAPI.getDiversification();
      setDiversificationData(
        response.diversification.map((item) => ({
          name: item.symbol,
          value: item.value_usd,
          percentage: item.percentage,
        }))
      );
      return response;
    },
  });

  // Fetch triggered alerts
  const { data: triggeredAlertsResponse = { checked: 0, triggered_alerts: [] } } = useQuery({
    queryKey: ['triggered-alerts'],
    queryFn: async () => {
      const response = await alertsAPI.checkAlerts();
      return response;
    },
  });

  const triggeredAlerts = triggeredAlertsResponse.triggered_alerts || triggeredAlertsResponse.triggered || [];

  // Fetch top cryptos
  const { data: topCryptos = [] } = useQuery({
    queryKey: ['top-cryptos'],
    queryFn: () => marketAPI.getTopCryptos(5),
  });

  const handleRefresh = async () => {
    await refetchValuation();
    toast({
      title: 'Refreshed',
      description: 'Portfolio values updated',
    });
  };

  const handleSaveSnapshot = async () => {
    try {
      await portfolioAPI.saveSnapshot();
      toast({
        title: 'Success',
        description: 'Snapshot saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save snapshot',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back to your crypto portfolio</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={valuationLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ValueCard
          title="Total Portfolio Value"
          value={valuation ? `$${valuation.total_value.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '$0.00'}
          change={valuation?.change_24h}
          currency={selectedCurrency}
        />
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Select Currency
          </p>
          <div className="flex gap-3">
            {['USD', 'EUR', 'FCFA'].map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCurrency === currency
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">
              {triggeredAlerts.length} Alert{triggeredAlerts.length !== 1 ? 's' : ''} Triggered
            </h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              {triggeredAlerts.map((alert: any) => (
                <li key={alert.alert_id || alert.id}>
                  {alert.symbol} reached ${alert.target_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Performance ({historyDays}D)
            </h2>
            <div className="flex gap-2">
              {[1, 7, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setHistoryDays(days)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    historyDays === days
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleSaveSnapshot} variant="outline" className="w-full">
              Save Current Snapshot
            </Button>
          </div>
        </div>

        {/* Diversification Chart */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Portfolio Diversification
          </h2>
          {diversificationData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={diversificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {diversificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {diversificationData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground">{item.percentage.toFixed(1)}%</div>
                      <div className="text-muted-foreground text-xs">
                        ${item.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No assets in portfolio
            </div>
          )}
        </div>
      </div>

      {/* Top Cryptos */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Top 5 Cryptocurrencies
        </h2>
        {topCryptos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">24h Change</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {topCryptos.map((crypto) => (
                  <tr key={crypto.symbol} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-foreground">{crypto.rank}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-foreground font-medium">{crypto.name}</div>
                        <div className="text-muted-foreground text-xs">{crypto.symbol}</div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      ${crypto.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${crypto.change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {crypto.change_24h >= 0 ? '+' : ''}{crypto.change_24h.toFixed(2)}%
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      ${crypto.market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Loading top cryptocurrencies...
          </div>
        )}
      </div>

      {/* Assets Summary */}
      {assets.length > 0 && valuation && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Assets ({assets.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Value</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const valuationAsset = valuation.assets?.find((v: any) => v.id === asset.id);
                  return (
                    <tr key={asset.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">{asset.symbol}</td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {asset.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">
                        ${valuationAsset?.current_price?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? 'N/A'}
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">
                        ${valuationAsset?.value_usd?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? 'N/A'}
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${(valuationAsset?.percent_change_24h ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {(valuationAsset?.percent_change_24h ?? 0) >= 0 ? '+' : ''}{(valuationAsset?.percent_change_24h ?? 0).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

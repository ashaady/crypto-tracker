import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioAPI } from '@/lib/api/portfolio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, Loader } from 'lucide-react';

interface HistoryData {
  name: string;
  value: number;
}

export default function History() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState(7);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch history
  const { isLoading, refetch } = useQuery({
    queryKey: ['history', selectedDays],
    queryFn: async () => {
      const data = await portfolioAPI.getHistory(selectedDays);
      setHistoryData(
        data.map((point) => ({
          name: new Date(point.timestamp).toLocaleDateString(),
          value: point.total_value,
        }))
      );
      return data;
    },
    staleTime: 60000,
  });

  const handleSaveSnapshot = async () => {
    setIsSaving(true);
    try {
      await portfolioAPI.saveSnapshot();
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast({
        title: 'Success',
        description: 'Portfolio snapshot saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save snapshot',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateMetrics = () => {
    if (historyData.length < 2) return null;

    const firstValue = historyData[0].value;
    const lastValue = historyData[historyData.length - 1].value;
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;

    return {
      startValue: firstValue,
      endValue: lastValue,
      change,
      percentChange,
      highest: Math.max(...historyData.map((d) => d.value)),
      lowest: Math.min(...historyData.map((d) => d.value)),
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Performance History</h1>
        <p className="text-muted-foreground mt-2">
          Track your portfolio's performance over time
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Select Period</h2>
            <div className="flex gap-3">
              {[1, 7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDays === days
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSaveSnapshot}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Save Snapshot
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Portfolio Value - {selectedDays}D
        </h2>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        ) : historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                formatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) =>
                  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                dot={false}
                strokeWidth={2}
                name="Portfolio Value"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Starting Value
            </p>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.startValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Current Value
            </p>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.endValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`bg-card rounded-lg p-6 border border-border`}>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Change
            </p>
            <p
              className={`text-2xl font-bold ${
                metrics.change >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {metrics.change >= 0 ? '+' : ''}$
              {Math.abs(metrics.change).toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              className={`text-sm mt-1 ${
                metrics.change >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {metrics.percentChange >= 0 ? '+' : ''}
              {metrics.percentChange.toFixed(2)}%
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Highest
                </p>
                <p className="text-lg font-bold text-success">
                  ${metrics.highest.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Lowest
                </p>
                <p className="text-lg font-bold text-destructive">
                  ${metrics.lowest.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">
              Track Your Performance
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Save daily snapshots of your portfolio to track your investment performance over time. The more data points you have, the better insights you'll get.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

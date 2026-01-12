import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsAPI, Alert } from '@/lib/api/alerts';
import { portfolioAPI } from '@/lib/api/portfolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Loader, Bell } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.getAlerts(),
    staleTime: 30000,
  });

  // Fetch assets for symbol suggestions
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: portfolioAPI.getAssets,
    staleTime: 30000,
  });

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !targetPrice.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Target price must be a positive number',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await alertsAPI.createAlert(symbol.toUpperCase(), price, condition);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSymbol('');
      setTargetPrice('');
      setCondition('above');
      toast({
        title: 'Success',
        description: `Alert created for ${symbol.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create alert',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    setIsDeletingId(alertId);
    try {
      await alertsAPI.deleteAlert(alertId);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setDeleteId(null);
      toast({
        title: 'Success',
        description: 'Alert deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCheckAlerts = async () => {
    setIsChecking(true);
    try {
      const response = await alertsAPI.checkAlerts();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      if (response.triggered_alerts.length > 0) {
        toast({
          title: 'Alerts Triggered!',
          description: `${response.triggered_alerts.length} alert(s) have been triggered`,
        });
      } else {
        toast({
          title: 'No alerts triggered',
          description: 'All your price targets are still pending',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check alerts',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Price Alerts</h1>
          <p className="text-muted-foreground mt-2">Set price alerts for your cryptocurrencies</p>
        </div>
        <Button
          onClick={handleCheckAlerts}
          disabled={isChecking}
          className="flex items-center gap-2"
        >
          {isChecking ? <Loader className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Check Alerts
        </Button>
      </div>

      {/* Create Alert Form */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Create New Alert</h2>
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cryptocurrency
              </label>
              <Input
                placeholder="e.g., BTC, ETH, SOL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="uppercase"
                disabled={isCreating}
              />
              {assets.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your assets: {assets.map((a) => a.symbol).join(', ')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Price (USD)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                step="0.01"
                min="0"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Condition
              </label>
              <Select value={condition} onValueChange={(v) => setCondition(v as 'above' | 'below')} disabled={isCreating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Alert
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Alerts List */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Active Alerts {alerts.length > 0 && `(${alerts.length})`}
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No alerts set yet
            </p>
            <p className="text-sm text-muted-foreground">
              Create an alert above to get notifications when prices reach your targets
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-foreground font-semibold">{alert.symbol}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            alert.status === 'active'
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {alert.status === 'active' ? '🟢 Active' : '🟡 Triggered'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Alert when price goes{' '}
                        <span className="font-medium text-foreground">
                          {alert.condition === 'above' ? 'above' : 'below'}
                        </span>{' '}
                        ${alert.target_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(alert.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alert? You can always create a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteAlert(deleteId)}
              disabled={isDeletingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingId === deleteId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

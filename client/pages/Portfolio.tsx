import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { portfolioAPI, Asset } from "@/lib/api/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const POPULAR_CRYPTOS = [
  "BTC",
  "ETH",
  "ADA",
  "SOL",
  "XRP",
  "DOT",
  "DOGE",
  "LINK",
  "MATIC",
  "ATOM",
];

export default function Portfolio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // Fetch assets
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["assets"],
    queryFn: portfolioAPI.getAssets,
    staleTime: 30000,
  });

  // Fetch valuation data for prices
  const { data: valuation, isLoading: isLoadingValuation } = useQuery({
    queryKey: ["valuation"],
    queryFn: () => portfolioAPI.getValuation(),
    staleTime: 30000,
  });

  const isLoading = isLoadingAssets || isLoadingValuation;

  // Enrich assets with pricing data from valuation
  const assetsWithPrices = assets.map((asset) => {
    const valuationAsset = valuation?.assets?.find(
      (v: any) => v.id === asset.id,
    );
    return {
      ...asset,
      current_price: valuationAsset?.current_price,
      total_value: valuationAsset?.value_usd,
      change_24h: valuationAsset?.percent_change_24h,
    };
  });

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !amount.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await portfolioAPI.addAsset(symbol.toUpperCase(), parsedAmount);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["valuation"] });
      queryClient.invalidateQueries({ queryKey: ["diversification"] });
      setSymbol("");
      setAmount("");
      toast({
        title: "Success",
        description: `Added ${symbol.toUpperCase()} to your portfolio`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add asset",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    setIsDeletingId(assetId);
    try {
      await portfolioAPI.deleteAsset(assetId);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["valuation"] });
      queryClient.invalidateQueries({ queryKey: ["diversification"] });
      setDeleteId(null);
      toast({
        title: "Success",
        description: "Asset removed from portfolio",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Portfolio</h1>
        <p className="text-muted-foreground mt-2">
          Manage your cryptocurrency assets
        </p>
      </div>

      {/* Add Asset Form */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Add New Asset
        </h2>
        <form onSubmit={handleAddAsset} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cryptocurrency Symbol
              </label>
              <Input
                placeholder="e.g., BTC, ETH, SOL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="uppercase"
                disabled={isAdding}
              />
              {symbol && !POPULAR_CRYPTOS.includes(symbol) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Not a common crypto, but will try to add
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00000001"
                min="0"
                disabled={isAdding}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Asset
              </Button>
            </div>
          </div>

          {/* Popular Cryptos */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Popular cryptocurrencies:
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CRYPTOS.map((crypto) => (
                <button
                  key={crypto}
                  type="button"
                  onClick={() => setSymbol(crypto)}
                  className="px-3 py-1 text-xs rounded bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  {crypto}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Assets Table */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Assets {assets.length > 0 && `(${assets.length})`}
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading assets...
          </div>
        ) : assetsWithPrices.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No assets in your portfolio yet
            </p>
            <p className="text-sm text-muted-foreground">
              Add your first cryptocurrency above to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Symbol
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Current Price
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Total Value
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    24h Change
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {assetsWithPrices.map((asset) => {
                  const amount = asset.amount ?? 0;
                  const currentPrice = asset.current_price ?? 0;
                  const totalValue = asset.total_value ?? 0;
                  const change24h = asset.change_24h ?? 0;

                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-foreground font-semibold">
                            {asset.symbol}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 text-foreground">
                        {amount.toLocaleString("en-US", {
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="text-right py-4 px-4 text-foreground">
                        $
                        {currentPrice.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-4 px-4 text-foreground font-semibold">
                        $
                        {totalValue.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`text-right py-4 px-4 font-semibold ${change24h >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {change24h >= 0 ? "+" : ""}
                        {change24h.toFixed(2)}%
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setDeleteId(asset.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this asset from your portfolio?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteAsset(deleteId)}
              disabled={isDeletingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingId === deleteId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

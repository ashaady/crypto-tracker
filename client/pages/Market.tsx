import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketAPI } from '@/lib/api/market';
import { portfolioAPI } from '@/lib/api/portfolio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader, TrendingUp } from 'lucide-react';

export default function Market() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingSymbols, setAddingSymbols] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(10);

  // Fetch top cryptos
  const { data: topCryptos = [], isLoading } = useQuery({
    queryKey: ['top-cryptos', limit],
    queryFn: () => marketAPI.getTopCryptos(limit),
    staleTime: 60000,
  });

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      setAddingSymbols((prev) => new Set(prev).add(symbol));
      await portfolioAPI.addAsset(symbol, 1);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['valuation'] });
      queryClient.invalidateQueries({ queryKey: ['diversification'] });
      toast({
        title: 'Success',
        description: `Added 1 ${symbol} to your portfolio. Edit the amount in your Portfolio page.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to add ${symbol}. It may already be in your portfolio.`,
        variant: 'destructive',
      });
    } finally {
      setAddingSymbols((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Market</h1>
        <p className="text-muted-foreground mt-2">
          Explore the top cryptocurrencies and add them to your portfolio
        </p>
      </div>

      {/* Limit Selector */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Show Top Cryptos
            </h2>
            <div className="flex gap-3">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => setLimit(count)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    limit === count
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  Top {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cryptos Table */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Top Cryptocurrencies by Market Cap
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading cryptocurrencies...
          </div>
        ) : topCryptos.length === 0 ? (
          <div className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No cryptocurrencies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">24h Change</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Market Cap</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {topCryptos.map((crypto, index) => {
                  const currentPrice = crypto.current_price ?? 0;
                  const change24h = crypto.change_24h ?? 0;
                  const marketCap = crypto.market_cap ?? 0;
                  const name = crypto.name ?? 'Unknown';

                  return (
                    <tr
                      key={crypto.symbol}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-foreground font-medium">#{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="text-foreground font-semibold">{name}</div>
                      </td>
                      <td className="py-4 px-4 text-foreground font-medium">{crypto.symbol}</td>
                      <td className="text-right py-4 px-4 text-foreground">
                        ${currentPrice.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`text-right py-4 px-4 font-semibold ${
                          change24h >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {change24h >= 0 ? '+' : ''}
                        {change24h.toFixed(2)}%
                      </td>
                      <td className="text-right py-4 px-4 text-foreground">
                        ${marketCap.toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="text-center py-4 px-4">
                        <Button
                          onClick={() => handleAddToPortfolio(crypto.symbol)}
                          disabled={addingSymbols.has(crypto.symbol)}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {addingSymbols.has(crypto.symbol) ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">
              Quick Add Feature
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click the "Add" button to quickly add a cryptocurrency to your portfolio with an initial amount of 1 unit. You can edit the amount in your Portfolio page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

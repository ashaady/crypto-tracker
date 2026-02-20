import { useState, useEffect } from "react";
import { Plus, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { marketAPI, portfolioAPI } from "@/lib/api";
import {
  formatCurrency,
  formatLargeNumber,
  formatPercentage,
  getChangeColor,
} from "@/lib/format";
import { useApi, useMutation } from "@/hooks/useApi";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AddCryptoModal } from "@/components/ui/add-crypto-modal";
import { toast } from "sonner";
import type { CryptoMarketInfo } from "@/lib/types";

export function TopCryptos() {
  const [limit, setLimit] = useState(10);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(60);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoMarketInfo | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch top cryptos
  const topCryptos = useApi(() => marketAPI.getTopCryptos(limit), [limit]);

  // Add to portfolio mutation
  const addToPortfolio = useMutation(
    (amount: number) =>
      portfolioAPI.addAsset(selectedCrypto?.symbol || "", amount),
    {
      onSuccess: () => {
        toast.success(`${selectedCrypto?.symbol} ajouté au portefeuille`);
        setModalOpen(false);
        setSelectedCrypto(null);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    },
  );

  // Auto-refresh timer
  useEffect(() => {
    if (!refreshInterval) return;

    const timer = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          topCryptos.refetch();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, topCryptos]);

  const handleRefresh = async () => {
    await topCryptos.refetch();
    setNextRefreshIn(refreshInterval || 60);
  };

  const handleAddClick = (crypto: CryptoMarketInfo) => {
    setSelectedCrypto(crypto);
    setModalOpen(true);
  };

  const handleAddToPortfolio = async (amount: number) => {
    await addToPortfolio.mutate(amount);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setNextRefreshIn(refreshInterval || 60);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Top Cryptos du Marché
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les cryptos les plus importantes
          </p>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto">
          {/* Limit Selector */}
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={topCryptos.loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw
              size={18}
              className={topCryptos.loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {refreshInterval && (
        <div className="text-xs text-primary text-center">
          Mise à jour automatique dans {nextRefreshIn}s
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {topCryptos.loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : topCryptos.error ? (
          <div className="p-6 text-center">
            <p className="text-red-500">{topCryptos.error.message}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 text-primary hover:underline"
            >
              Réessayer
            </button>
          </div>
        ) : (topCryptos.data || []).length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              Aucune donnée disponible
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground w-12">
                    Rang
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Variation 24h
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Market Cap
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Array.isArray(topCryptos.data) ? topCryptos.data : []).map(
                  (crypto) => (
                    <tr
                      key={crypto.rank}
                      className="hover:bg-card/50 transition-colors"
                    >
                      {/* Rank Badge */}
                      <td className="px-6 py-4 text-sm font-semibold">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {crypto.rank}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {crypto.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {crypto.symbol}
                          </p>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm text-right font-medium text-foreground">
                        {formatCurrency(crypto.price, "USD")}
                      </td>

                      {/* Change 24h */}
                      <td
                        className={`px-6 py-4 text-sm text-right font-medium flex items-center justify-end gap-1 ${getChangeColor(
                          crypto.change_24h,
                        )}`}
                      >
                        {crypto.change_24h > 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        {formatPercentage(crypto.change_24h)}
                      </td>

                      {/* Market Cap */}
                      <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                        {formatLargeNumber(crypto.market_cap)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleAddClick(crypto)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="Ajouter au portefeuille"
                        >
                          <Plus size={18} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Crypto Modal */}
      <AddCryptoModal
        isOpen={modalOpen}
        cryptoName={selectedCrypto?.name || "Crypto"}
        onClose={() => {
          setModalOpen(false);
          setSelectedCrypto(null);
        }}
        onAdd={handleAddToPortfolio}
        isLoading={addToPortfolio.loading}
      />
    </div>
  );
}

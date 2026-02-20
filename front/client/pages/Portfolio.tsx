import { useState } from "react";
import { Trash2 } from "lucide-react";
import { portfolioAPI } from "@/lib/api";
import { formatDate, formatCryptoAmount } from "@/lib/format";
import { useApi, useMutation } from "@/hooks/useApi";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export function Portfolio() {
  const [formData, setFormData] = useState({ symbol: "", amount: "" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch assets
  const assets = useApi(() => portfolioAPI.getAssets(), []);

  // Delete asset mutation
  const deleteAsset = useMutation(
    (assetId: string) => portfolioAPI.deleteAsset(assetId),
    {
      onSuccess: () => {
        toast.success("Actif supprimé avec succès");
        assets.refetch();
        setConfirmDelete(null);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    },
  );

  // Add asset mutation
  const addAsset = useMutation(
    () => portfolioAPI.addAsset(formData.symbol, parseFloat(formData.amount)),
    {
      onSuccess: () => {
        toast.success("Actif ajouté avec succès");
        setFormData({ symbol: "", amount: "" });
        setFormErrors({});
        assets.refetch();
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    },
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.symbol.trim()) {
      errors.symbol = "Le symbole est obligatoire";
    } else if (formData.symbol.trim().length < 2) {
      errors.symbol = "Le symbole doit contenir au moins 2 caractères";
    }

    if (!formData.amount) {
      errors.amount = "La quantité est obligatoire";
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = "La quantité doit être supérieure à 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await addAsset.mutate();
  };

  const handleDeleteClick = (assetId: string) => {
    setConfirmDelete(assetId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteAsset.mutate(confirmDelete);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Portefeuille</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos actifs cryptographiques
        </p>
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Asset Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              Ajouter un actif
            </h2>

            <form onSubmit={handleAddAsset} className="space-y-4">
              {/* Symbol Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Symbole
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => {
                    setFormData({ ...formData, symbol: e.target.value });
                    if (formErrors.symbol) {
                      setFormErrors({ ...formErrors, symbol: "" });
                    }
                  }}
                  placeholder="BTC, ETH, SOL..."
                  disabled={addAsset.loading}
                  className={`w-full px-3 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                    formErrors.symbol ? "border-red-500" : "border-border"
                  }`}
                />
                {formErrors.symbol && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.symbol}
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantité
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (formErrors.amount) {
                      setFormErrors({ ...formErrors, amount: "" });
                    }
                  }}
                  placeholder="0.000001"
                  step="0.000001"
                  min="0"
                  disabled={addAsset.loading}
                  className={`w-full px-3 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                    formErrors.amount ? "border-red-500" : "border-border"
                  }`}
                />
                {formErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.amount}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  addAsset.loading || !formData.symbol || !formData.amount
                }
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center justify-center gap-2"
              >
                <span>➕</span>
                Ajouter au portefeuille
              </button>
            </form>
          </div>
        </div>

        {/* Assets List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Liste des actifs
          </h2>

          {assets.loading ? (
            <TableSkeleton />
          ) : assets.error ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-red-500">{assets.error.message}</p>
              <button
                onClick={() => assets.refetch()}
                className="mt-4 text-primary hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : (assets.data || []).length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground text-lg">
                Aucun actif dans votre portefeuille
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Utilisez le formulaire à gauche pour ajouter votre première
                crypto
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
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
                        Date d'ajout
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(assets.data || []).map((asset) => (
                      <tr
                        key={asset.id}
                        className="hover:bg-card/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {asset.symbol}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                          {formatCryptoAmount(asset.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                          {formatDate(asset.added_date)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteClick(asset.id)}
                            disabled={deleteAsset.loading}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Supprimer cet actif ?"
        message="Êtes-vous sûr de vouloir supprimer cet actif ? Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDangerous={true}
        isLoading={deleteAsset.loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

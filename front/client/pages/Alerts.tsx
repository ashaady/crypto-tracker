import { useState } from "react";
import { Trash2, CheckCircle } from "lucide-react";
import { alertsAPI } from "@/lib/api";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/format";
import { useApi, useMutation } from "@/hooks/useApi";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { Alert } from "@/lib/types";

type AlertStatus = "all" | "active" | "triggered";

interface CheckResult {
  total_checked: number;
  triggered_count: number;
  triggered_alerts: (Alert & { current_price: number })[];
}

export function Alerts() {
  const [status, setStatus] = useState<AlertStatus>("all");
  const [formData, setFormData] = useState({
    symbol: "",
    target_price: "",
    condition: "above" as const,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch alerts
  const alerts = useApi(
    () => alertsAPI.getAlerts(status === "all" ? undefined : status),
    [status],
  );

  // Delete alert mutation
  const deleteAlert = useMutation(
    (alertId: string) => alertsAPI.deleteAlert(alertId),
    {
      onSuccess: () => {
        toast.success("Alerte supprimée");
        alerts.refetch();
        setConfirmDelete(null);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    },
  );

  // Create alert mutation
  const createAlert = useMutation(
    () =>
      alertsAPI.createAlert(
        formData.symbol,
        parseFloat(formData.target_price),
        formData.condition,
      ),
    {
      onSuccess: () => {
        toast.success("Alerte créée avec succès");
        setFormData({ symbol: "", target_price: "", condition: "above" });
        setFormErrors({});
        alerts.refetch();
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    },
  );

  // Check alerts mutation
  const checkAlerts = useMutation(() => alertsAPI.checkAlerts(), {
    onSuccess: (result: any) => {
      setCheckResult(result);
      toast.success(
        `${result.total_checked} alertes vérifiées, ${result.triggered_count} déclenchées`,
      );
      alerts.refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.symbol.trim()) {
      errors.symbol = "Le symbole est obligatoire";
    } else if (formData.symbol.trim().length < 2) {
      errors.symbol = "Le symbole doit contenir au moins 2 caractères";
    }

    if (!formData.target_price) {
      errors.target_price = "Le prix cible est obligatoire";
    } else if (parseFloat(formData.target_price) < 0.01) {
      errors.target_price = "Le prix doit être au moins 0.01";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await createAlert.mutate();
  };

  const getStatusBadge = (alertStatus: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium";
    switch (alertStatus) {
      case "active":
        return `${baseClass} bg-green-500/20 text-green-400`;
      case "triggered":
        return `${baseClass} bg-red-500/20 text-red-400`;
      case "cancelled":
        return `${baseClass} bg-gray-500/20 text-gray-400`;
      default:
        return `${baseClass} bg-gray-500/20 text-gray-400`;
    }
  };

  const getStatusLabel = (alertStatus: string) => {
    switch (alertStatus) {
      case "active":
        return "Active";
      case "triggered":
        return "Déclenchée";
      case "cancelled":
        return "Annulée";
      default:
        return alertStatus;
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition === "above" ? "Au-dessus de" : "En-dessous de";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Alertes de Prix
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez des alertes pour surveiller les prix
          </p>
        </div>
        <button
          onClick={() => checkAlerts.mutate()}
          disabled={checkAlerts.loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle size={18} />
          <span className="hidden sm:inline">Vérifier toutes</span>
        </button>
      </div>

      {/* Check Results */}
      {checkResult &&
        Array.isArray(checkResult.triggered_alerts) &&
        checkResult.triggered_alerts.length > 0 && (
          <div className="bg-card border border-red-500/30 rounded-lg p-6 space-y-4">
            <h2 className="font-bold text-foreground">Alertes Déclenchées</h2>
            <div className="space-y-3">
              {checkResult.triggered_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-background rounded"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {alert.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prix: {formatCurrency(alert.current_price, "USD")} (
                      {getConditionLabel(alert.condition)}{" "}
                      {formatCurrency(alert.target_price, "USD")})
                    </p>
                  </div>
                  <span className="text-red-500 text-sm font-medium">
                    DÉCLENCHÉ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Alert Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              Créer une alerte
            </h2>

            <form onSubmit={handleCreateAlert} className="space-y-4">
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
                  placeholder="BTC"
                  disabled={createAlert.loading}
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

              {/* Target Price Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prix cible
                </label>
                <input
                  type="number"
                  value={formData.target_price}
                  onChange={(e) => {
                    setFormData({ ...formData, target_price: e.target.value });
                    if (formErrors.target_price) {
                      setFormErrors({ ...formErrors, target_price: "" });
                    }
                  }}
                  placeholder="50000"
                  step="0.01"
                  min="0"
                  disabled={createAlert.loading}
                  className={`w-full px-3 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                    formErrors.target_price ? "border-red-500" : "border-border"
                  }`}
                />
                {formErrors.target_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.target_price}
                  </p>
                )}
              </div>

              {/* Condition Select */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: e.target.value as "above" | "below",
                    })
                  }
                  disabled={createAlert.loading}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="above">Au-dessus de</option>
                  <option value="below">En-dessous de</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  createAlert.loading ||
                  !formData.symbol ||
                  !formData.target_price
                }
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center justify-center gap-2"
              >
                <span>🔔</span>
                Créer l'alerte
              </button>
            </form>
          </div>
        </div>

        {/* Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "triggered"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all"
                  ? "Toutes"
                  : s === "active"
                    ? "Actives"
                    : "Déclenchées"}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-bold text-foreground">Alertes</h2>

          {alerts.loading ? (
            <TableSkeleton />
          ) : alerts.error ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-red-500">{alerts.error.message}</p>
              <button
                onClick={() => alerts.refetch()}
                className="mt-4 text-primary hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : (alerts.data || []).length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground text-lg">Aucune alerte</p>
              <p className="text-sm text-muted-foreground mt-2">
                Créez une alerte avec le formulaire à gauche
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
                        Prix cible
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-muted-foreground">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(alerts.data || []).map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-card/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {alert.symbol}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                          {formatCurrency(alert.target_price, "USD")}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                          {getConditionLabel(alert.condition)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={getStatusBadge(alert.status)}>
                            {getStatusLabel(alert.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-muted-foreground">
                          {formatDate(alert.created_date)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setConfirmDelete(alert.id)}
                            disabled={deleteAlert.loading}
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
        title="Supprimer cette alerte ?"
        message="Êtes-vous sûr de vouloir supprimer cette alerte ? Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDangerous={true}
        isLoading={deleteAlert.loading}
        onConfirm={() => {
          if (confirmDelete) deleteAlert.mutate(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

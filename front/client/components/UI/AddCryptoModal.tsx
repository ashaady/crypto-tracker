import { useState } from "react";
import { X } from "lucide-react";

interface AddCryptoModalProps {
  isOpen: boolean;
  cryptoName?: string;
  onClose: () => void;
  onAdd: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export function AddCryptoModal({
  isOpen,
  cryptoName = "Crypto",
  onClose,
  onAdd,
  isLoading = false,
}: AddCryptoModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setError("Veuillez entrer une quantité valide");
      return;
    }

    try {
      await onAdd(numAmount);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-sm mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground pr-8">
            Ajouter {cryptoName} au portefeuille
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantité
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0.00000000"
                step="0.000001"
                min="0"
                disabled={isLoading}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !amount}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? "..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

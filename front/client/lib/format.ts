import type { Currency } from "./types";

/**
 * Format currency based on currency type
 * USD/EUR: 2 decimals, FCFA: 0 decimals
 */
export function formatCurrency(value: number, currency: Currency): string {
  const decimals = currency === "FCFA" ? 0 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "FCFA" ? "XOF" : currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format crypto quantity (up to 8 decimals)
 */
export function formatCryptoAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

/**
 * Format percentage change with sign and color indication
 */
export function formatPercentage(
  value: number | undefined | null,
  decimals = 2,
): string {
  if (value === undefined || value === null) {
    return "0%";
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, M, B suffixes (for market cap)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" = "short",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Get color classes based on value
 */
export function getChangeColor(value: number): string {
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-gray-400";
}

export function getChangeBgColor(value: number): string {
  if (value > 0) return "bg-green-500/10";
  if (value < 0) return "bg-red-500/10";
  return "bg-gray-500/10";
}

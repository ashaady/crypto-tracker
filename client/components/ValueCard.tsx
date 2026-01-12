import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueCardProps {
  title: string;
  value: string;
  change?: number;
  currency?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const ValueCard = ({
  title,
  value,
  change,
  currency = 'USD',
  icon,
  onClick,
}: ValueCardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg p-6 border border-border',
        onClick && 'cursor-pointer hover:border-primary/50 transition-colors'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {currency && (
              <span className="text-sm text-muted-foreground">{currency}</span>
            )}
          </div>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          {isPositive ? (
            <>
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                +{change.toFixed(2)}%
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {change.toFixed(2)}%
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

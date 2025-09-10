import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: 'online' | 'offline' | 'warning' | 'charging';
  label: string;
  value?: string | number;
  pulse?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, label, value, pulse = false }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400';
      case 'offline':
        return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'charging':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'glass border px-3 py-1.5 font-medium transition-smooth flex items-center gap-2',
        getStatusStyles(status),
        pulse && 'animate-pulse'
      )}
    >
      <div 
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'online' && 'bg-green-500',
          status === 'offline' && 'bg-red-500',
          status === 'warning' && 'bg-yellow-500',
          status === 'charging' && 'bg-blue-500'
        )}
      />
      <span className="text-xs font-semibold">
        {label}
        {value && `: ${value}`}
      </span>
    </Badge>
  );
};

export default StatusChip;
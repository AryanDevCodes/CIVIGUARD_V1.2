import React from 'react';
import { Badge } from '@/components/ui/badge';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export type StatusVariant = BadgeVariant;

// Map status to Badge variant
const statusToVariant: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  IN_REVIEW: 'secondary',
  IN_PROGRESS: 'default',
  RESOLVED: 'default',
  REJECTED: 'destructive',
  CONVERTED: 'outline',
  HIGH: 'destructive',
  CRITICAL: 'destructive',
  MEDIUM: 'default',
  LOW: 'secondary',
} as const;

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className = '',
}) => {
  // Format status text
  let displayText = status === 'IN_PROGRESS' 
    ? 'In Progress' 
    : status
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
  
  // Shorten if too long
  if (displayText.length > 12) {
    displayText = displayText
      .split(' ')
      .map(word => word[0])
      .join('');
  }

  // Determine badge variant
  const badgeVariant = variant || statusToVariant[status.toUpperCase()] || 'default';

  return (
    <Badge 
      variant={badgeVariant}
      className={className}
      title={status.replace(/_/g, ' ')}
    >
      {displayText}
    </Badge>
  );
};

export default StatusBadge;

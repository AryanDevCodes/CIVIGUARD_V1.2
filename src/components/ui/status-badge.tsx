import React from "react";
import { Badge } from "@/components/ui/badge";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let colorProps = {};
  let label = status || '';

  // Defensive: If status is null/undefined, show fallback badge
  if (!status) {
    return <Badge className={`bg-gray-100 text-gray-700 border-gray-200 ${className || ''}`}>Unknown</Badge>;
  }

  switch (status.toLowerCase()) {
    case "active":
      colorProps = { className: `bg-green-100 text-green-800 border-green-200 ${className || ''}` };
      label = "Active";
      break;
    case "pending":
      colorProps = { className: `bg-amber-50 text-amber-700 border-amber-200 ${className || ''}` };
      label = "Pending";
      break;
    case "suspended":
      colorProps = { className: `bg-red-100 text-red-800 border-red-200 ${className || ''}` };
      label = "Suspended";
      break;
    case "reviewing":
      colorProps = { className: `bg-amber-50 text-amber-700 border-amber-200 ${className || ''}` };
      label = "Under Review";
      break;
    case "in-progress":
      colorProps = { className: `bg-blue-50 text-blue-700 border-blue-200 ${className || ''}` };
      label = "In Progress";
      break;
    case "resolved":
      colorProps = { className: `bg-green-50 text-green-700 border-green-200 ${className || ''}` };
      label = "Resolved";
      break;
    default:
      colorProps = { className: `${className || ''}` };
      label = status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <Badge variant="outline" {...colorProps}>
      {label}
    </Badge>
  );
};

export default StatusBadge;

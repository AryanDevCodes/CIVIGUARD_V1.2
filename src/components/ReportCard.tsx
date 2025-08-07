import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Report } from '@/types/report';

interface ReportCardProps {
  report: Report;
  onViewDetails: () => void;
  onConvert: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onViewDetails, onConvert }) => {
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'outline';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {report.title}
          </CardTitle>
          <Badge 
            variant={getStatusBadgeVariant(report.status)}
            className="whitespace-nowrap ml-2"
          >
            {report.status.split('_').map(word => 
              word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ')}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(report.createdAt), 'PPpp')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <span className="font-medium mr-2">Type:</span>
            <span className="capitalize">{report.type.toLowerCase()}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-medium mr-2">Priority:</span>
            <Badge variant={getPriorityVariant(report.priority)}>
              {report.priority.charAt(0) + report.priority.slice(1).toLowerCase()}
            </Badge>
          </div>
          {report.location && (
            <div className="text-sm">
              <span className="font-medium">Location:</span> {report.location}
            </div>
          )}
          <div className="pt-2 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onConvert}
            >
              Convert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;

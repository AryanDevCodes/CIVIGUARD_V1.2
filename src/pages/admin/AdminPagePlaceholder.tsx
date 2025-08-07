
import React, { ReactNode } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface AdminPagePlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

const AdminPagePlaceholder: React.FC<AdminPagePlaceholderProps> = ({ 
  title, 
  description,
  icon
}) => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="text-center p-12 border rounded-xl bg-white">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            {icon}
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">
            This admin page is currently under development and will be available soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPagePlaceholder;

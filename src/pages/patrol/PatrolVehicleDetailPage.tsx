import React from 'react';
import { PatrolVehicleDetail } from '@/components/patrol/PatrolVehicleDetail';
import DashboardLayout from '@/components/DashboardLayout';

export const PatrolVehicleDetailPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <PatrolVehicleDetail />
      </div>
    </DashboardLayout>
  );
};

export default PatrolVehicleDetailPage;

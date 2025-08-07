import React from 'react';
import { PatrolVehicleList } from '@/components/patrol/PatrolVehicleList';

export const PatrolVehiclesPage: React.FC = () => {
  return (
      <div className="container mx-auto py-6">
        <PatrolVehicleList />
      </div>
  );
};

export default PatrolVehiclesPage;

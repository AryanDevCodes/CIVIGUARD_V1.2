
import React from 'react';

const DemoPieChart = ({ className }: { className?: string }) => (
  <div className={`${className} relative h-40 w-40 mx-auto mt-4`}>
    <div className="absolute inset-0 rounded-full border-8 border-primary/80"></div>
    <div className="absolute inset-0 rounded-full border-8 border-secondary/70 border-t-transparent border-r-transparent"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold">68%</div>
        <div className="text-xs text-muted-foreground">Resolution</div>
      </div>
    </div>
  </div>
);

export default DemoPieChart;


import React from 'react';

const DemoBarChart = ({ className }: { className?: string }) => (
  <div className={`${className} flex items-end justify-between h-40 mt-2`}>
    {[40, 25, 60, 75, 45, 65, 55, 30, 70, 50, 80, 60].map((value, i) => (
      <div 
        key={i} 
        className="bg-primary/80 rounded-t w-full mx-0.5" 
        style={{ height: `${value}%` }}
      ></div>
    ))}
  </div>
);

export default DemoBarChart;

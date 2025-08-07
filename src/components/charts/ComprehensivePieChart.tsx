import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Types for the data
export interface PieChartData {
  [key: string]: any;
  label?: string;
  value?: number;
}

interface ComprehensivePieChartProps {
  /**
   * Data to display in the chart
   */
  data: PieChartData[];
  /**
   * Key in the data objects to use for the pie labels
   */
  labelKey: string;
  /**
   * Key in the data objects to use for the value
   */
  valueKey: string;
  /**
   * Chart title
   */
  title?: string;
  /**
   * Optional: Custom colors for slices
   */
  colors?: string[];
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error message
   */
  error?: string | null;
}

const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#e11d48', '#3b82f6'];

const ComprehensivePieChart: React.FC<ComprehensivePieChartProps> = ({
  data = [],
  labelKey,
  valueKey,
  title,
  colors = defaultColors,
  loading = false,
  error = null,
}) => {

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{title}</h2>}
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-red-600">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={labelKey}
              outerRadius="80%"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ComprehensivePieChart;

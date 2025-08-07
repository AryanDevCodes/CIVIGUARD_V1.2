import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Types for the data
export interface BarChartData {
  [key: string]: any;
  label?: string;
  value?: number;
}

interface ComprehensiveBarChartProps {
  /**
   * Data to display in the chart
   */
  data: BarChartData[];
  /**
   * Key in the data objects to use for the x-axis labels
   */
  labelKey: string;
  /**
   * Key(s) in the data objects to use for the bar values (can be string or array of strings)
   */
  valueKeys: string | string[];
  /**
   * Chart title
   */
  title?: string;
  /**
   * Optional: Custom colors for bars
   */
  barColors?: string[];
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error message
   */
  error?: string | null;
}

const defaultBarColors = ['#6366f1', '#10b981', '#f59e0b', '#e11d48', '#3b82f6'];

const ComprehensiveBarChart: React.FC<ComprehensiveBarChartProps> = ({
  data = [],
  labelKey,
  valueKeys,
  title,
  barColors = defaultBarColors,
  loading = false,
  error = null,
}) => {
  const valueKeysArr = Array.isArray(valueKeys) ? valueKeys : [valueKeys];

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{title}</h2>}
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-red-600">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={labelKey} tick={{ fill: '#4b5563', fontSize: 12 }} interval={0} angle={-15} dy={10} />
            <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: 'none' }} labelStyle={{ color: '#d1d5db' }} />
            <Legend />
            {valueKeysArr.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={barColors[idx % barColors.length]}
                radius={[8, 8, 0, 0]}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ComprehensiveBarChart;

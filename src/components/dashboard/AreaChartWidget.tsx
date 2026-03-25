import { FC } from 'react';

interface IAreaChartWidgetProps {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number }>;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  className?: string;
}

/**
 * AreaChartWidget Component
 * Simple area chart visualization without external dependencies
 * @component
 */
const AreaChartWidget: FC<IAreaChartWidgetProps> = ({
  title,
  subtitle,
  data,
  color = 'blue',
  className = '',
}) => {
  const gradientColors = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#A855F7',
    red: '#EF4444',
    yellow: '#F59E0B',
  };

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between h-24 gap-2 mb-4">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 80;
          return (
            <div
              key={index}
              className="flex-1 group relative"
              title={`${item.name}: ${item.value}`}
            >
              {/* Bar */}
              <div
                className={`w-full transition-all hover:opacity-80 cursor-pointer`}
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: gradientColors[color],
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.7,
                }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {item.name}: {item.value}
              </div>

              {/* Label */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center truncate">
                {item.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(data.reduce((a, b) => a + b.value, 0) / data.length)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {data.reduce((a, b) => a + b.value, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Highest</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.max(...data.map(d => d.value))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AreaChartWidget;

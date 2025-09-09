import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  bgColor,
}: StatsCardProps) {
  return (
    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
      <div className={`flex items-center justify-center w-12 h-12 ${bgColor} rounded-lg mx-auto mb-4`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900" title={title}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
});

export default StatsCard;
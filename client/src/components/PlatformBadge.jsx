import React from 'react';
import { getPlatformBadgeStyle } from '../utils/helpers';

export const PlatformBadge = ({ platform, customPlatformName, size = 'sm' }) => {
  const isOther = platform === 'Other';
  const label = isOther && customPlatformName ? customPlatformName : platform;
  const badgeStyle = getPlatformBadgeStyle(platform);

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'md' 
    ? 'px-3 py-1 text-sm' 
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border ${badgeStyle} ${sizeClasses}`}
    >
      {label}
    </span>
  );
};

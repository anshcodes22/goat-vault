import React from 'react';
import { getDifficultyStyle } from '../utils/helpers';

export const DifficultyBadge = ({ difficulty = 'Medium', size = 'sm' }) => {
  const style = getDifficultyStyle(difficulty);
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'md' 
    ? 'px-3 py-1 text-sm' 
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`} />
      {difficulty}
    </span>
  );
};

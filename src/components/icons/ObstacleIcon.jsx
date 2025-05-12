
import React from 'react';
import { Box } from 'lucide-react';

const ObstacleIcon = ({ className, ...props }) => {
  return <Box className={className} size={32} {...props} />;
};

export default ObstacleIcon;
  
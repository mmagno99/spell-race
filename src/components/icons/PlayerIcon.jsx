
import React from 'react';
import { Smile } from 'lucide-react';

const PlayerIcon = ({ className, ...props }) => {
  return <Smile className={className} size={32} {...props} />;
};

export default PlayerIcon;
  
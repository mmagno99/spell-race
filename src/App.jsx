
import React from 'react';
import Game from '@/components/Game';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4 pixelated-font">
      <Game />
      <Toaster />
    </div>
  );
}

export default App;
  
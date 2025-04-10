'use client';

import { useState } from 'react';
import Spline from '@splinetool/react-spline';

interface SplineBackgroundProps {
  // The URL of your Spline scene
  sceneUrl: string;
  // Optional CSS class names to apply to the container
  className?: string;
}

export function SplineBackground({ sceneUrl, className = '' }: SplineBackgroundProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Optional: Handle when Spline scene is loaded
  const handleLoad = () => {
    setIsLoading(false);
    console.log('Spline scene loaded');
  };

  return (
    <div 
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-pulse text-muted-foreground">Loading 3D scene...</div>
        </div>
      )}
      
      <Spline 
        scene={sceneUrl} 
        onLoad={handleLoad}
        className="w-full h-full"
      />
    </div>
  );
} 
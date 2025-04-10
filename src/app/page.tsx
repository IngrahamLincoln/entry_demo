'use client'; // Mark page as client component to manage state/effects for now

import { useState } from 'react';
import { Feed } from "@/components/feed/Feed";
import { CreateEntryDialog } from "@/components/entry/CreateEntryDialog";
import { SplineBackground } from "@/components/spline/SplineBackground";

export default function Home() {
  // State to potentially trigger feed refresh (simple approach for now)
  const [feedKey, setFeedKey] = useState(Date.now());

  const handleEntryCreated = () => {
    console.log("New entry created, triggering feed refresh...");
    setFeedKey(Date.now()); // Change key to force Feed re-render/re-fetch
  };

  return (
    <>
      {/* Add the Spline Background with the correct .splinecode URL */}
      <SplineBackground sceneUrl="https://prod.spline.design/m41M9nh0Iu3Vn725/scene.splinecode" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-end mb-8">
          <CreateEntryDialog onEntryCreated={handleEntryCreated} />
        </div>
        
        {/* Pass the key to the Feed component */}
        <Feed key={feedKey} /> 
      </div>
    </>
  );
}

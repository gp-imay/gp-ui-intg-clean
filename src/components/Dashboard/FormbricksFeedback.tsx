// src/components/Dashboard/FormbricksFeedback.tsx
import React, { useEffect } from 'react';
import formbricks from "@formbricks/js";

interface FormbricksFeedbackProps {
  environmentId: string;
  appUrl?: string;
}

export function FormbricksFeedback({ 
  environmentId, 
  appUrl = "https://app.formbricks.com?formbricksDebug=true" 
}: FormbricksFeedbackProps) {
  useEffect(() => {
    // Initialize Formbricks
    const initFormbricks = async () => {
      try {
        await formbricks.setup({
          environmentId,
          appUrl,
          // You can add other configuration options as needed:
          // debug: process.env.NODE_ENV === 'development',
          // apiHost: "https://app.formbricks.com/api",
        });
        
        console.log("Formbricks initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Formbricks:", error);
      }
    };
    
    initFormbricks();

    // No teardown method available, so we can't clean up the instance
    return () => {
      console.log("Formbricks component unmounted");
    };
  }, [environmentId, appUrl]);

  return (
    <div className="formbricks-container h-full flex flex-col items-center justify-center">
      <div className="text-center text-gray-600 p-4">
        <p className="mb-2 text-sm">Feedback forms will appear here when triggered.</p>
        <p className="text-xs text-gray-500">Powered by Formbricks</p>
      </div>
    </div>
  );
}
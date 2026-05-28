import React from 'react';
import { cn } from '../lib/utils';

const Dashboard = ({ userRole }) => {
  return (
    <div className={cn(
      "border-t border-dashed pt-12 text-center opacity-20",
      userRole === 'admin' ? "border-stone-300" : "border-stone-200"
    )}>
      <div className="w-full h-96 flex items-center justify-center">
        <p className={cn(
          "italic text-2xl",
          userRole === 'admin' ? "font-serif" : "font-user-serif"
        )}>
          {userRole === 'admin' ? 'Strategic analytics loading...' : 'Select an operation from the sidebar to begin.'}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

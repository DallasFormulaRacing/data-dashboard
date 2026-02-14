'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export default function ProfileBox({ collapsed, name = 'User', onLogout }: Readonly<{ collapsed: boolean; name?: string; onLogout?: () => void }>) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`w-full ${collapsed ? 'flex items-center justify-center mb-4' : 'flex items-center justify-between mb-4 px-2'}`}>
      {collapsed ? (
        <div className="w-8 h-8 flex-shrink-0 h-8 rounded-full bg-black border border-white text-white flex items-center justify-center text-sm cursor-pointer" aria-hidden>
          {initial}
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-black border border-white text-white flex items-center justify-center text-sm">{initial}</div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{name}</span>
          </div>
        </div>
      )}

      {!collapsed && (
        <button title="Logout" aria-label="Logout" onClick={() => onLogout && onLogout()} className="flex items-center text-sm text-gray-300 hover:text-red-500 transition-colors p-1 rounded">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

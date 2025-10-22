'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, Check } from 'lucide-react';
import notificationService from '@/lib/notifications';

export const NotificationToggle: React.FC = () => {
  const [status, setStatus] = useState<'enabled' | 'disabled' | 'denied' | 'unsupported'>('disabled');
  const [isToggling, setIsToggling] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check initial status
    setStatus(notificationService.getStatus());
  }, []);

  const handleToggle = async () => {
    setIsToggling(true);
    
    try {
      if (status === 'enabled') {
        notificationService.disable();
        setStatus('disabled');
      } else if (status === 'disabled') {
        const enabled = await notificationService.enable();
        setStatus(enabled ? 'enabled' : notificationService.getStatus());
      }
    } finally {
      setIsToggling(false);
    }
  };

  // Don't render if not supported
  if (status === 'unsupported') {
    return null;
  }

  const getButtonColor = () => {
    switch (status) {
      case 'enabled':
        return 'text-[#cc3399] hover:text-[#b82d89]';
      case 'denied':
        return 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300';
      default:
        return 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300';
    }
  };

  const getTooltipContent = () => {
    switch (status) {
      case 'enabled':
        return 'Notifications enabled - Click to disable';
      case 'denied':
        return 'Notifications blocked - Enable in browser settings';
      case 'disabled':
        return 'Enable notifications for transcription updates';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isToggling || status === 'denied'}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${status === 'denied' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${getButtonColor()}
          hover:bg-gray-100 dark:hover:bg-gray-700
        `}
        aria-label={getTooltipContent()}
      >
        {status === 'enabled' ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5" />
        )}
        
        {/* Status indicator dot */}
        {status === 'enabled' && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#cc3399] rounded-full animate-pulse" />
        )}
        {status === 'denied' && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="flex items-center space-x-2">
              {status === 'enabled' && <Check className="h-3 w-3 text-green-400" />}
              {status === 'denied' && <AlertCircle className="h-3 w-3 text-red-400" />}
              <span>{getTooltipContent()}</span>
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45" />
          </div>
        </div>
      )}

      {/* Mobile-friendly status text (shown on small screens) */}
      <div className="sm:hidden absolute top-full right-0 mt-1">
        {status === 'enabled' && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Notifications on</span>
        )}
        {status === 'denied' && (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">Blocked</span>
        )}
      </div>
    </div>
  );
};
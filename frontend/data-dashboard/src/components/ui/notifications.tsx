'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export type NotificationType = 'notice' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  customColor?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showButtons: boolean;
  setShowButtons: (show: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const getTypeStyles = (type: NotificationType, customColor?: string) => {
  if (customColor) {
    return {
      bg: customColor,
      border: customColor,
      text: 'text-gray-800'
    };
  }

  const styles = {
    notice: {
      bg: 'bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-900'
    },
    warning: {
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-900'
    },
    error: {
      bg: 'bg-red-200',
      border: 'border-red-400',
      text: 'text-red-900'
    },
    success: {
      bg: 'bg-green-200',
      border: 'border-green-400',
      text: 'text-green-900'
    }
  };

  return styles[type];
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const savedButtonState = localStorage.getItem('notificationShowButtons');
    if (savedButtonState === 'true') {
      setShowButtons(true);
    }

    const savedNotifications = localStorage.getItem('savedNotifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && notifications.length >= 0) {
      localStorage.setItem('savedNotifications', JSON.stringify(notifications));
    }
  }, [notifications, isClient]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateShowButtons = useCallback((show: boolean) => {
    setShowButtons(show);
    if (isClient) {
      localStorage.setItem('notificationShowButtons', show.toString());
    }
  }, [isClient]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, showButtons, setShowButtons: updateShowButtons }}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification}
        showButtons={showButtons}
      />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
  showButtons: boolean;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, removeNotification, showButtons }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none" style={{ width: '380px' }}>
      <div className="pointer-events-auto flex flex-col gap-3">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
            showButtons={showButtons}
          />
        ))}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  showButtons: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss, showButtons }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getTypeStyles(notification.type, notification.customColor);

  const handleLinkClick = () => {
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-lg animate-slide-in-right w-full`}
      style={notification.customColor ? { backgroundColor: notification.customColor } : undefined}
    >
      <div className="p-4 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className={`font-semibold ${styles.text} leading-tight`}>
                {notification.title}
              </h3>
              {notification.link && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`${styles.text} hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1 flex-shrink-0 mt-0.5`}
                  aria-label="Toggle details"
                >
                  <span className="text-xs whitespace-nowrap">More info</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            
            <p className={`text-sm ${styles.text} break-words pr-2`}>
              {notification.content}
            </p>
          </div>
          
          <button
            onClick={onDismiss}
            className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer`}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>

        {isExpanded && notification.link && showButtons && (
          <div className="mt-3 w-full">
            <button
              onClick={handleLinkClick}
              className={`px-4 py-2 rounded-lg ${styles.text} bg-white bg-opacity-70 hover:bg-opacity-90 transition-all font-bold text-sm cursor-pointer border-2 border-current w-full`}
            >
              Learn More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const NotificationControlButton: React.FC = () => {
  const { showButtons, setShowButtons } = useNotifications();
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="fixed z-[10000] border-2 rounded-lg shadow-lg p-3 cursor-move select-none"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'rgb(232, 117, 0)',
        borderColor: 'rgb(18, 71, 52)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-white">Show Buttons:</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowButtons(!showButtons);
          }}
          style={{
            backgroundColor: showButtons ? 'rgb(18, 71, 52)' : 'rgb(185, 28, 28)'
          }}
          className="px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer text-white hover:opacity-90"
        >
          {showButtons ? 'TRUE' : 'FALSE'}
        </button>
      </div>
    </div>
  );
};

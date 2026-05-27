import React, { useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPanel = ({ isOpen, onClose, notifications = [], unreadCount = 0, onMarkAsRead, onDeleteNotification, isLoading = false }) => {
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const getNotificationIcon = (type) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'exam':
        return <Clock className={`${iconClass} text-blue-500`} />;
      case 'admission':
        return <Bell className={`${iconClass} text-red-500`} />;
      case 'scholarship':
        return <CheckCheck className={`${iconClass} text-green-500`} />;
      case 'deadline':
        return <Clock className={`${iconClass} text-orange-500`} />;
      case 'course':
        return <Bell className={`${iconClass} text-purple-500`} />;
      case 'college':
        return <Bell className={`${iconClass} text-indigo-500`} />;
      case 'quiz':
        return <CheckCheck className={`${iconClass} text-cyan-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 w-full max-w-md h-screen bg-white shadow-2xl flex flex-col rounded-l-3xl border-l border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-600">{unreadCount} new</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead(notification._id);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm font-semibold text-gray-900 line-clamp-1 ${
                              !notification.read ? 'font-bold text-purple-900' : ''
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1.5">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notification._id);
                          }}
                          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <Bell className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium">No notifications</p>
                  <p className="text-xs text-gray-500 mt-1">Check back later</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button className="w-full py-2 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

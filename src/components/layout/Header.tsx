import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Bell,
  Maximize2,
  ChevronDown,
  Calendar,
  Clock,
  Package,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    currentUser,

    // Separate Supabase inventory state
    inventoryItems,
    inventoryLoading,

    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setActiveView
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] =
    useState<boolean>(false);

  const [
    isUserDropdownOpen,
    setIsUserDropdownOpen
  ] = useState<boolean>(false);

  const [currentTime, setCurrentTime] =
    useState<Date>(new Date());

  // Stores low-stock notifications marked as read
  // during the current application session.
  const [
    readLowStockIds,
    setReadLowStockIds
  ] = useState<Set<string>>(
    () => new Set<string>()
  );

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentTime(new Date()),
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // Fetch every active item below its alert quantity.
  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter(
        item =>
          item.status === 'Active' &&
          item.stock < item.lowStockAlert
      ),
    [inventoryItems]
  );

  // Create notification objects from inventory items.
  const lowStockNotifications = useMemo(
    () =>
      lowStockItems.map(item => ({
        id: `low-stock-${item.id}`,
        inventoryItemId: item.id,
        title: `Low Stock: ${item.name}`,
        message:
          `Current stock is ${item.stock} ${item.unit}. ` +
          `Alert quantity is ${item.lowStockAlert} ${item.unit}.`,
        time: 'Live inventory alert',
        read: readLowStockIds.has(item.id),
        source: 'inventory' as const
      })),
    [lowStockItems, readLowStockIds]
  );

  // Add existing application notifications.
  const regularNotifications = useMemo(
    () =>
      notifications.map(notification => ({
        ...notification,
        inventoryItemId: undefined,
        source: 'regular' as const
      })),
    [notifications]
  );

  // Low-stock notifications appear first.
  const displayedNotifications = useMemo(
    () => [
      ...lowStockNotifications,
      ...regularNotifications
    ],
    [
      lowStockNotifications,
      regularNotifications
    ]
  );

  const unreadCount =
    displayedNotifications.filter(
      notification => !notification.read
    ).length;

  const toggleFullscreen = async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        'Unable to change fullscreen mode:',
        error
      );
    }
  };

  const handleNotificationClick = (
    notification: typeof displayedNotifications[number]
  ): void => {
    if (
      notification.source === 'inventory' &&
      notification.inventoryItemId
    ) {
      setReadLowStockIds(previous => {
        const updated = new Set(previous);

        updated.add(
          notification.inventoryItemId as string
        );

        return updated;
      });

      setActiveView('inventory');
      setIsNotifOpen(false);

      return;
    }

    markNotificationAsRead(notification.id);
  };

  const handleMarkAllRead = (): void => {
    markAllNotificationsAsRead();

    setReadLowStockIds(
      new Set(
        lowStockItems.map(item => item.id)
      )
    );
  };

  const handleClearNotifications = (): void => {
    // Clears ordinary application notifications.
    clearNotifications();

    // Active low-stock warnings remain visible,
    // but they are marked as read.
    setReadLowStockIds(
      new Set(
        lowStockItems.map(item => item.id)
      )
    );
  };

  const formattedDate =
    currentTime.toLocaleDateString(
      'en-IN',
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  const formattedTime =
    currentTime
      .toLocaleTimeString(
        'en-IN',
        {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }
      )
      .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-end sticky top-0 z-20 shadow-2xs">
      {/* Live Date and Time */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-amber-50/45 rounded-xl border border-amber-100/50 text-gray-700 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
          <Calendar className="w-3.5 h-3.5 text-amber-700/80 " />

          <span>{formattedDate}</span>
        </div>

        <span className="w-1.5 h-1.5 rounded-full bg-amber-300/80" />

        <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 font-mono tracking-wide">
          <Clock className="w-3.5 h-3.5 text-amber-700/80 animate-pulse" />

          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode */}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(previous => !previous);
              setIsUserDropdownOpen(false);
            }}
            className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 z-30 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              {/* Notification header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-800">
                    Notifications
                  </span>

                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 leading-none">
                    {unreadCount} New
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="py-1 space-y-2 max-h-72 overflow-y-auto pr-1">
                {inventoryLoading && (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />

                    Checking inventory...
                  </div>
                )}

                {!inventoryLoading &&
                displayedNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 font-semibold select-none">
                    No notifications
                  </div>
                ) : (
                  displayedNotifications.map(
                    notification => {
                      const isLowStock =
                        notification.source ===
                        'inventory';

                      return (
                        <div
                          key={notification.id}
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={`p-2.5 rounded-xl text-xs space-y-0.5 transition-all cursor-pointer relative border ${
                            isLowStock
                              ? notification.read
                                ? 'bg-red-50/30 hover:bg-red-50 border-red-100/50'
                                : 'bg-red-50 hover:bg-red-100/70 border-red-200 shadow-3xs'
                              : !notification.read
                                ? 'bg-amber-50/40 hover:bg-amber-50/60 border-amber-100/50 shadow-3xs'
                                : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                          }`}
                        >
                          {!notification.read && (
                            <span
                              className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse ${
                                isLowStock
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                          )}

                          <div className="flex items-start gap-2">
                            {isLowStock && (
                              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-bold pr-4 ${
                                  isLowStock
                                    ? 'text-red-900'
                                    : !notification.read
                                      ? 'text-amber-950'
                                      : 'text-gray-700'
                                }`}
                              >
                                {notification.title}
                              </p>

                              <p className="text-[11px] text-gray-500 leading-snug">
                                {notification.message}
                              </p>

                              <span className="text-[9px] text-gray-400 block font-mono mt-1">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              {/* Notification footer */}
              {displayedNotifications.length > 0 && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  {lowStockItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('inventory');
                        setIsNotifOpen(false);
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      Manage {lowStockItems.length}{' '}
                      low-stock item
                      {lowStockItems.length === 1
                        ? ''
                        : 's'}
                    </button>
                  ) : (
                    <span />
                  )}

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={
                        handleClearNotifications
                      }
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsUserDropdownOpen(
                previous => !previous
              );

              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-gray-700/60 bg-[#101a16] hover:bg-[#37443e] transition-all duration-200 group"
          >
            <img
              src={
                currentUser?.photo ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
              }
              alt={
                currentUser?.name || 'Staff'
              }
              className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400"
            />

            <div className="text-left">
              <span className="text-[10px] text-gray-400 group-hover:text-gray-200 block leading-tight font-semibold transition-colors duration-200">
              {currentUser?.role || 'Staff'}
            </span>

              <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight block transition-colors duration-200">
  {currentUser?.name || 'Staff'}
</span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white ml-1 transition-colors duration-200" />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-30 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              <div className="px-3 py-2 bg-amber-50/60 rounded-xl border border-amber-100">
                <p className="text-xs font-extrabold text-gray-900">
                  {currentUser?.name || 'Staff'}
                </p>

                <p className="text-[10px] text-amber-800 font-semibold">
                  {currentUser?.role || 'Staff'} Mode
                  {' • '}
                  PIN Protected
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
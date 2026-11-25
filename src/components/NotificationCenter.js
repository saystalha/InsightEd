'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  buildNotificationItems,
  getStoredReadIds,
  storeReadIds,
  clearStoredReadIds,
} from '@/lib/notifications';

function SvgIcon({ paths, size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export default function NotificationCenter({
  user = null,
  role = null,
  activeMeetings = null,
  pastMeetings = null,
  teacherAlerts = null,
  auditLogs = null,
  onNavigateTab = null,
  variant = 'header', // 'header' | 'button-only'
}) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('unread'); // 'unread' | 'all'

  // Autonomous state if props are not provided
  const [currentUser, setCurrentUser] = useState(user);
  const [currentMeetings, setCurrentMeetings] = useState(activeMeetings || []);
  const [readNotifIds, setReadNotifIds] = useState([]);

  // Sync props to internal state when they change
  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (activeMeetings) setCurrentMeetings(activeMeetings);
  }, [activeMeetings]);

  // Fetch user session and active meetings if missing
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.authenticated && data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    }

    if (!activeMeetings) {
      fetch('/api/classroom')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.meetings)) {
            setCurrentMeetings(data.meetings);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [user, activeMeetings]);

  // Load persistent read IDs
  const activeUser = currentUser || user;
  useEffect(() => {
    setReadNotifIds(getStoredReadIds(activeUser));

    const handleUpdate = (e) => {
      if (e.detail?.ids) {
        setReadNotifIds(e.detail.ids);
      } else {
        setReadNotifIds(getStoredReadIds(activeUser));
      }
    };

    window.addEventListener('insighted_notifs_updated', handleUpdate);
    return () => {
      window.removeEventListener('insighted_notifs_updated', handleUpdate);
    };
  }, [activeUser]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const effectiveRole = role || activeUser?.role || 'student';

  // Compute notifications list
  const allNotifications = useMemo(() => {
    return buildNotificationItems({
      role: effectiveRole,
      user: activeUser,
      activeMeetings: currentMeetings,
      pastMeetings: pastMeetings || [],
      teacherAlerts: teacherAlerts || [],
      auditLogs: auditLogs || [],
    });
  }, [
    effectiveRole,
    activeUser,
    currentMeetings,
    pastMeetings,
    teacherAlerts,
    auditLogs,
  ]);

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter((n) => !readNotifIds.includes(n.id));
  }, [allNotifications, readNotifIds]);

  const displayedNotifications =
    filterMode === 'unread' ? unreadNotifications : allNotifications;

  const handleMarkAllRead = (e) => {
    e?.stopPropagation();
    const allIds = Array.from(
      new Set([...readNotifIds, ...allNotifications.map((n) => n.id)])
    );
    setReadNotifIds(allIds);
    storeReadIds(activeUser, allIds);
  };

  const handleMarkSingleRead = (notifId, e) => {
    e?.stopPropagation();
    if (!readNotifIds.includes(notifId)) {
      const next = [...readNotifIds, notifId];
      setReadNotifIds(next);
      storeReadIds(activeUser, next);
    }
  };

  const handleClearReadHistory = (e) => {
    e?.stopPropagation();
    clearStoredReadIds(activeUser);
    setReadNotifIds([]);
  };

  const handleItemClick = (notif) => {
    handleMarkSingleRead(notif.id);
    setIsOpen(false);

    if (notif.href) {
      router.push(notif.href);
    } else if (notif.targetTab && onNavigateTab) {
      onNavigateTab(notif.targetTab);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-mist hover:text-snow hover:bg-[rgba(59,130,246,0.12)] transition-all cursor-pointer focus:outline-none"
        style={{
          border: isOpen
            ? '1.5px solid #3B82F6'
            : '1px solid rgba(59, 130, 246, 0.26)',
          background: isOpen ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <SvgIcon
          paths={[
            'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
            'M13.73 21a2 2 0 0 1-3.46 0',
          ]}
          size={17}
        />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-black tracking-tight shadow-md animate-pulse">
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-[20px] z-50 overflow-hidden shadow-2xl animate-modal-in border border-blue-500/25"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.20)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-black/5 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[0.88rem] font-black text-snow">
                Notification Center
              </span>
              {unreadNotifications.length > 0 ? (
                <span className="text-[0.66rem] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {unreadNotifications.length} new
                </span>
              ) : (
                <span className="text-[0.66rem] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Caught up
                </span>
              )}
            </div>

            {unreadNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[0.72rem] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Sub-bar Filter Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-white text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[0.72rem] transition-colors cursor-pointer ${
                  filterMode === 'unread'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-mist hover:text-snow hover:bg-slate-100'
                }`}
              >
                Unread ({unreadNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[0.72rem] transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-mist hover:text-snow hover:bg-slate-100'
                }`}
              >
                All ({allNotifications.length})
              </button>
            </div>

            {filterMode === 'all' && readNotifIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearReadHistory}
                className="text-[0.68rem] text-mist hover:text-rose-600 transition-colors"
                title="Reset read tracking"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-black/5">
            {displayedNotifications.length === 0 ? (
              <div className="px-6 py-10 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
                  ✓
                </div>
                <p className="text-[0.84rem] font-bold text-snow">
                  {filterMode === 'unread'
                    ? "You're all caught up!"
                    : 'No notifications available'}
                </p>
                <p className="text-[0.72rem] text-mist max-w-[220px]">
                  {filterMode === 'unread'
                    ? 'All new notifications have been read. Switch to "All" to review activity history.'
                    : 'There are no active or recent alerts recorded for your account.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isUnread = !readNotifIds.includes(notif.id);

                let badgeColor =
                  'bg-blue-500/10 text-blue-600 border-blue-500/20';
                if (notif.tone === 'danger') {
                  badgeColor = 'bg-red-500/10 text-red-600 border-red-500/20';
                } else if (notif.tone === 'warning') {
                  badgeColor =
                    'bg-amber-500/10 text-amber-600 border-amber-500/20';
                } else if (notif.tone === 'success') {
                  badgeColor =
                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all cursor-pointer hover:bg-blue-50/50 group ${
                      isUnread ? 'bg-blue-50/25' : 'bg-transparent'
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5 flex-shrink-0">
                      <span
                        className={`block w-2 h-2 rounded-full transition-all ${
                          isUnread
                            ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                            : 'bg-transparent border border-black/10'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[0.64rem] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}
                        >
                          {notif.category}
                        </span>
                        <span className="text-[0.66rem] text-mist font-mono whitespace-nowrap">
                          {notif.time}
                        </span>
                      </div>

                      <p
                        className={`text-[0.82rem] leading-snug truncate ${
                          isUnread
                            ? 'font-extrabold text-snow'
                            : 'font-semibold text-snow/80'
                        }`}
                      >
                        {notif.title}
                      </p>

                      <p className="text-[0.72rem] text-mist leading-relaxed line-clamp-2 mt-0.5">
                        {notif.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        {notif.actionLabel && (
                          <span className="text-[0.7rem] font-bold text-blue-600 group-hover:underline">
                            {notif.actionLabel} →
                          </span>
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkSingleRead(notif.id, e)}
                            className="text-[0.68rem] font-semibold text-mist hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100/50 transition-colors ml-auto"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Settings page Notification Panel.
 * Directly fulfills:
 * "if they mak them read then no notification must be seen in the notification settings"
 */
export function NotificationSettingsPanel({
  user,
  role,
  activeMeetings,
  pastMeetings,
  teacherAlerts,
  auditLogs,
  onNavigateTab,
}) {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(true);
  const [readNotifIds, setReadNotifIds] = useState([]);

  useEffect(() => {
    setReadNotifIds(getStoredReadIds(user));

    const handleUpdate = (e) => {
      if (e.detail?.ids) {
        setReadNotifIds(e.detail.ids);
      } else {
        setReadNotifIds(getStoredReadIds(user));
      }
    };
    window.addEventListener('insighted_notifs_updated', handleUpdate);
    return () => {
      window.removeEventListener('insighted_notifs_updated', handleUpdate);
    };
  }, [user]);

  const allNotifications = useMemo(() => {
    return buildNotificationItems({
      role: role || user?.role || 'student',
      user,
      activeMeetings: activeMeetings || [],
      pastMeetings: pastMeetings || [],
      teacherAlerts: teacherAlerts || [],
      auditLogs: auditLogs || [],
    });
  }, [user, role, activeMeetings, pastMeetings, teacherAlerts, auditLogs]);

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter((n) => !readNotifIds.includes(n.id));
  }, [allNotifications, readNotifIds]);

  const displayedList = filterUnreadOnly
    ? unreadNotifications
    : allNotifications;

  const handleMarkAllRead = () => {
    const allIds = Array.from(
      new Set([...readNotifIds, ...allNotifications.map((n) => n.id)])
    );
    setReadNotifIds(allIds);
    storeReadIds(user, allIds);
  };

  const handleClearHistory = () => {
    clearStoredReadIds(user);
    setReadNotifIds([]);
  };

  const handleMarkSingleRead = (id) => {
    const next = [...readNotifIds, id];
    setReadNotifIds(next);
    storeReadIds(user, next);
  };

  return (
    <div className="card-navy rounded-[24px] p-8 border border-black/5 animate-fadeUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[1.2rem] font-black text-snow flex items-center gap-2">
            <span>Notification Center & Alerts</span>
            {unreadNotifications.length > 0 && (
              <span className="text-[0.7rem] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {unreadNotifications.length} Pending
              </span>
            )}
          </h2>
          <p className="text-[0.82rem] text-mist mt-0.5">
            Manage your real-time alerts, classroom activity updates, and read
            status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
            >
              Mark All as Read
            </button>
          )}

          {readNotifIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-3 py-2 rounded-xl text-xs font-bold text-mist hover:text-snow bg-slate-100 hover:bg-slate-200 transition-all border border-black/5"
            >
              Reset History
            </button>
          )}
        </div>
      </div>

      {/* Filter Mode Control */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-black/5 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="unread-only-toggle"
            checked={filterUnreadOnly}
            onChange={(e) => setFilterUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
          />
          <label
            htmlFor="unread-only-toggle"
            className="text-[0.82rem] font-bold text-snow cursor-pointer select-none"
          >
            Show Unread Notifications Only
          </label>
        </div>
        <span className="text-[0.74rem] text-mist font-medium">
          Showing {displayedList.length} of {allNotifications.length}{' '}
          notification(s)
        </span>
      </div>

      {/* Notifications Display */}
      {displayedList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-1">
            ✓
          </div>
          <p className="text-[0.92rem] font-black text-emerald-800">
            No notifications to display in settings
          </p>
          <p className="text-[0.78rem] text-emerald-700/80 max-w-md">
            All notifications have been marked as read. As requested, your
            notification feed is clean.
            {filterUnreadOnly && (
              <span className="block mt-1">
                Uncheck &quot;Show Unread Notifications Only&quot; if you wish to
                review past completed notifications.
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayedList.map((notif) => {
            const isUnread = !readNotifIds.includes(notif.id);
            let toneBorder = 'border-blue-200 bg-white';
            let toneBadge = 'bg-blue-50 text-blue-600 border-blue-200';

            if (notif.tone === 'danger') {
              toneBorder = 'border-red-200 bg-red-50/20';
              toneBadge = 'bg-red-50 text-red-600 border-red-200';
            } else if (notif.tone === 'warning') {
              toneBorder = 'border-amber-200 bg-amber-50/20';
              toneBadge = 'bg-amber-50 text-amber-600 border-amber-200';
            } else if (notif.tone === 'success') {
              toneBorder = 'border-emerald-200 bg-emerald-50/20';
              toneBadge = 'bg-emerald-50 text-emerald-600 border-emerald-200';
            }

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${toneBorder} ${
                  isUnread ? 'shadow-sm' : 'opacity-75'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[0.66rem] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${toneBadge}`}
                    >
                      {notif.category}
                    </span>
                    <span className="text-[0.7rem] text-mist font-mono">
                      {notif.time}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-[0.88rem] font-bold text-snow truncate">
                    {notif.title}
                  </h4>
                  <p className="text-[0.76rem] text-mist mt-0.5">
                    {notif.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {notif.href ? (
                    <Link
                      href={notif.href}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      {notif.actionLabel || 'Open'}
                    </Link>
                  ) : notif.targetTab && onNavigateTab ? (
                    <button
                      type="button"
                      onClick={() => onNavigateTab(notif.targetTab)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      {notif.actionLabel || 'Navigate'}
                    </button>
                  ) : null}

                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(notif.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-mist hover:text-snow bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span className="text-[0.72rem] font-semibold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md">
                      ✓ Read
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Category Preferences */}
      <div className="mt-8 pt-6 border-t border-black/5">
        <h3 className="text-[0.95rem] font-black text-snow mb-1">
          Notification Preferences
        </h3>
        <p className="text-[0.76rem] text-mist mb-4">
          Configure which category updates are pushed to your alert bell and
          dashboard stream.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-between">
            <div>
              <p className="text-[0.82rem] font-bold text-snow">
                Live Classroom Sessions
              </p>
              <p className="text-[0.7rem] text-mist">
                Instant alerts when classes begin
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-between">
            <div>
              <p className="text-[0.82rem] font-bold text-snow">
                {role === 'teacher'
                  ? 'Student Attention Drops'
                  : 'Faculty & Course Updates'}
              </p>
              <p className="text-[0.7rem] text-mist">
                Critical engagement & mapping notifications
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { NotificationIcon } from './icons/NotificationIcon';

interface HeaderProps {
  activeView?: string;
}

const Header: React.FC<HeaderProps> = ({ activeView = 'Nexus' }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'alert',
      title: 'CONTINUITY GUARDIAN ALERT',
      text: 'Outfit discrepancy detected between Frame #117 and #118.',
      time: '10m ago',
      read: false,
    },
    {
      id: '2',
      type: 'ai',
      title: 'STYLE ALCHEMIST SYNTHESIS',
      text: 'Neon Dystopia and Cyber Noir palettes synthesized successfully.',
      time: '45m ago',
      read: false,
    },
    {
      id: '3',
      type: 'system',
      title: 'PRINT SHOP EXPORT READY',
      text: 'Page 1 multi-panel layout ready for PDF/PNG export.',
      time: '2h ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="w-full h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-[#2E2E3A] sticky top-0 z-50 halftone-bg">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1A1A24] border border-[#FF2244] flex items-center justify-center font-display text-xl text-[#FF2244] shadow-[2px_2px_0px_#FF2244] glow-crimson">
          K
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-2xl tracking-wider text-[#C8C0B8] uppercase flex items-center gap-1.5 leading-none">
              <span className="text-[#FF2244] font-black glow-text-crimson">KONKRED</span>
              <span className="text-[#2E2E3A] font-light">/</span>
              <span className="text-[#C8C0B8] font-bold text-lg">MISE-EN-SCÈNE</span>
            </h1>
            <span className="hidden md:inline-block text-[9px] font-mono-code px-1.5 py-0.5 bg-[#1A1A24] text-[#8A8490] border border-[#2E2E3A] uppercase">
              BUILD 0.7.2 // LOCAL SECURE
            </span>
          </div>
          <div className="text-[10px] font-mono-code text-[#00E5FF] tracking-widest uppercase flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
            <span>AI INK ASSIST: ACTIVE</span>
            <span className="text-[#2E2E3A] mx-1">|</span>
            <span className="text-[#8A8490]">STUDIO: {activeView.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Quick Studio Telemetry Badge */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-[#1A1A24] border border-[#2E2E3A] text-xs font-mono-code">
          <div>
            <span className="text-[#8A8490]">INK USED: </span>
            <span className="text-[#FF2244] font-bold">1.82L / 3.00L</span>
          </div>
          <div className="w-16 h-2 bg-[#0A0A0F] border border-[#2E2E3A] overflow-hidden">
            <div className="w-[60%] h-full bg-[#FF2244]"></div>
          </div>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="text-[#8A8490] hover:text-[#FF2244] p-2 bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] transition-all relative group"
            aria-label="Toggle notifications"
          >
            <NotificationIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full bg-[#FF2244] opacity-75"></span>
                <span className="relative inline-flex items-center justify-center h-4 w-4 bg-[#FF2244] text-[9px] font-mono-code font-bold text-[#0A0A0F]">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#1A1A24] border-2 border-[#FF2244] shadow-[8px_8px_0px_#0A0A0F] z-50 overflow-hidden">
              <div className="p-3 font-heading text-sm uppercase tracking-wider text-[#C8C0B8] bg-[#0A0A0F] border-b border-[#2E2E3A] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF2244] inline-block"></span>
                  DISPATCH NOTIFICATIONS
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-mono-code text-[#00E5FF] hover:underline uppercase"
                  >
                    CLEAR UNREAD
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#2E2E3A] max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono-code text-[#8A8490]">NO ACTIVE NOTIFICATIONS</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors hover:bg-[#2E2E3A]/40 flex items-start justify-between gap-2 ${
                        !n.read ? 'bg-[#FF2244]/10' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-heading text-xs tracking-wide ${
                              n.type === 'alert'
                                ? 'text-[#FF2244]'
                                : n.type === 'ai'
                                ? 'text-[#00E5FF]'
                                : 'text-[#C8C0B8]'
                            }`}
                          >
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-[#FF2244] inline-block animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[#8A8490] text-[11px] font-mono-code leading-relaxed">{n.text}</p>
                        <span className="text-[9px] text-[#4A4454] font-mono-code block">{n.time}</span>
                      </div>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="text-[#8A8490] hover:text-[#FF2244] text-xs p-1 font-mono-code"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#2E2E3A]">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-9 h-9 border-2 border-[#FF2244] object-cover cursor-pointer hover:brightness-125 transition-all shadow-[2px_2px_0px_#0A0A0F]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2EFF6E] border border-[#0A0A0F]"></span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-heading tracking-wide text-[#C8C0B8] leading-none uppercase">ALEX MERCER</div>
            <div className="text-[9px] text-[#FF2244] font-mono-code leading-none mt-1 uppercase tracking-wider">OPERATOR #23A</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


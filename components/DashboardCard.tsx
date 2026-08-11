
import React from 'react';

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-[#1A1A24] border-2 border-[#2E2E3A] shadow-[4px_4px_0px_#0A0A0F] hover:border-[#FF2244] transition-all ${className}`}
      onClick={onClick}
    >
      <div className="p-5 h-full">
        {title && (
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#2E2E3A]">
            <span className="w-2 h-2 bg-[#FF2244]"></span>
            <h3 className="font-display text-xl text-[#C8C0B8] uppercase tracking-wider">{title}</h3>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;

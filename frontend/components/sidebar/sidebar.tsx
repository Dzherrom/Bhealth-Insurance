'use client';

import React from 'react';
import { Menu } from 'lucide-react';

export interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

const Sidebar = ({ items, className = "" } : SidebarProps) => {
  return (
    <div className={`w-20 h-screen bg-gray-100 flex flex-col items-center py-4 space-y-6 ${className}`}>
      <Menu className="w-8 h-8 text-gray-600 cursor-pointer" />
      {items.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className="group relative cursor-pointer"
            onClick={item.onClick}
          >
            <IconComponent className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                          whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Sidebar;

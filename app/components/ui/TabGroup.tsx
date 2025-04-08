'use client';

import React, { useState, ReactNode } from 'react';
import { cn } from '@/app/utils/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabGroupProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  variant?: 'underline' | 'pills' | 'buttons';
}

/**
 * TabGroup component for switching between different content sections
 */
export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultActiveTab,
  onChange,
  className,
  tabsClassName,
  contentClassName,
  variant = 'underline',
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultActiveTab || tabs[0]?.id || ''
  );

  // Find the active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    onChange?.(tabId);
  };

  // Tab variant classes
  const variantClasses = {
    tab: {
      underline:
        'border-b-2 border-transparent transition-colors hover:border-gray-300 hover:text-gray-700',
      pills:
        'rounded-full py-1 px-3 transition-colors hover:bg-gray-100 hover:text-gray-700',
      buttons:
        'border border-gray-200 py-1 px-3 transition-colors hover:bg-gray-100 hover:text-gray-700',
    },
    activeTab: {
      underline: 'border-b-2 border-purple-500 text-purple-600',
      pills: 'bg-purple-50 text-purple-600',
      buttons: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    wrapper: {
      underline: 'border-b border-gray-200',
      pills: '',
      buttons: '',
    },
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab buttons */}
      <div
        className={cn(
          'flex mb-4',
          variantClasses.wrapper[variant],
          tabsClassName
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'py-2 px-4 text-sm font-medium focus:outline-none',
              variantClasses.tab[variant],
              activeTabId === tab.id && variantClasses.activeTab[variant],
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
            aria-selected={activeTabId === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={cn('tab-content', contentClassName)}>
        {activeTab?.content}
      </div>
    </div>
  );
}; 
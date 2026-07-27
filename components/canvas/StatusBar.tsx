'use client';

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { getCurrentTime } from '@/lib/utils';

export default function StatusBar() {
  const { phoneOs, batteryLevel, customTime, useCustomTime } = useEditorStore();

  const displayTime = useCustomTime ? customTime : getCurrentTime();
  const isLowBattery = batteryLevel <= 20;

  if (phoneOs === 'ios') {
    return (
      <div className="relative flex items-center justify-between px-5 pt-1 pb-0.5 h-[44px]" style={{ background: 'var(--wa-header)' }}>
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-[6px] -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-full z-10" />

        {/* Time (left of island) */}
        <span className="text-[15px] font-semibold text-white z-20" style={{ fontFeatureSettings: '"tnum"' }}>
          {displayTime}
        </span>

        {/* Right icons */}
        <div className="flex items-center gap-[5px] z-20">
          {/* Signal */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.4"/>
            <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" opacity="0.6"/>
            <rect x="9" y="2.5" width="3" height="9.5" rx="0.5" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="12" rx="0.5"/>
          </svg>
          {/* WiFi */}
          <svg width="15" height="12" viewBox="0 0 15 12" fill="white">
            <path d="M7.5 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
            <path d="M2.5 5.5a7 7 0 0 1 10 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
            <path d="M0.5 3a10 10 0 0 1 14 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3"/>
            <path d="M4.5 7.5a4 4 0 0 1 6 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9"/>
          </svg>
          {/* Battery */}
          <div className="flex items-center gap-[2px]">
            <div className="relative w-[24px] h-[12px] border border-white border-opacity-70 rounded-[2.5px] overflow-hidden">
              <div
                className="absolute inset-y-[2px] left-[2px] rounded-[1px] transition-all"
                style={{
                  width: `calc(${batteryLevel}% - 4px)`,
                  background: isLowBattery ? '#ff3b30' : 'white',
                }}
              />
            </div>
            <div className="w-[2px] h-[5px] bg-white bg-opacity-70 rounded-r-sm" />
          </div>
        </div>
      </div>
    );
  }

  // Android
  return (
    <div className="flex items-center justify-between px-4 h-[24px]" style={{ background: 'var(--wa-header)' }}>
      <span className="text-[12px] font-medium text-white" style={{ fontFeatureSettings: '"tnum"' }}>
        {displayTime}
      </span>
      <div className="flex items-center gap-[4px]">
        {/* Signal bars */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
          <rect x="0" y="7" width="2.5" height="3" rx="0.3"/>
          <rect x="3.5" y="5" width="2.5" height="5" rx="0.3" opacity="0.85"/>
          <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.3" opacity="0.7"/>
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.3" opacity="0.55"/>
        </svg>
        {/* WiFi */}
        <svg width="12" height="9" viewBox="0 0 12 9" fill="white">
          <circle cx="6" cy="8" r="1.2"/>
          <path d="M2 4.5a5.5 5.5 0 0 1 8 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M0 2.5a8.5 8.5 0 0 1 12 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.4"/>
          <path d="M4 6.5a3 3 0 0 1 4 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-[1px]">
          <div className="relative w-[20px] h-[10px] border border-white border-opacity-70 rounded-[1.5px] overflow-hidden">
            <div
              className="absolute inset-y-[1.5px] left-[1.5px] rounded-[0.5px] transition-all"
              style={{
                width: `calc(${batteryLevel}% - 3px)`,
                background: isLowBattery ? '#ff3b30' : 'white',
              }}
            />
          </div>
          <div className="w-[1.5px] h-[4px] bg-white bg-opacity-70 rounded-r-[0.5px]" />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { differenceInSeconds, formatDistanceStrict } from 'date-fns';
import { ru } from 'date-fns/locale'; // Import Russian locale

interface AuctionTimerProps {
  endDate: Date | string; // Accept Date object or ISO string
  onTimerEnd?: () => void; // Optional callback when timer reaches zero
}

/**
 * Displays a countdown timer to the specified end date.
 * Shows remaining days, hours, minutes, and seconds.
 * Displays "Аукцион завершен" when the end date is reached.
 */
const AuctionTimer: React.FC<AuctionTimerProps> = ({ endDate, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;

    if (isNaN(targetDate.getTime())) {
      console.error('[AuctionTimer] Invalid end date provided:', endDate);
      setTimeLeft('Неверная дата окончания');
      setIsEnded(true);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const secondsRemaining = differenceInSeconds(targetDate, now);

      if (secondsRemaining <= 0) {
        setTimeLeft('Аукцион завершен');
        setIsEnded(true);
        if (onTimerEnd) {
          onTimerEnd();
        }
        return null; // Stop the interval calculation
      } else {
        setIsEnded(false); // Ensure it's marked as active

        // Manual calculation of days, hours, minutes, seconds
        const days = Math.floor(secondsRemaining / (60 * 60 * 24));
        const hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
        const seconds = Math.floor(secondsRemaining % 60);

        // Build the time string, omitting zero values at the start
        let parts = [];
        if (days > 0) parts.push(`${days} дн`);
        if (hours > 0 || days > 0) parts.push(`${hours} ч`); // Show hours if days > 0 or hours > 0
        if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} мин`); // Show minutes if higher units > 0
        parts.push(`${seconds} сек`); // Always show seconds unless ended

        setTimeLeft(parts.join(' '));
        return secondsRemaining;
      }
    };

    // Initial calculation
    const initialSeconds = calculateTimeLeft();

    // Don't start interval if already ended
    if (initialSeconds === null || initialSeconds <= 0) {
      return;
    }
    
    // Update the timer every second
    const intervalId = setInterval(() => {
      if (calculateTimeLeft() === null) {
        clearInterval(intervalId); // Stop the interval when time is up
      }
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts or endDate changes
    return () => clearInterval(intervalId);

  }, [endDate, onTimerEnd]); // Rerun effect if endDate or callback changes

  // Styling for the timer display
  const timerClasses = isEnded 
    ? "text-lg font-semibold text-red-600" 
    : "text-lg font-semibold text-indigo-700";

  return (
    <div className="p-4 bg-gray-100 rounded-md text-center shadow-sm">
      <p className="text-sm text-gray-600 mb-1">Окончание аукциона через:</p>
      <p className={timerClasses}>
        {timeLeft || 'Загрузка...'} {/* Show loading briefly */}
      </p>
    </div>
  );
};

export default AuctionTimer; 
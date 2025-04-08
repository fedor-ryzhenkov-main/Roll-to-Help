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
        setIsEnded(false); // Ensure it's marked as active if time restarts (unlikely but safe)
        // Use formatDistanceStrict for a more precise countdown like "1 day 2 hours 30 minutes 5 seconds"
        const formattedDistance = formatDistanceStrict(targetDate, now, { 
          addSuffix: false, // Don't add "ago" or "in"
          unit: 'second', // Calculate down to seconds
          locale: ru // Use Russian locale for output like "день", "часов", "минут", "секунд"
        });
        setTimeLeft(formattedDistance);
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
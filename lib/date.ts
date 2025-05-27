// lib/utils/date.ts

import { format, parseISO, isAfter, isBefore, isToday, addDays, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function formatFirestoreTimestamp(
  timestamp: Timestamp | null | undefined,
  formatString: string = 'PPP'
): string {
  if (!timestamp) return 'No date';
  try {
    return format(timestamp.toDate(), formatString);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
}

export function formatAppointmentDate(
  dateStr: string,
  formatString: string = 'MMMM d, yyyy'
): string {
  try {
    // Ensure consistent date handling by always using local timezone
    const date = new Date(`${dateStr}T00:00:00`);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function formatAppointmentTime(
  timeStr: string | undefined | null,
  formatString: string = 'h:mm a'
): string {
  if (!timeStr) return '';
  try {
    // Use a fixed date to format time
    const date = new Date(`2000-01-01T${timeStr}`);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

export function getLocalISODate(date: Date): string {
  // Get YYYY-MM-DD format in local timezone
  return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
}

// Add this new function
export function isDueSoon(dueDate: string, daysThreshold: number = 7): boolean {
  const today = startOfDay(new Date());
  const due = parseISO(dueDate);
  const nearFuture = addDays(today, daysThreshold);

  // Return true if:
  // 1. The due date is today OR
  // 2. The due date is in the past OR
  // 3. The due date is within the next [daysThreshold] days
  return (
    isToday(due) ||
    isBefore(due, today) ||
    (isAfter(due, today) && isBefore(due, nearFuture))
  );
}

// Add this function to determine if medication is overdue
export function isOverdue(dueDate: string): boolean {
  const today = startOfDay(new Date());
  const due = parseISO(dueDate);
  return isBefore(due, today);
}
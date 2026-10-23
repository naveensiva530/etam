import type { BreakItem } from '../types/timetable.types';

export interface CalculatedPeriodSlot {
  periodNumber: number;
  startTime: string; // '9:30 am'
  endTime: string; // '10:00 am'
  breakAfter?: BreakItem;
}

function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return 9 * 60 + 30; // default 9:30 AM

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const meridiem = hours >= 12 ? 'pm' : 'am';

  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${paddedMinutes} ${meridiem}`;
}

export function calculatePeriodSlots(
  startTimeStr: string = '09:30 AM',
  periodDurationMinutes: number = 30,
  totalPeriods: number = 8,
  breaks: BreakItem[] = []
): CalculatedPeriodSlot[] {
  let currentMinutes = parseTimeToMinutes(startTimeStr);
  const slots: CalculatedPeriodSlot[] = [];

  for (let p = 1; p <= totalPeriods; p++) {
    const slotStart = formatMinutesToTime(currentMinutes);
    currentMinutes += periodDurationMinutes;
    const slotEnd = formatMinutesToTime(currentMinutes);

    // Check if there is a break after this period (e.g. inBetween '2 to 3')
    const breakAfter = breaks.find((b) => {
      if (!b.inBetween) return false;
      const parts = b.inBetween.split('to').map((s) => parseInt(s.trim(), 10));
      return parts[0] === p;
    });

    if (breakAfter) {
      currentMinutes += breakAfter.durationMinutes || 15;
    }

    slots.push({
      periodNumber: p,
      startTime: slotStart,
      endTime: slotEnd,
      breakAfter,
    });
  }

  return slots;
}

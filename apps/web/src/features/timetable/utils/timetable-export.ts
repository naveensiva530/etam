import type { TimetableConfig } from '../types/timetable.types';
import { DAYS_OF_WEEK } from '../types/timetable.types';

export function exportTimetableToCsv(config: TimetableConfig): void {
  const rows: string[][] = [];

  // Header row
  rows.push([
    'Time Table Configuration',
    config.departmentName || '',
    `Shift: ${config.shift || 'Morning'}`,
    `Academic Year: ${config.academicYear || ''}`,
    `Class Teacher: ${config.classTeacherName || 'N/A'}`,
  ]);
  rows.push([]);

  // Detailed schedule by Day
  DAYS_OF_WEEK.forEach((day) => {
    const dayAllocations = (config.allocations || [])
      .filter((a) => a.dayOfWeek === day)
      .sort((a, b) => a.periodNumber - b.periodNumber);

    rows.push([day.toUpperCase()]);
    rows.push(['Period', 'Time', 'Subject', 'Teacher']);

    if (dayAllocations.length === 0) {
      rows.push(['No periods scheduled']);
    } else {
      dayAllocations.forEach((alloc) => {
        rows.push([
          `Period ${alloc.periodNumber}`,
          `${alloc.startTime} - ${alloc.endTime}`,
          alloc.subjectName || '-',
          alloc.teacherName || '-',
        ]);
      });
    }
    rows.push([]);
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `Timetable_${(config.departmentName || 'Class').replace(/\s+/g, '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

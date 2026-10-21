import { ClassroomAssignment } from '../types/classroom';

/**
 * Format Date object into UTC iCalendar string: YYYYMMDDTHHMMSSZ
 */
function formatDateToICS(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escape text for iCalendar format
 */
function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Parse deadline string (e.g. "2026-09-05T23:59" or "2026-09-05 23:59" or "Besok 23:59")
 * and return a valid JS Date
 */
export function parseDeadlineDate(deadlineStr?: string): Date {
  if (!deadlineStr) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    defaultDate.setHours(23, 59, 0, 0);
    return defaultDate;
  }

  const dateMatch = deadlineStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);

    const timeMatch = deadlineStr.match(/(\d{1,2}):(\d{2})/);
    const hours = timeMatch ? parseInt(timeMatch[1], 10) : 23;
    const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 59;

    return new Date(year, month, day, hours, minutes, 0);
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 2);
  fallback.setHours(23, 59, 0, 0);
  return fallback;
}

/**
 * Generate and download .ics iCalendar file for classroom assignments
 */
export function exportAssignmentsToICS(
  assignments: ClassroomAssignment[],
  filename: string = 'tugas_sdn_tangerang_6.ics'
) {
  if (!assignments || assignments.length === 0) return;

  const icsContent: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SDN Tangerang 6//Classroom Portal//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Tugas & Tenggat SDN Tangerang 6',
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];

  assignments.forEach((assignment) => {
    const endDate = parseDeadlineDate(assignment.DEADLINE);
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);

    const dtStartStr = formatDateToICS(startDate);
    const dtEndStr = formatDateToICS(endDate);
    const uid = `assignment-${assignment.ID}-${endDate.getTime()}@sdntangerang6.sch.id`;

    const summary = escapeICSText(`[${assignment.TYPE}] ${assignment.JUDUL}`);
    const description = escapeICSText(
      `Tugas Mata Pelajaran: ${assignment.JUDUL}\n` +
        `Tipe: ${assignment.TYPE || 'Tugas'}\n\n` +
        `Deskripsi:\n${assignment.DESKRIPSI}\n\n` +
        `Buka Portal Classroom untuk mengumpulkan tugas.`
    );
    const location = escapeICSText(`Classroom Portal SDN Tangerang 6`);

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${dtStartStr}`,
      `DTEND:${dtEndStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(`Pengingat 1 Hari Sebelum Tenggat: ${assignment.JUDUL}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(`PERINGATAN URGENT! 2 Jam Sebelum Tenggat: ${assignment.JUDUL}`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

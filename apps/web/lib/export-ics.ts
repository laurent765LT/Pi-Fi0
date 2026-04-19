export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date
  productName?: string;
  isin?: string;
  type?: string;
}

export function generateIcs(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Strickin//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Strick\'in Événements',
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  events.forEach(event => {
    const dateStamp = formatDateIcs(event.date);
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART:${dateStamp}`,
      `DTEND:${dateStamp}`,
      `SUMMARY:${escapeIcs(event.title)}${event.productName ? ' — ' + escapeIcs(event.productName) : ''}`,
      `DESCRIPTION:${escapeIcs([event.type, event.isin && 'ISIN: ' + event.isin, event.description].filter(Boolean).join(' \\n '))}`,
      `UID:${event.id}@strickin.fr`,
      `DTSTAMP:${formatDateIcs(new Date().toISOString())}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatDateIcs(date: string): string {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcs(s: string): string {
  return s.replace(/[,;\\]/g, '\\$&');
}

export function downloadIcs(events: CalendarEvent[], filename = 'strickin-evenements.ics') {
  const content = generateIcs(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

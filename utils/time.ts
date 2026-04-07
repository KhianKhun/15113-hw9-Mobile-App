import { TimeSegment } from '../types';

// ─── Duration formatting ─────────────────────────────────────────────────────

/** Compact form for cards: "2h 30m", "5m 12s", "8s" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Full form for detail view: "2h 30m 45s", "5m 12s", "8s" */
export function formatDurationFull(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** HH:MM:SS for the live timer display */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '00'),
  ].join(':');
}

// ─── Date formatting ─────────────────────────────────────────────────────────

/** "Apr 6, 2025" — for record cards */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Apr 6, 13:33" — for timer started-at label */
export function formatStartTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Segment time formatting ──────────────────────────────────────────────────

/** 24-hour HH:MM — used to pre-fill the edit input fields */
export function formatSegmentTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 12-hour with AM/PM — used for read-only segment display */
export function formatSegmentTimeDisplay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Time parsing ─────────────────────────────────────────────────────────────

/** Parse "HH:MM" or "HH:MM:SS" (24h) into a Date, using referenceDate for the calendar date. */
export function parseTimeInput(value: string, referenceDate: Date): Date | null {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  if (h > 23 || m > 59 || s > 59) return null;
  const d = new Date(referenceDate);
  d.setHours(h, m, s, 0);
  return d;
}

/**
 * Same as parseTimeInput but advances result by 1 day when it falls on or
 * before startDate — handles sessions that span midnight.
 */
export function parseEndTimeInput(
  value: string,
  referenceDate: Date,
  startDate: Date,
): Date | null {
  const parsed = parseTimeInput(value, referenceDate);
  if (!parsed) return null;
  if (parsed <= startDate) {
    parsed.setDate(parsed.getDate() + 1);
  }
  return parsed;
}

// ─── Segment computation ──────────────────────────────────────────────────────

export function computeTotalDuration(segments: TimeSegment[]): number {
  return segments.reduce(
    (acc, seg) =>
      acc + (new Date(seg.end).getTime() - new Date(seg.start).getTime()),
    0,
  );
}

/**
 * Apply edited start/end times to a segment array.
 * Works correctly for both single-segment and multi-segment sessions:
 * - If a segment is both first and last (single segment), both start and end are updated.
 * - Otherwise only the relevant boundary is updated; middle segments are untouched.
 */
export function applyTimeEdits(
  segments: TimeSegment[],
  newStart: Date,
  newEnd: Date,
): TimeSegment[] {
  return segments.map((seg, i) => {
    const isFirst = i === 0;
    const isLast = i === segments.length - 1;
    if (isFirst && isLast) return { start: newStart.toISOString(), end: newEnd.toISOString() };
    if (isFirst) return { ...seg, start: newStart.toISOString() };
    if (isLast) return { ...seg, end: newEnd.toISOString() };
    return seg;
  });
}

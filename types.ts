export interface TimeSegment {
  start: string; // ISO timestamp
  end: string;   // ISO timestamp
}

export interface ActivityRecord {
  id: string;
  name: string;
  tags: string[];
  segments: TimeSegment[];
  totalDuration: number; // milliseconds, computed from segments
  notes: string | null;
  createdAt: string; // ISO timestamp
}

export interface ActiveSession {
  id: string;
  name: string;
  tags: string[];
  segments: TimeSegment[];
  notes: string | null;
  createdAt: string; // ISO timestamp
  isPaused: boolean;
  currentSegmentStart: string | null; // ISO timestamp of ongoing segment start
}

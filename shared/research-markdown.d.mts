import type { TopicNote } from '../src/research-types';
export const NOTE_END: string;
export function renderResearchNote(note: TopicNote, comment?: string): string;
export function parseResearchNote(raw: string): (TopicNote & { raw: string }) | null;
export function researchNotes(markdown: string): (TopicNote & { raw: string; offset: number })[];
export function appendResearchNote(markdown: string, note: TopicNote): string;

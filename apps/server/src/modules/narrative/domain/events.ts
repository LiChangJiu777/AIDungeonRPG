export interface NarrativeDomainEvent {
  type: 'STORY_ADVANCED' | 'NARRATION_REQUESTED';
  sessionId: string;
  turnNumber: number;
  timestamp: Date;
}

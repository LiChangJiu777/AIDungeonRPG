export interface TurnEntity {
  id: string;
  sessionId: string;
  input: string;
  output: unknown;
  turnNumber: number;
  tokensUsed: number;
  createdAt: Date;
}

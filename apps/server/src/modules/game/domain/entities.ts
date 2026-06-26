export interface GameSessionEntity {
  id: string;
  userId: string;
  worldId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  turnCount: number;
  createdAt: Date;
  updatedAt: Date;
}

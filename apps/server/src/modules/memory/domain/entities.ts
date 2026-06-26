export interface MemoryEntity {
  id: string;
  entityId: string;
  sessionId: string;
  type: string;
  content: string;
  importance: number;
  createdAt: Date;
}

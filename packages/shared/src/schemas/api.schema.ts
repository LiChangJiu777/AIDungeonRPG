import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateSessionSchema = z.object({
  worldId: z.string().min(1),
  characterName: z.string().min(1).max(32).optional(),
  characterDesc: z.string().max(500).optional(),
});

export const ActionSchema = z.object({
  input: z.string().min(1).max(2000),
});

export const CreateWorldSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(2000),
  setting: z.enum(['fantasy', 'xianxia', 'romance', 'mystery', 'custom']),
  storyGoal: z.string().max(500).optional(),
  rules: z.record(z.unknown()).optional(),
});

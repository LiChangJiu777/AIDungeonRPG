import crypto from 'node:crypto';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { config } from '../../../config.js';
import jwt from 'jsonwebtoken';
import type { AuthResult } from '../domain/entities.js';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return key === hash;
}

export const authService = {
  async register(username: string, email: string, password: string): Promise<AuthResult> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw new Error('User already exists');

    const user = await prisma.user.create({
      data: { username, email, password: hashPassword(password) },
    });

    const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    return {
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() },
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    return {
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() },
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt.toISOString() };
  },
};


export enum GameMode {
  MENU = 'MENU',
  PRACTICE = 'PRACTICE',
  MULTIPLAYER = 'MULTIPLAYER'
}

export type MatchStatus = 'READY' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Kite {
  id: string;
  name: string;
  color: string;
  pos: Vector2D;
  vel: Vector2D;
  targetPos: Vector2D;
  tension: number;
  isCut: boolean;
  isAI: boolean;
  angle: number;
  attackActive: boolean;
  attackCooldown: number;
  attackEndTime: number;
  score: number;
}

export interface PechaState {
  isIntersecting: boolean;
  contactStartTime: number | null;
  intersectPoint: Vector2D | null;
  kites: [string, string];
}

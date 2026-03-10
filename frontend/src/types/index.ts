export const TYPES_VERSION = '1.0.0';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  currency: number;
}

export interface Car {
  id: string;
  name: string;
  baseSpeed: number;
  baseAcceleration: number;
  baseHandling: number;
  baseNitro: number;
  price?: number;
  isEquipped: boolean;
  stats?: {
    speed: number;
    acceleration: number;
    handling: number;
    nitro: number;
  };
}

export interface Race {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'FINISHED';
  trackLength: number;
  prizePool: number;
  participantsCount: number;
  winnerId?: string;
  startTime?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

import "express-session";

export interface AuthUser {
  id: number;
  google_id: string;
  username: string;
  email: string;
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}
  }
}

export {};

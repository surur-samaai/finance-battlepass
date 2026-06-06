export interface AuthUser {
  id: number;
  supabase_id: string;
  google_id: string | null;
  username: string;
  email: string;
  onboarding_complete: boolean;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};

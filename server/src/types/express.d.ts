declare global {
  namespace Express {
    interface Request {
      session?: {
        userId?: number;
      };
    }
  }
}

export {};

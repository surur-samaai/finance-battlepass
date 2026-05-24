import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateUserByGoogle, getUserById } from "../services/authService";
import type { AuthUser } from "../types/express";

passport.serializeUser((user, done) => {
  done(null, (user as AuthUser).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await getUserById(id);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: `${process.env.API_URL ?? "http://localhost:3000"}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUserByGoogle(profile);
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

export default passport;

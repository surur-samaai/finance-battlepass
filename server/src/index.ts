import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";

// 1. Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, "../../server/.env") });

// 2. Initialize DB connection AFTER env variables are loaded
require("./db/index");
const { pool } = require("./db/index") as { pool: import("pg").Pool };

// 3. Register Passport strategies
import "./config/passport";

import { requireAuth } from "./middleware/requireAuth";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import wishlistRouter from "./routes/wishlist";
import questsRouter from "./routes/quests";
import webhooksRouter from "./routes/webhooks";
import adminRouter from "./routes/admin";

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

if (isProduction) {
  app.set("trust proxy", 1);
}

// Prevent Express from issuing 304 Not Modified on API responses — axios rejects non-2xx statuses.
app.set("etag", false);

app.use(
  cors({
    origin: (origin, callback) => {
      if (origin === undefined) {
        callback(null, true);
        return;
      }
      if (origin === clientUrl || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

const PgSession = connectPgSimple(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({ pool, tableName: "session" }),
    cookie: isProduction
      ? { secure: true, sameSite: "none" }
      : { secure: false, sameSite: "lax" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

const apiRouter = express.Router();
apiRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
apiRouter.use(requireAuth);
apiRouter.use("/user", userRouter);
apiRouter.use("/user", wishlistRouter);
apiRouter.use("/user", questsRouter);
apiRouter.use("/webhooks", webhooksRouter);
apiRouter.use("/admin", adminRouter);

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

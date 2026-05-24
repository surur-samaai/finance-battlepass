import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// 1. Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, "../../server/.env") });

// 2. Initialize DB connection AFTER env variables are loaded
require("./db/index");

import { requireAuth } from "./middleware/requireAuth";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import wishlistRouter from "./routes/wishlist";
import questsRouter from "./routes/quests";
import webhooksRouter from "./routes/webhooks";
import adminRouter from "./routes/admin";

const app = express();
const port = Number(process.env.PORT) || 3000;

// Prevent Express from issuing 304 Not Modified on API responses — axios rejects non-2xx statuses.
app.set("etag", false);

app.use(
  cors({
    origin: (origin, callback) => {
      if (origin === undefined || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

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

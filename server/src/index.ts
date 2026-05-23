import path from "path";
import dotenv from "dotenv";
import express from "express";

import "./db/index";
import { requireAuth } from "./middleware/requireAuth";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import wishlistRouter from "./routes/wishlist";
import questsRouter from "./routes/quests";
import webhooksRouter from "./routes/webhooks";
import adminRouter from "./routes/admin";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

const apiRouter = express.Router();
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

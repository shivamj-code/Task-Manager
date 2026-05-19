import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import testRoutes from "./routes/testRoutes.js";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "https://your-vercel-url.vercel.app",
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/tasks", taskRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;

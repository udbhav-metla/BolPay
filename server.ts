import express from "express";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/routes.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", apiRouter);

// Serve static assets in production
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`BolPay production server listening on port ${PORT}`);
});

import express from "express";
import "dotenv/config";
import User from "./models/User.js";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express';
import cors from "cors";
import fs from "fs";
import path from "path";
import job from "./lib/cron.js";
import clerkWebhook from "./webhooks/clerk.js";
import authRoutes from "./routes/authRoute.js";
import messageRoutes from "./routes/messageRoute.js";

const app = express()
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), 'public');

app.use("/api/webhooks/clerk",express.raw({ type: "application/json" }), clerkWebhook);

app.use(express.json());
app.use(cors({origin:FRONTEND_URL, credentials: true}));
app.use(clerkMiddleware());

app.get("/health", (req,res) => {
    
    res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes)
app.use("/api/message", messageRoutes);

//if the public directory exists, serve static files from it
if(fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("/{*any}", (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'), (err) => next(err));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log("Server is up and running on PORT: ", PORT)
    if(process.env.NODE_ENV === "production") {
        job.start();
    }
});

import express from "express";
import session from "express-session";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------
// Redis
// ------------------------------------

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

await redisClient.connect();

console.log("Connected to Redis");

// ------------------------------------
// Session
// ------------------------------------

const redisStore = new RedisStore({
    client: redisClient,
    prefix: "redis_project:sess:",
    disableTouch: true
});

app.use(
    session({
        store: redisStore,

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
            secure: false
        }
    })
);

// ------------------------------------
// Middleware
// ------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ป้องกันหน้าที่ต้องมี Session (ถ้าไม่มีให้เด้งไปหน้า unauthorized.html)
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/unauthorized.html");
    }
    next();
};

app.get(["/sessions.html", "/sessions-list.html"], requireAuth);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// ------------------------------------
// Login
// ------------------------------------

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "กรุณากรอก username และ password"
            });
        }

        const [rows] = await pool.execute(
            "SELECT id, username, password FROM users WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Username หรือ Password ไม่ถูกต้อง"
            });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Username หรือ Password ไม่ถูกต้อง"
            });
        }

        // ตรวจสอบว่า User นี้มี Session อยู่ใน Redis แล้วหรือไม่
        const prefix = "redis_project:sess:";
        const matchedKeys = [];

        for await (const result of redisClient.scanIterator({
            MATCH: `${prefix}*`,
            COUNT: 100
        })) {
            const keys = Array.isArray(result) ? result : [result];
            for (const key of keys) {
                const sessionData = await redisClient.get(key);
                if (sessionData) {
                    try {
                        const parsed = JSON.parse(sessionData);
                        if (parsed.userId === user.id) {
                            matchedKeys.push(key);
                        }
                    } catch {}
                }
            }
        }

        if (matchedKeys.length > 0) {
            // หากมี Session เก่า ให้ใช้ Session ID เดิม
            const primaryKey = matchedKeys[0];
            const existingSessionId = primaryKey.replace(prefix, "");

            // ลบ Session ซ้ำซ้อนที่อาจหลงเหลือออก (ถ้ามีมากกว่า 1)
            for (let i = 1; i < matchedKeys.length; i++) {
                await redisClient.del(matchedKeys[i]);
            }

            // ใช้ Session ID เดิม
            req.sessionID = existingSessionId;
        }

        // บันทึก/อัปเดตข้อมูล Session และ reset เวลาใหม่ (loginTime ใหม่ และ TTL รีเซ็ตกลับเป็น 1 ชม.)
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.loginTime = new Date().toISOString();

        res.json({
            message: "Login สำเร็จ"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "เกิดข้อผิดพลาดในระบบ"
        });
    }
});

// ------------------------------------
// Current Session
// ------------------------------------

app.get("/api/session", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: "ไม่มี Session"
        });
    }

    res.json({
        sessionId: req.sessionID,
        userId: req.session.userId,
        username: req.session.username,
        loginTime: req.session.loginTime
    });
});

app.get("/api/sessions", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const sessions = [];

        const prefix = "redis_project:sess:";

        for await (const result of redisClient.scanIterator({
            MATCH: `${prefix}*`,
            COUNT: 100
        })) {

            const keys = Array.isArray(result) ? result : [result];

            for (const key of keys) {
                const sessionData = await redisClient.get(key);

                if (!sessionData) {
                    continue;
                }

                const ttl = await redisClient.ttl(key);

                let parsedSession;

                try {
                    parsedSession = JSON.parse(sessionData);
                } catch {
                    parsedSession = {};
                }

                sessions.push({
                    sessionId: key.replace(prefix, ""),
                    userId: parsedSession.userId ?? null,
                    username: parsedSession.username ?? null,
                    loginTime: parsedSession.loginTime ?? null,
                    ttl: ttl
                });
            }
        }

        res.json({
            total: sessions.length,
            sessions: sessions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Cannot read Redis sessions"
        });
    }
});

// ------------------------------------
// Logout
// ------------------------------------

app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                message: "Logout ไม่สำเร็จ"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            message: "Logout สำเร็จ"
        });
    });
});


// ------------------------------------
// Start Server
// ------------------------------------

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/login.html`);
});
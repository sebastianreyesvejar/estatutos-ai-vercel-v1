import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password || password !== ENV.accessPassword) {
      res.status(401).json({ error: "Contraseña incorrecta" });
      return;
    }

    try {
      await db.upsertUser({
        openId: "local-admin",
        name: "Admin",
        email: null,
        loginMethod: "password",
        lastSignedIn: new Date(),
        role: "owner",
      });

      const sessionToken = await sdk.signSession(
        { openId: "local-admin", appId: "local", name: "Admin" },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });
}

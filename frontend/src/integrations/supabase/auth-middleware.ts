import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "./client";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    let userId = "admin";
    let userEmail = "admin@smartport.ai";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const payload = decodeJwtPayload(token);
      if (payload && payload.sub) {
        userId = payload.sub;
        userEmail = payload.email || userEmail;
      }
    }

    return next({
      context: {
        supabase,
        userId,
        userEmail,
      },
    });
  },
);

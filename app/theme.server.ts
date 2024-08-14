import { createThemeSessionResolver } from "remix-themes";
import { env } from "~/config/env.server";
import { createCookieSessionStorage } from "@vercel/remix";

// You can default to 'development' if process.env.NODE_ENV is not set
const isProduction = env.NODE_ENV === "production";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "theme",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: env.THEME_SESSION_SECRET,
    // Set domain and secure only if in production
    ...(isProduction
      ? { domain: "tisza-tracking.vercel.app", secure: true }
      : {}),
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);

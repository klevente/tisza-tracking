import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import stylesheet from "~/tailwind.css?url";
import type { ReactNode } from "react";
import type { LinksFunction } from "@remix-run/server-runtime";
import type { LoaderFunctionArgs } from "@remix-run/router";
import { themeSessionResolver } from "~/theme.server";
import {
  PreventFlashOnWrongTheme,
  type Theme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import { clsx } from "clsx";

export interface LoaderData {
  theme: Theme | null;
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request);
  return {
    theme: getTheme(),
  };
}

export function Layout({ children }: { children: ReactNode }) {
  let data = useRouteLoaderData<LoaderData | { theme: Theme }>("root");

  if (typeof window !== "undefined") {
    if (data) {
      localStorage.setItem("theme", data.theme as Theme);
    } else {
      data = { theme: localStorage.getItem("theme") as Theme };
    }
  }
  return (
    <ThemeProvider
      specifiedTheme={data?.theme as Theme}
      themeAction="/set-theme"
    >
      <InnerLayout ssrTheme={Boolean(data?.theme)}>{children}</InnerLayout>
    </ThemeProvider>
  );
}

function InnerLayout({
  ssrTheme,
  children,
}: {
  ssrTheme: boolean;
  children: ReactNode;
}) {
  const [theme] = useTheme();

  console.log(`useTheme() inside InnerLayout = ${theme}`);
  console.log(`ssrTheme inside InnerLayout = ${ssrTheme}`);

  return (
    <html lang="en" className={clsx(theme ?? "")}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <PreventFlashOnWrongTheme ssrTheme={ssrTheme} />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

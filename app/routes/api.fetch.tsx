import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { db } from "~/db/index.server";
import { members } from "~/db/schema.server";
import { env } from "~/config/env.server";
import type { LoaderFunctionArgs } from "@remix-run/router";

// Based on: https://www.stefanjudis.com/blog/how-to-use-headless-chrome-in-serverless-functions/

// https://vercel.com/docs/functions/configuring-functions/duration
export const config = {
  maxDuration: 60,
};

function isValidAuth(headers: Headers) {
  const authHeader = headers.get("authorization");

  return authHeader === `Bearer ${env.CRON_SECRET}`;
}

async function getBrowser() {
  if (env.CHROME_PATH) {
    return puppeteer.launch({
      executablePath: "chrome/win64-126.0.6478.182/chrome-win64/chrome.exe",
      headless: true,
    });
  } else {
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isValidAuth(request.headers)) {
    return new Response(JSON.stringify({ status: "unauthorized" }), {
      status: 401,
    });
  }
  const time = performance.now();
  try {
    console.log("1. Data fetch starting!");
    const browser = await getBrowser();
    console.log("2. Browser created!");
    const page = await browser.newPage();
    console.log("3. New page created");
    await page.goto("https://magyartisza.hu/rendszervaltas");
    console.log("4. Went to tisza!");
    page.setDefaultTimeout(50_000);
    const handle = await page.waitForSelector(
      "::-p-xpath(//p[contains(text(), 'fő')])",
    );
    console.log("5. Selected member element!");
    const numOfMembersStringRaw = await handle?.evaluate((a) => a.innerHTML);
    console.log("6. Evaluated element!");
    if (!numOfMembersStringRaw) {
      return new Response(JSON.stringify({ status: "element-not-found" }), {
        status: 502,
      });
    }

    // pattern: " <members> fő", where <members> has separating commas
    const numOfMembersString = numOfMembersStringRaw
      .split(" ")[1]
      .replaceAll(",", "");
    const numOfMembers = parseInt(numOfMembersString, 10);

    console.log("7. Parsed member count:", numOfMembers);

    await db.insert(members).values({
      memberCount: numOfMembers,
    });

    console.log("8. Inserted data point to DB!");

    console.log(`Took: ${performance.now() - time} ms`);
    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
    });
  } catch (e) {
    console.error("Error occurred while fetching member count", e);
    console.log(`Took: ${performance.now() - time} ms`);
    return new Response(JSON.stringify({ status: "unexpected-error" }), {
      status: 500,
    });
  }
}

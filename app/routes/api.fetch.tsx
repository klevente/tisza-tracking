import { setTimeout } from "node:timers/promises";
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

const TISZA_URL = "https://magyartisza.hu/tamogass/rendszervalto-kartya";
const MEMBER_COUNT_SELECTOR = "::-p-xpath(//div[contains(text(), 'Fő')])";
const NBSP_REPLACER = /&nbsp;|\u00A0/g;

function isValidAuth(headers: Headers) {
  const authHeader = headers.get("authorization");

  return authHeader === `Bearer ${env.CRON_SECRET}`;
}

async function getBrowser() {
  if (env.CHROME_PATH) {
    return puppeteer.launch({
      executablePath: env.CHROME_PATH,
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
    await page.goto(TISZA_URL);
    console.log("4. Went to tisza!");
    page.setDefaultTimeout(50_000);
    await setTimeout(10_000);
    const handle = await page.waitForSelector(MEMBER_COUNT_SELECTOR);
    console.log("5. Selected member element!");
    const numOfMembersStringRaw = await handle?.evaluate((a) => a.innerHTML);
    console.log("6. Evaluated element!");
    if (!numOfMembersStringRaw) {
      return new Response(JSON.stringify({ status: "element-not-found" }), {
        status: 502,
      });
    }

    // pattern: "<members> Fő", where <members> has separating &nbsps
    const split = numOfMembersStringRaw.split(/\s+/);
    const numOfMembersString = split.slice(0, -1).join("");
    const numOfMembersDigits = numOfMembersString.replace(NBSP_REPLACER, "");
    const numOfMembers = parseInt(numOfMembersDigits, 10);

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

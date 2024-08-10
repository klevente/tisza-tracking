import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { db } from "~/db/index.server";
import { members } from "~/db/schema.server";

// Optional: If you'd like to use the new headless mode. "shell" is the default.
// NOTE: Because we build the shell binary, this option does not work.
//       However, this option will stay so when we migrate to full chromium it will work.
chromium.setHeadlessMode = true;

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;

// https://www.stefanjudis.com/blog/how-to-use-headless-chrome-in-serverless-functions/

export const config = {
  maxDuration: 30,
};

export async function loader() {
  const time = performance.now();
  console.log("1. Fetch called!");
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  console.log("2. Browser created!");
  /*const browser = await puppeteer.launch({
    executablePath: "chrome/win64-126.0.6478.182/chrome-win64/chrome.exe",
    headless: true,
  });*/
  const page = await browser.newPage();
  console.log("3. New page created");
  await page.goto("https://magyartisza.hu/rendszervaltas");
  console.log("4. Went to tisza!");
  page.setDefaultTimeout(50_000);
  const x = await page.waitForSelector(
    "::-p-xpath(//p[contains(text(), 'fő')])",
  );
  console.log("5. Selected member element!");
  const numOfMembersStringRaw = await x?.evaluate((a) => a.innerHTML);
  console.log("6. Evaluated element!");
  if (!numOfMembersStringRaw) {
    return new Response("nope", {
      status: 200,
    });
  }

  // pattern: " <members> fő", where <members> has separating commas
  const numOfMembersString = numOfMembersStringRaw
    .split(" ")[1]
    .replaceAll(",", "");
  const numOfMembers = parseInt(numOfMembersString, 10);

  console.log("7. This is it", numOfMembers, typeof numOfMembers);

  await db.insert(members).values({
    memberCount: numOfMembers,
  });

  console.log("8. Inserted data point to DB!");

  console.log(`Took: ${performance.now() - time} ms`);
  return new Response(JSON.stringify(numOfMembers), {
    status: 200,
  });
}

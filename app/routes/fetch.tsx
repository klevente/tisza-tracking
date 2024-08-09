import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Optional: If you'd like to use the new headless mode. "shell" is the default.
// NOTE: Because we build the shell binary, this option does not work.
//       However, this option will stay so when we migrate to full chromium it will work.
chromium.setHeadlessMode = true;

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;

export async function loader() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.goto("https://magyartisza.hu/rendszervaltas");
  const pageTitle = await page.title();
  await browser.close();
  console.log(pageTitle);
  return new Response(JSON.stringify(pageTitle), {
    status: 200,
  });
}

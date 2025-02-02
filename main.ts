/**
 * 🤘 Welcome to Stagehand!
 * 
 * This script automates generating UI components using v0.dev
 * 
 * @Stagehand
 * - Uses Stagehand's act() for all Playwright interactions, wrapped in try-catch blocks
 * - Uses extract() to get structured data from the page using Zod schemas
 * - Uses observe() to check page state and validate actions
 * 
 * TO RUN THIS PROJECT:
 * ```
 * npm install
 * npm run start -- --flowerType="rose"
 * ```
 */

import { Page, BrowserContext, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import chalk from "chalk";
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from 'fs/promises';

console.log(chalk.blue("🚀 Starting v0.dev automation..."));

dotenv.config();
console.log(chalk.gray("📝 Loaded environment variables"));

// Constants
const COOKIES_PATH = './cookies.json';
const MAX_GENERATION_TIME = 180000; // 3 minutes

/**
 * Load saved cookies from disk
 * @returns Promise<any[]> Array of cookie objects
 */
async function loadCookies(): Promise<any[]> {
  console.log(chalk.gray("🍪 Attempting to load cookies from disk..."));
  try {
    const cookiesData = await fs.readFile(COOKIES_PATH, 'utf-8');
    console.log(chalk.green("✅ Successfully loaded cookies"));
    return JSON.parse(cookiesData);
  } catch (error) {
    console.log(chalk.yellow("⚠️ No cookies found on disk"));
    return [];
  }
}

/**
 * Save cookies to disk for persistence
 * @param cookies Array of cookie objects to save
 */
async function saveCookies(cookies: any[]) {
  console.log(chalk.gray("💾 Saving cookies to disk..."));
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log(chalk.green("✅ Cookies saved successfully"));
}

// Parse CLI args - requires delivery address
const argv = yargs(hideBin(process.argv))
  .option("flowerType", {
    type: "string",
    description: "Type of flower to generate (e.g. rose, tulip, etc)",
    demandOption: true
  })
  .argv;

async function checkAndLogin(page: Page) {
  const actions = await page.observe({
    instruction: "check if there are any sign in or login elements on the page"
  });
  const needsLogin = actions.some(action => 
    action.description.toLowerCase().includes('sign in') || 
    action.description.toLowerCase().includes('login')
  );

  if (needsLogin) {
    await page.act({ action: "click the sign in button" });
    await page.act({ action: "click sign in with github" });

    if (process.env.GITHUB_EMAIL && process.env.GITHUB_PASSWORD) {
      await page.act({ 
        action: "enter %email% into the email field",
        variables: { email: process.env.GITHUB_EMAIL }
      });
      await page.act({ 
        action: "enter %password% into the password field",
        variables: { password: process.env.GITHUB_PASSWORD }
      });
      await page.act({ action: "click the sign in button" });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const postLoginActions = await page.observe({
        instruction: "check if there are any sign in or login elements on the page"
      });
      const stillNeedsLogin = postLoginActions.some(action => 
        action.description.toLowerCase().includes('sign in') || 
        action.description.toLowerCase().includes('login')
      );

      if (!stillNeedsLogin) {
        const cookies = await page.context().cookies();
        await saveCookies(cookies);
        return true;
      }
      throw new Error('Login failed - still seeing login elements after attempt');
    }
  }
  return false;
}
async function waitForGeneration(page: Page) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_GENERATION_TIME) {
    console.log(chalk.gray("🔍 Waiting for generation to complete..."));
    try {
      await page.locator('span.hidden.sm\\:inline-block:text("Retry")').waitFor({timeout: 5000});
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('Generation timed out');
}

async function extractCode(page: Page) {
  let attempts = 0;
  const maxAttempts = 5;

  console.log(chalk.gray("🔍 Extracting code..."));
  
  while (attempts < maxAttempts) {
    try {
      console.log(chalk.gray(`🔍 Attempt ${attempts + 1} of ${maxAttempts}`));
      console.log(chalk.gray("🔍 Clicking the Code tab"));

      // Try multiple selector strategies
      try {
        await page.locator('span:text("Code")').click();
      } catch {
        try {
          await page.getByRole('tab', { name: 'Code' }).click();
        } catch {
          await page.act({ 
            action: "click the Code tab in the top navigation" 
          });
        }
      }

      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Target the specific copy button with unique properties
      const copyButton = page.locator('button[aria-label="Copy"]:has(svg.copy-icon)');
      await copyButton.first().click();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const codeContent = await page.evaluate(() => navigator.clipboard.readText());

      if (codeContent && codeContent.trim().length > 0) {
        if (codeContent.includes('import') || 
            codeContent.includes('function') || 
            codeContent.includes('const') ||
            codeContent.includes('class') ||
            codeContent.includes('export') ||
            codeContent.includes('interface') ||
            codeContent.includes('type')) {
          return { 'code.tsx': codeContent };
        }
      }
    } catch (error) {
      console.log('Code extraction attempt failed:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Failed to extract code after multiple attempts');
}

export async function main({
  page,
  context,
  stagehand,
}: {
  page: Page;
  context: BrowserContext;
  stagehand: Stagehand;
}) {
  const flowerType = (argv as any).flowerType;
  console.log(chalk.blue(`🌸 Generating design for: ${flowerType}`));

  try {
    console.log(chalk.gray("🌐 Navigating to v0.dev..."));
    await page.goto("https://v0.dev");
    console.log(chalk.green("✅ Loaded V0.dev"));

    // Load saved cookies if they exist
    const cookies = await loadCookies();
    if (cookies.length > 0) {
      await context.addCookies(cookies);
    }

    // Check login and handle if needed
    if(!cookies.length) {
      const needsLogin = await checkAndLogin(page);
      if (needsLogin) {
        console.log(chalk.green("✅ Successfully logged in"));
      }
    }

    // Enter the prompt
    const prompt = `Create a beautiful ${flowerType} themed Valentine's day card with a romantic message. Make sure that it is only a single file.`;
    await page.act({ 
      action: "enter %prompt% into the prompt textarea",
      variables: { prompt }
    });

    // Submit prompt
    await page.keyboard.press('Enter');
    console.log(chalk.gray("⏳ Waiting for generation..."));

    // Wait for generation
    await waitForGeneration(page);
    console.log(chalk.green("✅ Generation complete"));

    // Extract the code
    const files = await extractCode(page);
    console.log(chalk.green("✅ Code extracted successfully"));

    // Save latest cookies
    const latestCookies = await context.cookies();
    await saveCookies(latestCookies);

    return files;

  } catch (error) {
    console.error(chalk.red("❌ Error:"), error);
    throw error;
  }
}

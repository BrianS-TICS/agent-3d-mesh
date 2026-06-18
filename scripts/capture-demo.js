/**
 * LinkedIn Demo Screenshot & Video Capture Script
 * Captures professional screenshots of the Agent 3D Mesh UI
 * 
 * Uses exact element IDs from app.html for reliable selection
 * 
 * Usage: node scripts/capture-demo.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'demo-assets');
const BASE_URL = 'http://localhost:3000/app.html';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureDemo() {
  console.log('🚀 Starting LinkedIn demo capture...\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // SCREENSHOT 1: Main App - Full Overview
    // ==========================================
    console.log('📸 [1/6] Loading main app...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(2500); // Let UI animations settle

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-full-app-overview.png'),
      fullPage: false
    });
    console.log('  ✅ 01-full-app-overview.png saved');

    // ==========================================
    // SCREENSHOT 2: Sidebar Configuration Panel
    // ==========================================
    console.log('\n📸 [2/6] Showcasing configuration options...');
    
    // Hover over the Gemini model selector to show options
    await page.hover('#geminiModel');
    await sleep(500);
    
    // Click the 3D Engine dropdown to show it open
    await page.click('#tripoEngine');
    await sleep(600);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-configuration-panel.png'),
      fullPage: false
    });
    console.log('  ✅ 02-configuration-panel.png saved');
    await page.keyboard.press('Escape');
    await sleep(300);

    // ==========================================
    // SCREENSHOT 3: Prompt Entered
    // ==========================================
    console.log('\n📸 [3/6] Entering a text prompt...');
    
    // Click on the prompt textarea
    await page.click('#promptInput');
    await sleep(300);
    
    // Type the demo prompt with realistic speed
    await page.type('#promptInput', 'A futuristic glowing cyberpunk sword', { delay: 35 });
    await sleep(800);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03-prompt-filled.png'),
      fullPage: false
    });
    console.log('  ✅ 03-prompt-filled.png saved');

    // ==========================================
    // SCREENSHOT 4: Art Style selected
    // ==========================================
    console.log('\n📸 [4/6] Selecting Cyberpunk art style...');
    
    await page.selectOption('#styleModifier', 'cyberpunk sci-fi style');
    await sleep(600);
    
    await page.selectOption('#textureQuality', 'detailed');
    await sleep(400);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04-style-configured.png'),
      fullPage: false
    });
    console.log('  ✅ 04-style-configured.png saved');

    // ==========================================
    // SCREENSHOT 5: Gallery/History Sidebar
    // ==========================================
    console.log('\n📸 [5/6] Showcasing the history sidebar...');
    
    // Click Show All gallery button
    const galleryBtn = page.locator('#showGalleryBtn');
    if (await galleryBtn.isVisible().catch(() => false)) {
      await galleryBtn.click();
      await sleep(1200);
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05-gallery-view.png'),
      fullPage: false
    });
    console.log('  ✅ 05-gallery-view.png saved');

    // ==========================================
    // SCREENSHOT 6: Generate Button (hovered)
    // ==========================================
    console.log('\n📸 [6/6] Showcasing the generate button...');
    
    // Close gallery if open
    await page.keyboard.press('Escape');
    await sleep(300);
    
    // Scroll to center on generate button
    await page.locator('#generateBtn').scrollIntoViewIfNeeded();
    await sleep(300);
    
    // Hover over the generate button for the glowing effect
    await page.hover('#generateBtn');
    await sleep(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06-generate-button-hover.png'),
      fullPage: false
    });
    console.log('  ✅ 06-generate-button-hover.png saved');

    console.log('\n✅ All screenshots captured successfully!');

  } catch (error) {
    console.error('\n❌ Error during capture:', error.message);
    // Emergency screenshot
    try {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'emergency-screenshot.png')
      });
      console.log('  📸 Emergency screenshot saved');
    } catch (e) {}
  } finally {
    await context.close(); // This saves the video
    await browser.close();
    
    // List all files
    console.log('\n📋 Files in demo-assets/:');
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(f => {
      const size = fs.statSync(path.join(OUTPUT_DIR, f)).size;
      console.log(`  - ${f} (${(size/1024).toFixed(1)} KB)`);
    });

    console.log('\n🎯 LinkedIn Post Strategy:');
    console.log('  📌 Option 1 (Best): Upload screenshots as a CAROUSEL (PDF document)');
    console.log('     → LinkedIn carousels get 3x more engagement than single images');
    console.log('  📌 Option 2: Upload the .webm video directly to LinkedIn');
    console.log('  📌 Option 3: Convert video to GIF for GitHub README');
    console.log('\n  To convert webm → GIF (if ffmpeg is installed):');
    console.log('  ffmpeg -i demo-assets/video.webm -vf "fps=10,scale=800:-1" demo-assets/demo.gif');
  }
}

captureDemo().catch(console.error);

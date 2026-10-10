const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Click on "Ranked Sandbox"
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('h3, button, div'));
    const target = elements.find(el => el.textContent && el.textContent.includes('Ranked Sandbox'));
    if (target) {
      target.closest('button')?.click() || target.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'sandbox_page.png' });

  // Also navigate back and click "Ranked"
  await page.evaluate(() => {
    const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Exit Sandbox'));
    if (exitBtn) exitBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('h3, button, div'));
    const target = elements.find(el => el.textContent && el.textContent.trim() === 'Ranked Mode');
    if (target) {
      target.closest('button')?.click() || target.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'ranked_lobby_page.png' });

  await browser.close();
  console.log("Screenshots captured!");
})();

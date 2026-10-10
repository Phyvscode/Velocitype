import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[pageerror] ${error.message}`));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click MULTIPLAYER (Versus)
  const buttons = await page.$$('button');
  for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('V')) {
          await b.click();
          console.log("Clicked Versus mode");
          break;
      }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click Ranked (but NOT Ranked Sandbox)
  const buttons2 = await page.$$('button');
  for (const b of buttons2) {
      const text = await page.evaluate(el => el.textContent, b);
      // We want to click "Ranked" but skip "Ranked Sandbox"
      if (text && text.includes('Ranked') && !text.includes('Sandbox')) {
          await b.click();
          console.log("Clicked Ranked Mode");
          break;
      }
  }

  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();

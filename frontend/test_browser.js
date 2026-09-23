const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/setup');
  
  // click "Play Ranked" button
  // text is "Ranked Match" or "Play Ranked"
  const elements = await page.$$('button, div');
  for (const el of elements) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('RANKED MODE')) {
      await el.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // also check sandbox
  await page.goto('http://localhost:5173/setup');
  for (const el of elements) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('RANKED SANDBOX')) {
      await el.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();

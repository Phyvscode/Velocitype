const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1000));
  
  // click "Play Ranked" button
  console.log('Clicking Ranked Mode...');
  const elements = await page.$$('button, div, span, h3');
  for (const el of elements) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('RANKED MODE')) {
      await el.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Sandbox...');
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1000));
  const elements2 = await page.$$('button, div, span, h3');
  for (const el of elements2) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('RANKED SANDBOX')) {
      await el.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();

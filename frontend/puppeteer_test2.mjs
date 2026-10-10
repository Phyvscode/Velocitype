import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking Sandbox...");
  
  const buttons = await page.$$('button');
  for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Ranked Sandbox')) {
          await b.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();

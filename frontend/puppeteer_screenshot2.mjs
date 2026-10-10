import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  const buttons = await page.$$('button');
  for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Ranked Sandbox')) {
          console.log("Clicking button...");
          await b.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'sandbox2.png' });
  await browser.close();
})();

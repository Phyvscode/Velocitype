const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
  await page.goto('http://localhost:5173/ranked');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY:\n" + bodyText.substring(0, 500));
  
  await browser.close();
})();

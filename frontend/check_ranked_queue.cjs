const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/setup');
  await new Promise(r => setTimeout(r, 1000));
  
  const elements = await page.$$('button, div, span, h3');
  for (const el of elements) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('RANKED MODE')) {
      await el.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:");
  console.log(bodyText);

  await browser.close();
})();

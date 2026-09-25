const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/setup');
  await new Promise(r => setTimeout(r, 2000));
  
  const h3s = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3')).map(h => h.innerText);
  });
  console.log("H3s:", h3s);
  
  await browser.close();
})();

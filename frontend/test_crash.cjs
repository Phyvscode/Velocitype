const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('CRASH:', err.message));
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, div, span, h3'));
    const rankedBtn = btns.find(el => el.innerText && el.innerText.includes('RANKED MODE'));
    if (rankedBtn) rankedBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();

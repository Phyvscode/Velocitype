const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/');
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

  const btns = await page.$$('button');
  for (const el of btns) {
    const text = await el.evaluate(e => e.innerText || e.textContent);
    if (text && text.includes('Find Match')) {
      await el.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();

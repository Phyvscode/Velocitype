import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/?page=setup', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent);
  });
  
  console.log('Buttons:', buttons);
  
  await browser.close();
})();

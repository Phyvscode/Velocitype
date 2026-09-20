import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5174/?page=game', { waitUntil: 'networkidle0' });
  
  // wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Type space multiple times or just type the words
  for (let i = 0; i < 30; i++) {
    await page.keyboard.type('test ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();

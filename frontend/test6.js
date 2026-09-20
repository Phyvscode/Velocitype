import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE UNCAUGHT ERROR:', err.message);
  });
  
  await page.goto('http://localhost:5174/?page=setup', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click start
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('Start Game') || b.textContent.includes('Start'));
    if (startBtn) startBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Type something to finish the game quickly
  for (let i = 0; i < 30; i++) {
    await page.keyboard.type('test ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Errors:', errors);
  const html = await page.content();
  console.log('Is Results Screen?', html.includes('Round complete') || html.includes('Match Results'));
  
  await browser.close();
})();

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
  await page.click('button:has-text("Start Game")');
  await new Promise(r => setTimeout(r, 1000));
  
  // Type something to finish the game quickly
  // The default game is words mode (20 words) or time mode (15 sec)
  for (let i = 0; i < 30; i++) {
    await page.keyboard.type('test ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Errors:', errors);
  const html = await page.content();
  console.log('Is Results Screen?', html.includes('Round complete'));
  
  await browser.close();
})();

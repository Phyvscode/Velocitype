import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/?page=setup', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click start
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('Start Game') || b.textContent.includes('Start'));
    if (startBtn) startBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // take a screenshot
  await page.screenshot({ path: 'test_game.png' });
  
  // type
  for (let i = 0; i < 30; i++) {
    await page.keyboard.type('test ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'test_after.png' });
  
  await browser.close();
})();

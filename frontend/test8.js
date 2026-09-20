import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/?page=setup', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('Start Game') || b.textContent.includes('Start'));
    if (startBtn) startBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // type exactly the words on screen to win!
  const words = await page.evaluate(() => {
    const wordsEl = document.querySelectorAll('.word');
    return Array.from(wordsEl).map(el => el.textContent.trim()).filter(Boolean);
  });
  
  console.log('Words to type:', words.length);
  for (const word of words) {
    await page.keyboard.type(word + ' ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log('Is Results Screen?', html.includes('Round complete'));
  if (!html.includes('Round complete')) {
     console.log('DOM:', html.substring(0, 1000));
  }
  
  await browser.close();
})();

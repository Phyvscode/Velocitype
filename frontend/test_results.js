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
  
  await page.goto('http://localhost:5174', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Expose a function to set the app state to ResultsScreen
  await page.evaluate(() => {
    const root = document.querySelector('#root');
    // React stores the internal instance on the DOM node.
    // We can't easily access the setter, so let's just trigger a click that starts the game.
    // Instead of clicking the start button (which is complex due to portal), we can dispatch a custom event if we want, or type 'w' to go to Words mode, etc.
  });
  
  // Just type 'W' then 'S'
  await page.keyboard.type('w');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.type('s');
  await new Promise(r => setTimeout(r, 1000));
  
  // Now we should be in GameScreen! Let's verify.
  let html = await page.content();
  console.log('Is Game Screen?', html.includes('Quit'));
  
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
  
  html = await page.content();
  console.log('Is Results Screen?', html.includes('Round complete'));
  if (!html.includes('Round complete')) {
     console.log('DOM length:', html.length);
  }
  
  await browser.close();
})();

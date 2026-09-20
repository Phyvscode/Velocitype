import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5174/?page=game', { waitUntil: 'networkidle0' });
  
  // Type 20 words quickly to finish the game
  for (let i = 0; i < 30; i++) {
    await page.keyboard.type('test ');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log(html.substring(0, 500));
  
  await browser.close();
})();

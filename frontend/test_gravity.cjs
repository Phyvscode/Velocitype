const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
  await page.goto('http://localhost:5173/setup');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Login as guest
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs.length > 0) {
      inputs[0].value = 'testuser';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(inputs[0], 'testuser');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      
      const btns = document.querySelectorAll('button');
      const guestBtn = Array.from(btns).find(b => b.innerText.includes('Guest'));
      if (guestBtn) guestBtn.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));

  // Click V tab
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    const vTab = Array.from(tabs).find(b => b.innerText.trim() === 'V');
    if (vTab) vTab.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Click Ranked Mode button
  await page.evaluate(() => {
    const h3s = document.querySelectorAll('h3');
    const rankedH3 = Array.from(h3s).find(h => h.innerText === 'RANKED');
    if (rankedH3) {
      rankedH3.closest('button').click();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => img.src);
  });
  console.log("IMAGES RENDERED:", imgs);
  
  await browser.close();
})();

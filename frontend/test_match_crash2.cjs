const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`ERROR:`, msg.text());
  });
  page.on('pageerror', err => console.log(`CRASH:`, err.message));
  
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
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY AFTER RANKED CLICK:\n" + bodyText.substring(0, 500));
  
  await browser.close();
})();

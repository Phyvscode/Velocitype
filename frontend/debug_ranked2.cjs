const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  await page.goto('http://localhost:5173/setup');
  
  await new Promise(r => setTimeout(r, 2000));
  
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
  
  await new Promise(r => setTimeout(r, 2000));

  // Find Ranked Mode button and click it
  await page.evaluate(() => {
    const h3s = document.querySelectorAll('h3');
    const rankedH3 = Array.from(h3s).find(h => h.innerText === 'RANKED');
    if (rankedH3) {
      console.log('Found Ranked button, clicking its closest button...');
      rankedH3.closest('button').click();
    } else {
      console.log('Ranked button NOT FOUND');
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY AFTER CLICK:\n" + bodyText.substring(0, 500));
  
  await browser.close();
})();

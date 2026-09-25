const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
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

  // Click VERSUS tab
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    const versusTab = Array.from(tabs).find(b => b.innerText.includes('VERSUS'));
    if (versusTab) versusTab.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'before_click.png' });

  // Click Ranked Mode button
  await page.evaluate(() => {
    const h3s = document.querySelectorAll('h3');
    const rankedH3 = Array.from(h3s).find(h => h.innerText === 'RANKED');
    if (rankedH3) {
      rankedH3.closest('button').click();
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'after_click.png' });
  
  await browser.close();
})();

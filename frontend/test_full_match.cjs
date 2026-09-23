const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  
  const createPlayer = async (name) => {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[${name}] ERROR:`, msg.text());
    });
    page.on('pageerror', err => console.log(`[${name}] CRASH:`, err.message));
    
    await page.goto('http://localhost:5173/setup');
    
    // Login as guest
    await new Promise(r => setTimeout(r, 1000));
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      await inputs[0].type(name);
      const guestBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Guest'));
      });
      if (guestBtn) await guestBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    const elements = await page.$$('button, div, span, h3');
    for (const el of elements) {
      const text = await el.evaluate(e => e.innerText || e.textContent);
      if (text && text.includes('RANKED MODE')) {
        await el.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));

    const btns = await page.$$('button');
    for (const el of btns) {
      const text = await el.evaluate(e => e.innerText || e.textContent);
      if (text && text.includes('Play Ranked')) {
        await el.click();
        break;
      }
    }
    return page;
  };

  const p1 = await createPlayer('player1');
  const p2 = await createPlayer('player2');

  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();

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
      
      const btns = await page.$$('button');
      for (const btn of btns) {
        const text = await btn.evaluate(e => e.innerText || e.textContent);
        if (text && text.includes('Guest')) {
          await btn.click();
          break;
        }
      }
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

    const btns2 = await page.$$('button');
    for (const el of btns2) {
      const text = await el.evaluate(e => e.innerText || e.textContent);
      if (text && text.includes('Play Ranked')) {
        await el.click();
        break;
      }
    }
    return page;
  };

  console.log("Creating Player 1...");
  const p1 = await createPlayer('player1');
  console.log("Creating Player 2...");
  const p2 = await createPlayer('player2');

  console.log("Waiting for match to start...");
  await new Promise(r => setTimeout(r, 5000));
  
  const p1Body = await p1.evaluate(() => document.body.innerText);
  if (p1Body.includes('Waiting for players to be ready')) {
    console.log("SUCCESS: Match screen loaded!");
  } else {
    console.log("FAILED to load match screen!");
    console.log("P1 BODY:");
    console.log(p1Body);
  }
  
  await browser.close();
})();

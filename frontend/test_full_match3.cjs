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
    await page.evaluate((n) => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        inputs[0].value = n;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        const btns = document.querySelectorAll('button');
        const guestBtn = Array.from(btns).find(b => b.innerText.includes('Guest'));
        if (guestBtn) guestBtn.click();
      }
    }, name);
    
    await new Promise(r => setTimeout(r, 1000));

    // Click Ranked Mode button
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const rankedBtn = Array.from(btns).find(b => b.innerText.includes('Ranked'));
      if (rankedBtn) rankedBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));

    // Click Play Ranked
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const playBtn = Array.from(btns).find(b => b.innerText.includes('Play Ranked'));
      if (playBtn) playBtn.click();
    });
    
    return page;
  };

  console.log("Creating Player 1...");
  const p1 = await createPlayer('player1');
  console.log("Creating Player 2...");
  const p2 = await createPlayer('player2');

  console.log("Waiting for match to start...");
  await new Promise(r => setTimeout(r, 5000));
  
  const p1Body = await p1.evaluate(() => document.body.innerText);
  if (p1Body.includes('Waiting for players to be ready') || p1Body.includes('SEC')) {
    console.log("SUCCESS: Match screen loaded!");
  } else {
    console.log("FAILED to load match screen!");
    console.log("P1 BODY:");
    console.log(p1Body);
  }
  
  await browser.close();
})();

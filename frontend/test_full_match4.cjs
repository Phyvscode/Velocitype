const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  await page.goto('http://localhost:5173/setup');
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    const rankedBtn = Array.from(btns).find(b => b.querySelector('h3') && b.querySelector('h3').innerText.includes('Ranked Mode'));
    if (rankedBtn) {
      console.log("Found Ranked Mode button! Clicking...");
      rankedBtn.click();
    } else {
      console.log("Could not find Ranked Mode button!");
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:");
  console.log(bodyText);

  await browser.close();
})();

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER_ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE_ERROR:', error.message);
    });

    console.log('Navigating to http://localhost:5173/tips...');
    await page.goto('http://localhost:5173/tips', { waitUntil: 'networkidle2' });

    await browser.close();
})();

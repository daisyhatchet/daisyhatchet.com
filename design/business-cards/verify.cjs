const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/Dan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('../../node_modules/sharp');
(async () => {
 const root = __dirname;
 fs.mkdirSync(path.join(root, 'previews'), { recursive: true });
 const browser = await chromium.launch({ headless: true });
 const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1.5 });
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://' + root + '/index.html');
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(root,'previews','concept-families.png'),fullPage:true});
 const families=await page.locator('.family-grid > .family').count();
 await page.setViewportSize({width:390,height:844});
 const groupedMobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.screenshot({path:path.join(root,'previews','concept-families-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1100});
 await page.locator('.family').evaluateAll(els=>els.forEach(el=>el.open=true));
 const overflow = await page.evaluate(()=>[...document.querySelectorAll('.face svg')].flatMap((svg,i)=>[...svg.querySelectorAll('g[aria-label]')].flatMap(g=>{
  const b=g.getBBox();const v=svg.viewBox.baseVal;
  return b.x<15||b.y<15||b.x+b.width>v.width-15||b.y+b.height>v.height-15 ? [{card:Math.floor(i/2)+1,side:i%2,label:g.getAttribute('aria-label'),box:{x:b.x,y:b.y,w:b.width,h:b.height},width:v.width,height:v.height}]:[];
 })));
 const cardCount=await page.locator('.concept').count();
 for(let n=1;n<=cardCount;n++) await page.locator('#option-'+n).screenshot({path:path.join(root,'previews',String(n).padStart(2,'0')+'.png')});
 const fronts=[];
 for(let n=1;n<=cardCount;n++){
  const svg=await page.locator('#option-'+n+' .face svg').first().evaluate(el=>el.outerHTML);
  const image=await sharp(Buffer.from(svg)).resize(600,343,{fit:'contain',background:'#e8e0d7'}).png().toBuffer();
  fronts.push({input:image,left:40+((n-1)%3)*640,top:80+Math.floor((n-1)/3)*415});
  const label=Buffer.from(`<svg width="600" height="40"><text x="0" y="28" font-family="Arial" font-size="21" fill="#29151f">${String(n).padStart(2,'0')} / ${await page.locator('#option-'+n+' h2').textContent()}</text></svg>`);
  fronts.push({input:label,left:40+((n-1)%3)*640,top:40+Math.floor((n-1)/3)*415});
 }
 await sharp({create:{width:1960,height:40+Math.ceil(cardCount/3)*415,channels:3,background:'#f1ece5'}}).composite(fronts).png().toFile(path.join(root,'overview.png'));
 await page.locator('[data-save="1"]').click();await page.locator('#filter').click();
 const shortlistVisible=await page.locator('.concept:not(.hidden)').count();
 await page.locator('#filter').click();await page.locator('[data-save="1"]').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-card="1"][data-side="0"]').click();const download=await downloadPromise;
 await page.setViewportSize({width:390,height:844});
 const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.screenshot({path:path.join(root,'previews','mobile.png')});
 await page.setViewportSize({width:1440,height:1100});
 for(const n of [6,7,9,12]){
  await page.locator('#option-'+n+' details').evaluate(el=>el.open=true);
  await page.locator('#option-'+n+' details svg').screenshot({path:path.join(root,'previews',String(n).padStart(2,'0')+'-in-use.png')});
 }
 await page.goto('file://'+root+'/visual-studies/index.html');
 const bonusOverflow=await page.evaluate(()=>[...document.querySelectorAll('.face svg')].flatMap((svg,i)=>[...svg.querySelectorAll('g[aria-label]')].flatMap(g=>{const b=g.getBoundingClientRect(),v=svg.getBoundingClientRect();return b.left<v.left-1||b.top<v.top-1||b.right>v.right+1||b.bottom>v.bottom+1?[{card:Math.floor(i/2)+1,side:i%2,label:g.getAttribute('aria-label')}]:[]})));
 console.log(JSON.stringify({families,groupedMobileOverflow,overflow,bonusOverflow,errors,shortlistVisible,download:download.suggestedFilename(),mobileOverflow},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

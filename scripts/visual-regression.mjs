import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/site-audit/node_modules/playwright-core');
const { PNG } = require('/tmp/site-audit/node_modules/pngjs');
const BASE = 'http://127.0.0.1:4321';
const NEW = 'http://127.0.0.1:4322';
const routes = ['/', '/work/', '/work/flipo-flip/', '/work/cumcm-2026/', '/work/xv6-oslabs/', '/notes/xv6-lab1/', '/tools/', '/about/', '/translator/'];
const cases = [];
for (const route of routes) {
  for (const lang of ['en','zh']) {
    for (const screen of [{name:'desktop',w:1280,h:900},{name:'mobile',w:390,h:844}]) {
      cases.push({ route, lang, screen, theme:'light' });
    }
  }
}
for (const route of ['/', '/tools/']) {
  cases.push({route, lang:'en', screen:{name:'desktop',w:1280,h:900}, theme:'dark'});
}
async function waitFor(url) {
  for(let i=0;i<60;i++){
    try {const x=await fetch(url);if(x.ok)return;}catch{}
    await new Promise(res=>setTimeout(res,1000));
  }
  throw new Error('Preview server unavailable: '+url);
}
function pixelMismatch(a,b) {
  if(a.equals(b))return 0;
  const x=PNG.sync.read(a),y=PNG.sync.read(b);
  if(x.width!==y.width||x.height!==y.height)return 1;
  let diff=0, num=x.width*x.height;
  for(let i=0;i<x.data.length;i+=4){
    if(Math.max(...[0,1,2].map(k=>Math.abs(x.data[i+k]-y.data[i+k])))>15)diff++;
  }
  return diff/num;
}
async function capture(browser,port,c,kind) {
  const context=await browser.newContext({viewport:{width:c.screen.w,height:c.screen.h},deviceScaleFactor:1, colorScheme:c.theme==='dark'?'dark':'light', reducedMotion:'reduce'});
  await context.addInitScript(({lang,theme})=>{
    localStorage.setItem('language',lang); localStorage.setItem('theme',theme);
  },{lang:c.lang,theme:c.theme});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(port+c.route,{waitUntil:'networkidle',timeout:40000});
  if(!response || response.status()>=400)throw new Error(kind+': bad HTTP '+c.route+' '+response?.status());
  await page.evaluate(()=>document.fonts.ready);
  const imgs=await page.evaluate(()=>Array.from(document.images).map(x=>({src:x.getAttribute('src'),ok:x.complete && x.naturalWidth>0})));
  if(imgs.some(x=>!x.ok))throw new Error(kind+' '+c.route+' broken images '+JSON.stringify(imgs.filter(x=>!x.ok)));
  if(errors.length)throw new Error(kind+' '+c.route+' JS '+JSON.stringify(errors));
  if(c.lang==='zh' && c.route!='/translator/' && documentShouldTranslate(c.route)){
    const lang=await page.evaluate(()=>document.documentElement.lang);
    if(lang!=='zh')throw new Error('Language switch not applied '+c.route);
  }
  if(c.route==='/translator/' && kind==='candidate' && c.lang==='en'&&c.screen.name==='desktop'){
    await page.locator('#userInput').fill('Hello 123');
    await page.locator('#encryptButton').click();
    const encoded=await page.locator('#outputDisplay').inputValue();
    if(!encoded || encoded==='Hello 123')throw new Error('Translator encode failed');
    await page.locator('#userInput').fill(encoded);
    await page.locator('#decryptButton').click();
    const decoded=await page.locator('#outputDisplay').inputValue();
    if(decoded!=='Hello 123')throw new Error('Translator decode failed: '+decoded);
    await page.locator('#userInput').fill('');
    await page.locator('#outputDisplay').evaluate(el=>el.value='');
  }
  const dir='audit/screenshots';
  const slug=c.route==='/'?'home':c.route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','_');
  const file=slug+'-'+c.lang+'-'+c.screen.name+'-'+c.theme+'-'+kind+'.png';
  const actual=await page.screenshot({path:dir+'/'+file,fullPage:true,animations:'disabled'});
  if(kind==='candidate'&&((c.route==='/'&&c.lang==='en'&&c.screen.name==='desktop')||(c.route==='/tools/'&&c.lang==='zh'&&c.screen.name==='desktop'))&&c.theme==='light'){
    const jpeg=await page.screenshot({type:'jpeg',quality:48,fullPage:false});
    console.log('SAMPLE_JPEG_'+slug+':'+jpeg.toString('base64'));
  }
  await page.locator('img[src$=".gif"]').evaluateAll(imgs=>imgs.forEach(el=>el.style.visibility='hidden'));
  const comparable=await page.screenshot({fullPage:true,animations:'disabled'});
  await context.close();
  return {comparable,actual,imgs};
}
function documentShouldTranslate(route){return route!== '/translator/';}
await mkdir('audit/screenshots',{recursive:true});
await waitFor(BASE+'/');await waitFor(NEW+'/');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let failures=[];
for(const c of cases){
  const id=c.route+' '+c.lang+' '+c.screen.name+' '+c.theme;
  try{
    const before=await capture(browser,BASE,c,'baseline');
    const after=await capture(browser,NEW,c,'candidate');
    const ratio=pixelMismatch(before.comparable,after.comparable);
    console.log('PASS '+id+' pixel-diff='+ratio.toFixed(5)+' images='+after.imgs.length);
    if(ratio>0.002)failures.push(id+' visual diff '+ratio.toFixed(5));
  }catch(e){console.log('FAIL '+id+': '+e.stack);failures.push(id+' '+e.message)}
}
await browser.close();
console.log('AUDIT_TOTAL='+cases.length+' FAILURES='+failures.length);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}

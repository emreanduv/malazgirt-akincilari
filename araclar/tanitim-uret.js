const { chromium } = require('playwright');
const E=encodeURIComponent;
const jobs=[
 ['story-1-pek-yakinda',1080,1920,'bg=arka/dev-dik.png'],
 ['story-2-orduni-buyut',1080,1920,'bg=arka/kale-dik.png&ust='+E('ORDUNU BÜYÜT!')+'&alt='+E('Doğru kapıyı seç, Bizans\'ı dağıt.<br><b>Pek yakında</b> App Store ve Google Play\'de')],
 ['story-3-50-bolum',1080,1920,'bg=arka/katafrakt-dik.png&ust='+E('50 BÖLÜM')+'&alt='+E('5 bölge · 10 dev savaşı · reklamsız<br><b>Pek yakında</b> App Store ve Google Play\'de')],
 ['post-kare',1080,1080,'bg=arka/dev-kare.png&pos='+E('50% 85%')+''],
 ['post-dikey',1080,1350,'bg=arka/katafrakt-kare.png&etiket='+E('558 akıncı!')+'&ey=0.40'],
];
(async()=>{const b=await chromium.launch();
for(const [ad,w,h,q] of jobs){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(`http://localhost:8765/araclar/tanitim.html?w=${w}&h=${h}&${q}`);await p.waitForFunction(()=>document.title==='hazir');await p.locator('#w').screenshot({path:`./tanitim/${ad}.png`});await p.close();console.log(ad);}
await b.close();})();

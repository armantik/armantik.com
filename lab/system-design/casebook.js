/* System Design Casebook script: shared by the hub (lab/system-design-casebook.html) and the
   case study pages (lab/system-design/<name>/index.html). Each module checks that its topic is on
   the page (see NEED), so one file serves every page. */
(function(){
'use strict';
var SVGNS='http://www.w3.org/2000/svg';
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
var RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function S(tag,attrs,parent){var e=document.createElementNS(SVGNS,tag);if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function T(tag,attrs,parent,text){var e=S(tag,attrs,parent);e.textContent=text;return e;}
function trim(x){var a=Math.abs(x);if(a>=100)return String(Math.round(x));if(a>=10)return String(Math.round(x*10)/10);return String(Math.round(x*100)/100);}
function human(n){var a=Math.abs(n);if(a>=1e12)return trim(n/1e12)+'T';if(a>=1e9)return trim(n/1e9)+'B';if(a>=1e6)return trim(n/1e6)+'M';if(a>=1e3)return trim(n/1e3)+'K';return trim(n);}
function bytes(b){var u=['B','KB','MB','GB','TB','PB','EB'];var i=0;while(b>=1000&&i<u.length-1){b/=1000;i++;}return trim(b)+' '+u[i];}
var nf=new Intl.NumberFormat('en-US');
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function segInit(id,cb){var g=document.getElementById(id);if(!g)return;var bs=$$('button',g);bs.forEach(function(b){b.addEventListener('click',function(){bs.forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});cb(b.dataset.v,b);});});}
/* each module runs only on a page that has its topic: the hub, or one case study page */
var NEED={"estimator":"estimate","latency":"latency","legend":"scale","stepper":"scale","lb":"lb","cache-strategies":"cache","lru":"cache","ring":"hashing","cap":"cap","queue":"queues","tokenbucket":"ratelimit","url-diagram":"c-url","url-lab":"c-url","url-guides":"c-url","feed":"c-feed","chat":"c-chat","snowflake":"c-chat","geohash":"c-geo","geo-diagram":"c-geo","quorum":"c-kv","vc-lsm":"c-kv","pay-diagram":"c-pay","pay-sim":"c-pay","quiz":"quiz","frontier":"c-crawl","vdag":"c-video","usecases":"usecases","faq":"faq","glossary":"glossary","waterfall":"f-request","dns":"f-request","percentiles":"f-latency","tail-at-scale":"f-latency","nines":"f-avail","avail-chain":"f-avail","utilization":"f-load","littles-law":"f-load","data-models":"f-data","row-column":"f-data","comm":"f-comm","transfer":"f-units"};
function mod(name,fn){var need=NEED[name];if(need&&!document.getElementById(need))return;try{fn();}catch(e){if(window.console)console.error('['+name+']',e);}}

/* ---------- diagram builder ---------- */
function anchor(n,side,off){var o=off||0;
  if(side==='l')return [n.x,n.y+n.h/2+o];
  if(side==='r')return [n.x+n.w,n.y+n.h/2+o];
  if(side==='t')return [n.x+n.w/2+o,n.y];
  return [n.x+n.w/2+o,n.y+n.h];}
function buildDiagram(svg,spec){
  svg.setAttribute('viewBox','0 0 '+spec.w+' '+spec.h);
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  var nodes={},nodeEls={},edgeEls={};
  spec.nodes.forEach(function(n){nodes[n.id]=n;});
  var gA=S('g',{'class':'annos'},svg);
  (spec.annos||[]).forEach(function(a){T('text',{x:a.x,y:a.y,'text-anchor':a.anchor||'start','class':a.bold?'anno-t':'anno'},gA,a.t);});
  var gE=S('g',{'class':'edges'},svg),gN=S('g',{'class':'nodes'},svg);
  (spec.edges||[]).forEach(function(e,i){
    var pts;
    if(e.pts)pts=e.pts;
    else{
      var A=e.a.split('.'),B=e.b.split('.');
      var na=nodes[A[0]],nb=nodes[B[0]];
      var a=anchor(na,A[1],e.ao),b=anchor(nb,B[1],e.bo);
      var r=e.route||'straight';
      if(r==='hvh'){var mx=e.via!=null?e.via:(a[0]+b[0])/2;pts=[a,[mx,a[1]],[mx,b[1]],b];}
      else if(r==='vhv'){var my=e.via!=null?e.via:(a[1]+b[1])/2;pts=[a,[a[0],my],[b[0],my],b];}
      else if(r==='hv'){pts=[a,[b[0],a[1]],b];}
      else if(r==='vh'){pts=[a,[a[0],b[1]],b];}
      else pts=[a,b];
    }
    var d='M'+pts.map(function(p){return p[0]+' '+p[1];}).join(' L');
    var id=e.id||('e'+i);
    var g=S('g',{'class':'edge'+(e.cls?' '+e.cls:'')},gE);
    g.dataset.id=id;
    if(e.from!=null)g.dataset.from=e.from;
    if(e.to!=null)g.dataset.to=e.to;
    S('path',{d:d},g);
    if(e.label){
      var lx,ly;
      if(e.lp){lx=e.lp[0];ly=e.lp[1];}
      else{var best=-1,bi=0;for(var k=0;k<pts.length-1;k++){var L=Math.hypot(pts[k+1][0]-pts[k][0],pts[k+1][1]-pts[k][1]);if(L>best){best=L;bi=k;}}
        lx=(pts[bi][0]+pts[bi+1][0])/2;ly=(pts[bi][1]+pts[bi+1][1])/2-6;}
      T('text',{x:lx,y:ly,'text-anchor':e.la||'middle'},g,e.label);
    }
    edgeEls[id]=g;
  });
  spec.nodes.forEach(function(n){
    var g=S('g',{'class':'node '+(n.kind||'svc')+(n.cls?' '+n.cls:'')},gN);
    var x=n.x,y=n.y,w=n.w,h=n.h,cy=y+h/2,cx=x+w/2;
    if(n.kind==='store'){
      var ry=6;
      S('path',{'class':'shape',d:'M'+x+' '+(y+ry)+' A'+(w/2)+' '+ry+' 0 0 1 '+(x+w)+' '+(y+ry)+' V'+(y+h-ry)+' A'+(w/2)+' '+ry+' 0 0 1 '+x+' '+(y+h-ry)+' Z'},g);
      S('path',{'class':'deco',d:'M'+x+' '+(y+ry)+' A'+(w/2)+' '+ry+' 0 0 0 '+(x+w)+' '+(y+ry)},g);
      cy+=4;
    }else if(n.kind==='queue'){
      S('rect',{'class':'shape',x:x,y:y,width:w,height:h,rx:3},g);
      for(var k=1;k<=3;k++)S('line',{'class':'deco',x1:x+w-k*9,y1:y+5,x2:x+w-k*9,y2:y+h-5},g);
      cx=x+(w-27)/2;
    }else{
      S('rect',{'class':'shape',x:x,y:y,width:w,height:h,rx:n.kind==='client'?14:4},g);
    }
    if(n.s){T('text',{'class':'t',x:cx,y:cy-3,'text-anchor':'middle'},g,n.t);T('text',{'class':'s',x:cx,y:cy+12,'text-anchor':'middle'},g,n.s);}
    else T('text',{'class':'t',x:cx,y:cy+4.5,'text-anchor':'middle'},g,n.t);
    g.dataset.id=n.id;
    if(n.from!=null)g.dataset.from=n.from;
    if(n.to!=null)g.dataset.to=n.to;
    nodeEls[n.id]=g;
  });
  return {nodes:nodeEls,edges:edgeEls,svg:svg};
}

/* ---------- progress ----------
   Ticks are stored per topic id in localStorage (sdc-done-v1), shared by the casebook hub and the case
   study pages. A rail link carries data-sheet="<topic id>", so the hub can tick a case study that now
   lives on its own page, and a case study page can tick the others. */
mod('progress',function(){
  var KEY='sdc-done-v1',done={};
  function load(){try{done=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){done={};}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(done));}catch(e){}}
  load();
  var sections=$$('section.sheet[id]');
  var links=$$('.toc a[data-sheet]');
  var ids=links.length?links.map(function(a){return a.getAttribute('data-sheet');}):sections.map(function(s){return s.id;});
  function render(){
    sections.forEach(function(s){
      var b=$('.done-btn',s);if(!b)return;
      var on=!!done[s.id];b.setAttribute('aria-pressed',String(on));b.textContent=on?'Done ✓':'Mark done';
    });
    links.forEach(function(a){a.classList.toggle('done',!!done[a.getAttribute('data-sheet')]);});
    $$('[data-done-for]').forEach(function(el){el.hidden=!done[el.getAttribute('data-done-for')];});
    var c=ids.filter(function(id){return done[id];}).length;
    var n=$('#prog-n'),t=$('#prog-total'),bar=$('#prog-bar');
    if(n)n.textContent=c;
    if(t)t.textContent=ids.length;
    if(bar)bar.style.width=(ids.length?c/ids.length*100:0)+'%';
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.done-btn');if(!b)return;
    var s=b.closest('.sheet[id]');if(!s)return;
    var id=s.id;if(done[id])delete done[id];else done[id]=1;save();render();
  });
  /* another tab, or coming back with the browser's back button */
  window.addEventListener('storage',function(e){if(e.key===KEY){load();render();}});
  window.addEventListener('pageshow',function(){load();render();});
  render();
  var map={};
  links.forEach(function(a){map[a.getAttribute('data-sheet')]=a;});
  function reveal(a){
    var toc=a.closest('.toc');
    if(toc&&toc.scrollWidth>toc.clientWidth+4){toc.scrollTo({left:Math.max(0,a.offsetLeft-16),behavior:RM?'auto':'smooth'});}
  }
  var here=$('.toc a[aria-current="page"]');if(here)reveal(here);
  if('IntersectionObserver' in window&&!here){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        var a=map[en.target.id];if(!a)return;
        links.forEach(function(x){x.classList.toggle('active',x===a);});
        reveal(a);
      });
    },{rootMargin:'-15% 0px -75% 0px'});
    sections.forEach(function(s){io.observe(s);});
  }
});

/* ---------- estimator ---------- */
mod('estimator',function(){
  var P={url:{dau:10,r:33,w:0.33,size:0.5,yrs:10},feed:{dau:300,r:10,w:2,size:1,yrs:5},chat:{dau:50,r:40,w:40,size:0.1,yrs:5},photo:{dau:500,r:30,w:0.2,size:2000,yrs:10}};
  var ids=['dau','r','w','size','yrs','peak','rep'],el={};
  ids.forEach(function(k){el[k]=document.getElementById('e-'+k);});
  function num(k){var v=parseFloat(el[k].value);return isFinite(v)&&v>=0?v:0;}
  function out(k,v,f){$('#o-'+k).textContent=v;$('#f-'+k).textContent=f;}
  function calc(){
    var dau=num('dau')*1e6,r=num('r'),w=num('w'),size=num('size')*1e3,yrs=num('yrs'),peak=num('peak')||1,rep=num('rep')||1;
    var wq=dau*w/86400,rq=dau*r/86400,pr=rq*peak,pw=wq*peak;
    var day=dau*w*size,total=day*365*yrs*rep,inB=wq*size,outB=rq*size;
    out('wq',human(wq)+'/s',human(dau)+' × '+w+' ÷ 86,400');
    out('rq',human(rq)+'/s',human(dau)+' × '+r+' ÷ 86,400');
    out('pr',human(pr)+'/s',human(rq)+'/s × '+peak);
    out('day',bytes(day),human(dau*w)+' writes × '+bytes(size));
    out('total',bytes(total),'per day × 365 × '+yrs+' yr × '+rep+(rep===1?' copy':' copies'));
    out('bw',bytes(inB)+'/s','reads out ≈ '+bytes(outB)+'/s');
    var imp=[];
    if(pr>50000)imp.push(['r','Heavy','Peak reads near '+human(pr)+'/s: serve them from a cache tier and add read replicas. One database will not keep up.']);
    else if(pr>5000)imp.push(['a','Watch','Peak reads near '+human(pr)+'/s: close to the comfortable limit of one database. A cache plus a replica or two keeps headroom.']);
    else imp.push(['g','Fine','Peak reads near '+human(pr)+'/s: one well indexed database with a replica for failover handles this.']);
    if(pw>10000)imp.push(['r','Heavy','Peak writes near '+human(pw)+'/s: more than one primary can take. Shard the data or use a write optimized store such as Cassandra.']);
    else if(pw>1000)imp.push(['a','Watch','Peak writes near '+human(pw)+'/s: fine for a tuned primary; watch hot rows and index count.']);
    else imp.push(['g','Fine','Peak writes near '+human(pw)+'/s: one primary is plenty.']);
    if(total>1e14)imp.push(['r','Heavy','About '+bytes(total)+' over '+yrs+' years: partition across many machines and keep large blobs in object storage.']);
    else if(total>5e12)imp.push(['a','Watch','About '+bytes(total)+' over '+yrs+' years: more than one server should hold. Plan partitioning from the start.']);
    else imp.push(['g','Fine','About '+bytes(total)+' over '+yrs+' years: fits on one database server with room to grow.']);
    if(outB>1e9)imp.push(['r','Heavy','Read traffic near '+bytes(outB)+'/s: serve content through a CDN.']);
    $('#est-imp').innerHTML=imp.map(function(x){return '<li><span class="tag '+x[0]+'">'+x[1]+'</span><span>'+esc(x[2])+'</span></li>';}).join('');
  }
  ids.forEach(function(k){el[k].addEventListener('input',calc);el[k].addEventListener('change',calc);});
  $$('[data-preset]').forEach(function(b){b.addEventListener('click',function(){
    var p=P[b.dataset.preset];for(var k in p)el[k].value=p[k];
    $$('[data-preset]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});calc();});});
  calc();
});

/* ---------- latency ---------- */
mod('latency',function(){
  var rows=[['L1 cache reference',1,'mem'],['Branch mispredict',3,'mem'],['L2 cache reference',4,'mem'],['Mutex lock and unlock',17,'mem'],['Main memory reference',100,'mem'],['Compress 1 KB (fast codec)',2000,'mem'],['Read 1 MB sequentially from memory',3000,'mem'],['Random 4 KB read from SSD',16000,'disk'],['Read 1 MB sequentially from SSD',49000,'disk'],['Round trip within a data center',500000,'net'],['Read 1 MB sequentially from HDD',825000,'disk'],['HDD seek',2000000,'disk'],['Round trip Europe to US West Coast',150000000,'net']];
  var box=$('#lat'),human=false,vals=[];
  function fmtNs(ns){if(ns<1e3)return ns+' ns';if(ns<1e6)return trim(ns/1e3)+' µs';if(ns<1e9)return trim(ns/1e6)+' ms';return trim(ns/1e9)+' s';}
  function fmtH(s){if(s<60)return trim(s)+(s===1?' second':' seconds');if(s<3600)return trim(s/60)+' minutes';if(s<86400)return trim(s/3600)+' hours';if(s<86400*365)return trim(s/86400)+' days';return trim(s/(86400*365))+' years';}
  rows.forEach(function(r){
    var row=document.createElement('div');row.className='lat-row';row.setAttribute('role','row');
    var w=(Math.log10(r[1])+1)/10*100;
    row.innerHTML='<span class="lat-name" role="cell">'+esc(r[0])+'</span><span class="lat-track" role="cell" aria-hidden="true"><span class="lat-bar c-'+r[2]+'" style="width:'+w+'%"></span></span><span class="lat-val" role="cell"></span>';
    box.appendChild(row);vals.push([row.querySelector('.lat-val'),r[1]]);
  });
  var ax=document.createElement('div');ax.className='lat-row lat-axis';ax.setAttribute('aria-hidden','true');
  var ticks=['1 ns','10 ns','100 ns','1 µs','10 µs','100 µs','1 ms','10 ms','100 ms','1 s'];
  ax.innerHTML='<span></span><span class="lat-track">'+ticks.map(function(t,i){return '<span style="left:'+((i+1)*10)+'%">'+t+'</span>';}).join('')+'</span><span></span>';
  box.appendChild(ax);
  function render(){vals.forEach(function(v){v[0].textContent=human?fmtH(v[1]):fmtNs(v[1]);});}
  segInit('lat-mode',function(v){human=v==='human';render();});
  render();
});

/* ---------- legend + scaling stepper ---------- */
mod('legend',function(){
  buildDiagram($('#legend-svg'),{w:900,h:116,nodes:[
    {id:'a',x:10,y:10,w:160,h:48,t:'Service',s:'stateless code'},
    {id:'b',x:190,y:10,w:160,h:48,t:'Data store',s:'database, cache',kind:'store'},
    {id:'c',x:370,y:10,w:160,h:48,t:'Queue',s:'buffer',kind:'queue'},
    {id:'d',x:550,y:10,w:160,h:48,t:'External',s:'CDN, DNS, PSP',kind:'ext'},
    {id:'e',x:730,y:10,w:160,h:48,t:'Client',s:'browser, app',kind:'client'}],
   edges:[
    {pts:[[10,94],[90,94]],label:'request',lp:[100,98],la:'start'},
    {pts:[[230,94],[310,94]],cls:'blue',label:'added in this step',lp:[320,98],la:'start'},
    {pts:[[470,94],[550,94]],cls:'hot',label:'path in focus',lp:[560,98],la:'start'},
    {pts:[[690,94],[770,94]],cls:'dash',label:'asynchronous',lp:[780,98],la:'start'}]});
});

mod('stepper',function(){
  var STEPS=[
    {t:'One server does everything',why:'Fastest way to ship. DNS returns the server’s IP address, and browsers talk to it directly. Web app, database and uploaded files all share one machine.',cost:'A single point of failure, and it will run out of CPU, memory or disk. A bigger machine (scaling up) buys time, but it has a hard ceiling and still no failover.'},
    {t:'Split out the database',why:'The web tier and the data tier now scale independently, and you can choose the right database: relational for joins and transactions, key value or document stores for simple lookups at huge scale.',cost:'One more network hop per query, about half a millisecond inside a data center. Both boxes are still single points of failure.'},
    {t:'Add a load balancer and more web servers',why:'Users reach the balancer’s public IP, and it spreads requests across web servers on a private network. When a server fails its health check, traffic goes to the others. Adding capacity means adding servers.',cost:'The database is now the obvious single point of failure. And any server that keeps session data in its own memory breaks when a user’s next request lands elsewhere.'},
    {t:'Replicate the database',why:'Most apps read far more than they write. The primary takes all writes; replicas copy its log and serve reads. If the primary dies, a replica is promoted.',cost:'Replication lag: a read right after a write may return old data. Read your own recent writes from the primary when it matters.'},
    {t:'Add a cache',why:'Hot data comes from memory in under a millisecond instead of a database query. With cache-aside, the server reads the cache first and on a miss reads the database and stores the result with a TTL.',cost:'Stale data, invalidation bugs, and a cold cache after restarts. Plan eviction (LRU) and protect against stampedes when a hot key expires.'},
    {t:'Serve static files from a CDN',why:'Images, video, JavaScript and CSS come from edge servers close to each user. Latency drops and traffic to your servers falls sharply.',cost:'CDN bills, and invalidation when files change. Put a version in file names (app.3f9a.js) instead of purging.'},
    {t:'Make the web tier stateless',why:'Session data moves out of server memory into a shared store. Any server can now handle any request, so autoscaling and rolling deploys become routine.',cost:'Every request reads session state over the network, so the shared store must be fast and highly available.'},
    {t:'Move slow work onto a queue',why:'Sending email, resizing images, fanning out posts: the web server publishes a job and responds immediately. Workers consume at their own pace, and bursts wait in the queue instead of timing out.',cost:'Work completes later, and messages can be delivered twice. Workers must be idempotent, and you need to watch queue lag.'},
    {t:'Shard the database',why:'When writes or data size outgrow one primary, split rows across shards by a shard key such as user_id. Each shard is its own primary with its own replicas.',cost:'Cross-shard joins and transactions become hard, a hot key (a celebrity) can overload one shard, and changing the shard count needs consistent hashing or a lookup directory. Beyond this: multiple data centers with geo DNS, plus metrics, logs and alerts everywhere.'}
  ];
  var SC={w:900,h:440,nodes:[
    {id:'dns',x:20,y:30,w:120,h:46,t:'DNS',s:'name → IP',kind:'ext'},
    {id:'users',x:20,y:190,w:120,h:60,t:'Users',s:'web + mobile',kind:'client'},
    {id:'cdn',x:180,y:30,w:120,h:46,t:'CDN',s:'edge servers',kind:'ext',from:5},
    {id:'cache',x:340,y:28,w:140,h:52,t:'Cache',s:'in memory',kind:'store',from:4},
    {id:'one',x:340,y:180,w:200,h:80,t:'Single server',s:'app + DB + files',from:0,to:0},
    {id:'web',x:340,y:195,w:140,h:50,t:'Web server',from:1,to:1},
    {id:'db',x:690,y:192,w:180,h:56,t:'Database',s:'one instance',kind:'store',from:1,to:2},
    {id:'lb',x:180,y:195,w:120,h:50,t:'Load balancer',s:'public IP',from:2},
    {id:'web1',x:340,y:140,w:140,h:46,t:'Web server 1',s:'private IP',from:2,to:5},
    {id:'web2',x:340,y:254,w:140,h:46,t:'Web server 2',s:'private IP',from:2,to:5},
    {id:'web1s',x:340,y:140,w:140,h:46,t:'Web server 1',s:'stateless',from:6},
    {id:'web2s',x:340,y:254,w:140,h:46,t:'Web server 2',s:'stateless',from:6},
    {id:'dbp',x:690,y:122,w:180,h:56,t:'Primary DB',s:'all writes',kind:'store',from:3,to:7},
    {id:'dbr',x:690,y:234,w:180,h:56,t:'Replicas ×2',s:'reads',kind:'store',from:3,to:7},
    {id:'s1',x:690,y:105,w:180,h:52,t:'Shard 1',s:'user_id % 3 = 0',kind:'store',from:8},
    {id:'s2',x:690,y:180,w:180,h:52,t:'Shard 2',s:'user_id % 3 = 1',kind:'store',from:8},
    {id:'s3',x:690,y:255,w:180,h:52,t:'Shard 3',s:'user_id % 3 = 2',kind:'store',from:8},
    {id:'sess',x:180,y:370,w:120,h:52,t:'Sessions',s:'shared store',kind:'store',from:6},
    {id:'queue',x:510,y:370,w:140,h:50,t:'Job queue',kind:'queue',from:7},
    {id:'workers',x:690,y:370,w:180,h:50,t:'Workers',s:'email, thumbnails',from:7}
  ],edges:[
    {a:'users.t',ao:-25,b:'dns.b',bo:-25,label:'lookup',lp:[62,137],la:'start'},
    {a:'users.r',b:'one.l',label:'HTTP',from:0,to:0},
    {a:'users.r',b:'web.l',label:'HTTP',from:1,to:1},
    {a:'web.r',b:'db.l',label:'SQL',from:1,to:1},
    {a:'users.r',b:'lb.l',label:'HTTPS',lp:[160,212],from:2},
    {a:'lb.r',ao:-10,b:'web1.l',route:'hvh',via:320,from:2},
    {a:'lb.r',ao:10,b:'web2.l',route:'hvh',via:320,from:2},
    {a:'web1.r',b:'db.l',bo:-10,label:'SQL',from:2,to:2},
    {a:'web2.r',b:'db.l',bo:10,from:2,to:2},
    {a:'web1.r',b:'dbp.l',label:'writes',from:3,to:7},
    {a:'web2.r',b:'dbr.l',label:'reads',from:3,to:7},
    {a:'dbp.b',b:'dbr.t',label:'replicate',cls:'dash',lp:[788,212],la:'start',from:3,to:7},
    {a:'web1.t',b:'cache.b',label:'read first',lp:[418,114],la:'start',from:4},
    {a:'users.t',ao:25,b:'cdn.b',bo:-20,label:'static files',from:5},
    {a:'web2.b',ao:-30,b:'sess.r',route:'vh',label:'sessions',lp:[372,350],la:'end',from:6},
    {a:'web2.b',ao:30,b:'queue.l',route:'vh',label:'publish job',lp:[448,350],la:'start',from:7},
    {a:'queue.r',b:'workers.l',from:7},
    {a:'web1.r',ao:-8,b:'s1.l',label:'route by user_id',from:8},
    {a:'web1.r',ao:8,b:'s2.l',from:8},
    {a:'web2.r',b:'s3.l',from:8}
  ]};
  var d=buildDiagram($('#scale-svg'),SC);
  var all=Object.keys(d.nodes).map(function(k){return d.nodes[k];}).concat(Object.keys(d.edges).map(function(k){return d.edges[k];}));
  var dots=$('#sc-dots'),cur=0,timer=null,max=STEPS.length-1;
  STEPS.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=i;b.setAttribute('aria-label','Step '+i+': '+s.t);b.addEventListener('click',function(){stop();set(i);});dots.appendChild(b);});
  function set(k){
    cur=Math.max(0,Math.min(max,k));
    all.forEach(function(g){
      var f=g.dataset.from!=null?+g.dataset.from:0,t=g.dataset.to!=null?+g.dataset.to:99;
      var vis=f<=cur&&cur<=t;g.classList.toggle('off',!vis);
      var isEdge=g.classList.contains('edge');
      g.classList.toggle(isEdge?'blue':'new',vis&&f===cur&&cur>0);
    });
    var s=STEPS[cur];
    $('#sc-count').textContent='Step '+cur+' of '+max;
    $('#sc-title').textContent=s.t;$('#sc-why').textContent=s.why;$('#sc-cost').textContent=s.cost;
    $$('button',dots).forEach(function(b,i){if(i===cur)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.classList.toggle('past',i<cur);});
    $('#sc-prev').disabled=cur===0;$('#sc-next').disabled=cur===max;
  }
  function stop(){if(timer){clearInterval(timer);timer=null;$('#sc-play').textContent='Play all';}}
  $('#sc-prev').addEventListener('click',function(){stop();set(cur-1);});
  $('#sc-next').addEventListener('click',function(){stop();set(cur+1);});
  $('#sc-play').addEventListener('click',function(){
    if(timer){stop();return;}
    if(cur===max)set(0);
    $('#sc-play').textContent='Pause';
    timer=setInterval(function(){if(cur>=max){stop();return;}set(cur+1);},2800);
  });
  $('#scale-plate').addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT')return;
    if(e.key==='ArrowRight'){stop();set(cur+1);e.preventDefault();}
    else if(e.key==='ArrowLeft'){stop();set(cur-1);e.preventDefault();}
  });
  set(0);
});

/* ---------- load balancer sim ---------- */
mod('lb',function(){
  var grid=$('#lb-grid'),names=['A','B','C','D'],rows=[];
  var alg='rr',slow=$('#lb-slow').checked,srv,rr,timer=null;
  var head=document.createElement('div');head.className='lb-row head';
  head.innerHTML='<span>Server</span><span>Open requests</span><span style="text-align:right">open · done</span>';grid.appendChild(head);
  names.forEach(function(n){var r=document.createElement('div');r.className='lb-row';r.innerHTML='<span class="lb-name">'+n+'</span><span class="lb-track"><span class="lb-fill"></span></span><span class="lb-num"></span>';grid.appendChild(r);rows.push(r);});
  function reset(){srv=names.map(function(){return {jobs:[],done:0};});rr=0;}
  function pick(){
    if(alg==='rr'){var i=rr;rr=(rr+1)%4;return i;}
    if(alg==='rand')return Math.floor(Math.random()*4);
    var min=Infinity,c=[];srv.forEach(function(s,i){var n=s.jobs.length;if(n<min){min=n;c=[i];}else if(n===min)c.push(i);});
    return c[Math.floor(Math.random()*c.length)];
  }
  function step(){
    srv.forEach(function(s){var keep=[];s.jobs.forEach(function(t){if(t>1)keep.push(t-1);else s.done++;});s.jobs=keep;});
    for(var k=0;k<2;k++){var i=pick();var d=3+Math.floor(Math.random()*6);if(slow&&i===2)d*=3;srv[i].jobs.push(d);}
  }
  function render(){
    var counts=srv.map(function(s){return s.jobs.length;});
    var max=Math.max.apply(null,[20].concat(counts));
    var hi=Math.max.apply(null,counts),lo=Math.min.apply(null,counts);
    srv.forEach(function(s,i){
      var n=counts[i],f=rows[i].querySelector('.lb-fill');
      f.style.width=(n/max*100)+'%';f.classList.toggle('hot',n===hi&&hi>=6&&hi>=2*Math.max(lo,1));
      rows[i].querySelector('.lb-num').textContent=n+' · '+s.done;
    });
    var msg='Busiest server has <b>'+hi+'</b> open requests, the quietest <b>'+lo+'</b>. ';
    if(alg==='rr')msg+=slow?'Round robin gives C the same share of new work even though C finishes it three times slower, so its queue keeps growing. Try least connections.':'With identical servers and similar requests, round robin spreads load well.';
    else if(alg==='rand')msg+='Random needs no state, but short bursts of bad luck pile work onto one server, and it ignores that C is slow.';
    else msg+=slow?'Least connections sees C’s open requests and sends it less new work, so every server stays near the same load.':'Least connections keeps the open request counts nearly equal.';
    $('#lb-note').innerHTML=msg;
  }
  function warm(){reset();for(var i=0;i<40;i++)step();render();}
  function stop(){if(timer){clearInterval(timer);timer=null;}$('#lb-run').textContent='Run';}
  $('#lb-run').addEventListener('click',function(){if(timer){stop();return;}$('#lb-run').textContent='Pause';timer=setInterval(function(){step();render();},320);});
  $('#lb-reset').addEventListener('click',function(){stop();warm();});
  $('#lb-slow').addEventListener('change',function(e){slow=e.target.checked;warm();});
  segInit('lb-alg',function(v){alg=v;warm();});
  warm();
});

/* ---------- caching strategies ---------- */
mod('cache-strategies',function(){
  var nodes=[{id:'app',x:40,y:80,w:160,h:56,t:'App server'},{id:'cache',x:370,y:80,w:160,h:56,t:'Cache',s:'Redis',kind:'store'},{id:'db',x:700,y:80,w:160,h:56,t:'Database',s:'source of truth',kind:'store'}];
  var CS={
    aside:{edges:[
      {a:'app.r',ao:-12,b:'cache.l',bo:-12,label:'1 · GET user:42',cls:'hot'},
      {a:'cache.l',ao:12,b:'app.r',bo:12,label:'2 · miss',lp:[285,136]},
      {a:'app.b',b:'db.b',route:'vhv',via:192,label:'3 · on a miss, read the database',cls:'hot'},
      {a:'app.t',b:'cache.t',route:'vhv',via:34,label:'4 · SET user:42 with a TTL',cls:'hot'}],
      text:'<b>Cache-aside, or lazy loading.</b> The application checks the cache and, on a miss, reads the database and fills the cache itself. Only requested data is cached, and a cache outage only makes reads slower. On writes, update the database and then delete the key. This is how most Redis and Memcached deployments work.'},
    through:{edges:[
      {a:'app.r',ao:-12,b:'cache.l',bo:-12,label:'1 · write',cls:'hot'},
      {a:'cache.r',b:'db.l',label:'2 · sync write to DB',cls:'hot'},
      {a:'cache.l',ao:12,b:'app.r',bo:12,label:'3 · ack after both',lp:[285,136]}],
      text:'<b>Write-through.</b> Every write passes through the cache to the database before it is acknowledged, so the cache is never stale. Writes are slower, and data that is written but never read still takes cache space. Usually paired with cache-aside for reads.'},
    back:{edges:[
      {a:'app.r',ao:-12,b:'cache.l',bo:-12,label:'1 · write',cls:'hot'},
      {a:'cache.l',ao:12,b:'app.r',bo:12,label:'2 · ack at once',lp:[285,136],cls:'hot'},
      {a:'cache.r',b:'db.l',label:'3 · flush later',cls:'dash'}],
      text:'<b>Write-back, or write-behind.</b> The cache acknowledges immediately and flushes to the database later in batches. Fastest writes and fewest database calls, but a cache crash loses whatever was not flushed. Fine for counters and metrics, risky for orders and payments.'}
  };
  function show(k){buildDiagram($('#cs-svg'),{w:900,h:220,nodes:nodes,edges:CS[k].edges});$('#cs-text').innerHTML=CS[k].text;}
  segInit('cs-tabs',show);show('aside');
});

/* ---------- LRU ---------- */
mod('lru',function(){
  var KEYS='ABCDEFGH'.split(''),W=[.30,.20,.12,.08,.075,.075,.075,.075];
  var cap=4,list=[],hits=0,misses=0,hist=[],last=null,batchMsg='';
  var kp=$('#lru-keys');
  KEYS.forEach(function(k){var b=document.createElement('button');b.type='button';b.textContent=k;b.setAttribute('aria-label','Request key '+k);b.addEventListener('click',function(){batchMsg='';access(k);render();});kp.appendChild(b);});
  function access(k){
    var i=list.indexOf(k),ev=null,hit=i>=0;
    if(hit){list.splice(i,1);hits++;}else{misses++;if(list.length>=cap)ev=list.pop();}
    list.unshift(k);hist.push({k:k,hit:hit});if(hist.length>24)hist.shift();last={k:k,hit:hit,ev:ev};
  }
  function render(){
    var box=$('#lru-slots');box.style.gridTemplateColumns='repeat('+cap+',minmax(0,1fr))';box.innerHTML='';
    for(var i=0;i<cap;i++){var d=document.createElement('div');var cls='slot';if(list[i])cls+=' filled';if(i===0&&last&&!batchMsg)cls+=last.hit?' hit':' miss';d.className=cls;d.textContent=list[i]||'';box.appendChild(d);}
    var msg;
    if(batchMsg)msg=batchMsg;
    else if(!last)msg='Pick a key to request it.';
    else if(last.hit)msg='<b>GET '+last.k+': hit.</b> Served from memory and moved to the front.';
    else msg='<b>GET '+last.k+': miss.</b> Read from the database and stored at the front'+(last.ev?', evicting <b>'+last.ev+'</b>, the least recently used key.':'.');
    $('#lru-msg').innerHTML=msg;
    $('#lru-h').textContent=hits;$('#lru-m').textContent=misses;
    $('#lru-r').textContent=(hits+misses?Math.round(hits/(hits+misses)*100):0)+'%';
    $('#lru-hist').innerHTML=hist.map(function(h){return '<span class="'+(h.hit?'h':'m')+'">'+h.k+(h.hit?' H':' M')+'</span>';}).join('');
  }
  function reset(){list=[];hits=0;misses=0;hist=[];last=null;batchMsg='';}
  function pickSkew(){var r=Math.random(),acc=0;for(var i=0;i<KEYS.length;i++){acc+=W[i];if(r<acc)return KEYS[i];}return 'H';}
  function batch(skew){reset();for(var i=0;i<40;i++)access(skew?pickSkew():KEYS[Math.floor(Math.random()*8)]);
    batchMsg='<b>40 '+(skew?'skewed':'uniform')+' requests</b> on an empty cache of '+cap+': hit ratio '+Math.round(hits/40*100)+'%.'+(skew?' A few popular keys stay resident.':' With eight equally popular keys, a cache of '+cap+' can hold at most '+Math.round(cap/8*100)+'% of them.');render();}
  $('#lru-skew').addEventListener('click',function(){batch(true);});
  $('#lru-uni').addEventListener('click',function(){batch(false);});
  $('#lru-reset').addEventListener('click',function(){reset();render();});
  $('#lru-cap').addEventListener('change',function(e){cap=+e.target.value;reset();render();});
  ['A','B','C','A'].forEach(access);render();
});

/* ---------- consistent hashing ring ---------- */
var ringH32;
mod('ring',function(){
  var svg=$('#ring-svg'),CX=210,CY=210,R=160;
  var ALL=['A','B','C','D','E','F'],servers=['A','B','C'],V=1,sel='key-7',lastMove=null;
  var KEYS=[];for(var i=1;i<=48;i++)KEYS.push('key-'+i);
  function h32(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return (h>>>0)/4294967296;}
  ringH32=h32;
  function col(s){return 'var(--c'+(ALL.indexOf(s)+1)+')';}
  function points(list){var p=[];list.forEach(function(s){for(var v=0;v<V;v++)p.push({s:s,pos:h32(s+'#'+v)});});p.sort(function(a,b){return a.pos-b.pos;});return p;}
  function ownerIdx(pts,pos){for(var i=0;i<pts.length;i++)if(pts[i].pos>=pos)return i;return 0;}
  function assign(list){var pts=points(list),m={};KEYS.forEach(function(k){m[k]=pts[ownerIdx(pts,h32(k))].s;});return {pts:pts,m:m};}
  function modAssign(list){var m={};KEYS.forEach(function(k){m[k]=list[Math.floor(h32(k)*4294967296)%list.length];});return m;}
  function xy(pos,r){var a=pos*2*Math.PI-Math.PI/2;return [CX+r*Math.cos(a),CY+r*Math.sin(a)];}
  function arc(p0,p1,r){var d=p1-p0;if(d<=0)d+=1;var a=xy(p0,r),b=xy(p1,r);if(d>=0.9999){var m=xy(p0+0.5,r);return 'M'+a[0]+' '+a[1]+' A'+r+' '+r+' 0 1 1 '+m[0]+' '+m[1]+' A'+r+' '+r+' 0 1 1 '+a[0]+' '+a[1];}
    return 'M'+a[0]+' '+a[1]+' A'+r+' '+r+' 0 '+(d>0.5?1:0)+' 1 '+b[0]+' '+b[1];}
  function replicas(pts,k){var i0=ownerIdx(pts,h32(k)),out=[],need=Math.min(3,servers.length);for(var j=0;j<pts.length&&out.length<need;j++){var s=pts[(i0+j)%pts.length].s;if(out.indexOf(s)<0)out.push(s);}return out;}
  var selEl=$('#ring-key');
  KEYS.forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;selEl.appendChild(o);});
  selEl.value=sel;selEl.addEventListener('change',function(){sel=selEl.value;render();});
  function render(){
    var A=assign(servers),pts=A.pts,m=A.m;
    svg.setAttribute('viewBox','0 0 420 420');while(svg.firstChild)svg.removeChild(svg.firstChild);
    S('circle',{cx:CX,cy:CY,r:R,fill:'none',stroke:'var(--rule)','stroke-width':12},svg);
    pts.forEach(function(p,i){var prev=pts[(i-1+pts.length)%pts.length].pos;S('path',{d:arc(prev,p.pos,R),fill:'none',stroke:col(p.s),'stroke-width':12,'stroke-opacity':0.4},svg);});
    pts.forEach(function(p){var c=xy(p.pos,R),sz=V>1?5:13;S('rect',{x:c[0]-sz/2,y:c[1]-sz/2,width:sz,height:sz,fill:col(p.s),stroke:'var(--sheet)','stroke-width':1.5,rx:2},svg);
      if(V===1){var l=xy(p.pos,R+22);T('text',{x:l[0],y:l[1]+5,'text-anchor':'middle','font-size':14,'font-weight':700,fill:col(p.s)},svg,p.s);}});
    KEYS.forEach(function(k){var c=xy(h32(k),R-26),on=k===sel;
      var dot=S('circle',{cx:c[0],cy:c[1],r:on?7:4.5,fill:col(m[k]),stroke:on?'var(--ink)':'none','stroke-width':2,'class':'ring-key',tabindex:'-1'},svg);
      T('title',null,dot,k+' on '+m[k]);
      dot.addEventListener('click',function(){sel=k;selEl.value=k;render();});});
    T('text',{x:CX,y:CY-4,'text-anchor':'middle','font-size':15,'font-weight':700,fill:'var(--ink)'},svg,servers.length+' servers');
    T('text',{x:CX,y:CY+16,'text-anchor':'middle','font-size':12,fill:'var(--ink-2)'},svg,KEYS.length+' keys, '+(V*servers.length)+' ring positions');
    var counts={};servers.forEach(function(s){counts[s]=0;});KEYS.forEach(function(k){counts[m[k]]++;});
    var ideal=KEYS.length/servers.length,mx=Math.max(ideal,Math.max.apply(null,servers.map(function(s){return counts[s];})))*1.12;
    $('#ring-bars').innerHTML=servers.map(function(s){return '<div class="srv-bar"><span style="color:'+col(s)+'">'+s+'</span><span class="tr"><span class="fl" style="width:'+(counts[s]/mx*100)+'%;background:'+col(s)+'"></span><span class="ideal" style="left:'+(ideal/mx*100)+'%"></span></span><span>'+counts[s]+'</span></div>';}).join('');
    if(lastMove){
      $('#ring-moved').innerHTML=lastMove.ring+' of '+KEYS.length+' <small>'+Math.round(lastMove.ring/KEYS.length*100)+'% after '+esc(lastMove.what)+'</small>';
      $('#ring-mod').innerHTML=lastMove.mod+' of '+KEYS.length+' <small>'+Math.round(lastMove.mod/KEYS.length*100)+'% would move</small>';
    }else{$('#ring-moved').innerHTML='None yet <small>add or remove a server</small>';$('#ring-mod').innerHTML='None yet <small>for comparison</small>';}
    var rep=replicas(pts,sel);
    $('#ring-rep').innerHTML='<b>'+sel+'</b> hashes to position '+h32(sel).toFixed(3)+'. Primary: <b style="color:'+col(rep[0])+'">'+rep[0]+'</b>'+(rep.length>1?'. Replicas, next distinct servers clockwise: '+rep.slice(1).map(function(s){return '<b style="color:'+col(s)+'">'+s+'</b>';}).join(' and '):'')+'.';
  }
  function change(next,what){
    var b1=assign(servers).m,m1=modAssign(servers);servers=next;
    var b2=assign(servers).m,m2=modAssign(servers),rm=0,mm=0;
    KEYS.forEach(function(k){if(b1[k]!==b2[k])rm++;if(m1[k]!==m2[k])mm++;});
    lastMove={ring:rm,mod:mm,what:what};render();
    $('#ring-add').disabled=servers.length>=6;$('#ring-rm').disabled=servers.length<=2;
  }
  $('#ring-add').addEventListener('click',function(){var n=ALL.filter(function(s){return servers.indexOf(s)<0;})[0];if(n)change(servers.concat([n]),'adding '+n);});
  $('#ring-rm').addEventListener('click',function(){if(servers.length>2){var r=servers[servers.length-1];change(servers.slice(0,-1),'removing '+r);}});
  segInit('ring-v',function(v){V=+v;lastMove=null;render();});
  $('#ring-rm').disabled=true;
  render();
});

/* ---------- CAP ---------- */
mod('cap',function(){
  var mode='CP',part=false,n1=1,n2=1,log=[];
  function draw(){
    var d=buildDiagram($('#cap-svg'),{w:820,h:170,nodes:[
      {id:'a',x:10,y:60,w:110,h:50,t:'Client A',s:'writes',kind:'client'},
      {id:'n1',x:200,y:50,w:150,h:70,t:'Node 1',s:'x = '+n1,kind:'store'},
      {id:'n2',x:470,y:50,w:150,h:70,t:'Node 2',s:'x = '+n2,kind:'store',cls:n2<n1?'hot':''},
      {id:'b',x:700,y:60,w:110,h:50,t:'Client B',s:'reads',kind:'client'}],
     edges:[{a:'a.r',b:'n1.l',label:'write'},{a:'n1.r',b:'n2.l',label:part?'partitioned':'replicate',cls:part?'cut':'both dash'},{a:'b.l',b:'n2.r',label:'read'}]});
    if(part)T('text',{x:410,y:93,'text-anchor':'middle','font-size':22,'font-weight':700,fill:'var(--red)'},d.svg,'✕');
    $('#cap-log').innerHTML=log.map(function(l){return '<li class="'+l[0]+'"><span class="who">'+l[1]+'</span>'+esc(l[2])+'</li>';}).join('');
    $('#cap-cut').textContent=part?'Heal the network':'Cut the network';
  }
  function add(c,w,t){log.unshift([c,w,t]);if(log.length>6)log.pop();draw();}
  function reset(){part=false;n1=1;n2=1;log=[['','System',mode+' mode. Both nodes hold x = 1 and replicate every write.']];draw();}
  segInit('cap-mode',function(v){mode=v;reset();});
  $('#cap-cut').addEventListener('click',function(){
    if(!part){part=true;add('warn','Network','Partition. Node 1 and Node 2 can no longer reach each other.');}
    else{part=false;
      if(n2<n1){n2=n1;add('ok','Network','Healed. Node 2 syncs from Node 1 and now has x = '+n2+'. In an AP system this is where conflicting writes have to be reconciled.');}
      else add('ok','Network','Healed. Nothing to reconcile: no write was accepted that the other node missed.');}
  });
  $('#cap-w').addEventListener('click',function(){
    if(!part){n1++;n2=n1;add('ok','Write','Node 1 stores x = '+n1+', replicates to Node 2, then acknowledges.');}
    else if(mode==='CP')add('err','Write','Rejected. Node 1 cannot reach Node 2 to replicate, so it refuses rather than let the replicas disagree. Client A gets an error.');
    else{n1++;add('warn','Write','Accepted by Node 1 only, x = '+n1+'. Node 2 still has x = '+n2+' and will catch up after the partition heals.');}
  });
  $('#cap-r').addEventListener('click',function(){
    if(!part)add('ok','Read','Node 2 returns x = '+n2+'. The replicas agree.');
    else if(mode==='CP')add('err','Read','Refused. Node 2 cannot confirm it has the latest value, so it returns an error instead of risking a stale answer.');
    else if(n2<n1)add('warn','Read','Node 2 returns x = '+n2+', which is stale: Node 1 has x = '+n1+'. Available, but not consistent.');
    else add('ok','Read','Node 2 returns x = '+n2+'. It happens to be current, because no write has reached Node 1 since the cut.');
  });
  $('#cap-reset').addEventListener('click',reset);
  reset();
});

/* ---------- queue backlog ---------- */
function niceMax(v){if(v<=0)return 1;var p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;var n=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return n*p;}
mod('queue',function(){
  var svg=$('#q-svg'),W=800,H=330,X0=70,X1=780,TMAX=90;
  function x(t){return X0+(X1-X0)*t/TMAX;}
  function render(){
    var base=+$('#q-in').value,cons=+$('#q-c').value,spike=$('#q-spike').checked,cap=cons*100;
    $('#q-in-o').textContent=base+'/s';$('#q-c-o').textContent=cons+' · '+cap+'/s';
    var arr=[],bl=[],b=0;
    for(var t=0;t<=TMAX;t++){var a=base*(spike&&t>=20&&t<35?3:1);b=Math.max(0,b+a-cap);arr.push(a);bl.push(b);}
    svg.setAttribute('viewBox','0 0 '+W+' '+H);while(svg.firstChild)svg.removeChild(svg.firstChild);
    var top0=28,top1=128,bot0=182,bot1=292;
    if(spike){S('rect',{x:x(20),y:top0,width:x(35)-x(20),height:top1-top0,fill:'var(--amber-wash)'},svg);S('rect',{x:x(20),y:bot0,width:x(35)-x(20),height:bot1-bot0,fill:'var(--amber-wash)'},svg);
      T('text',{x:(x(20)+x(35))/2,y:top0+13,'text-anchor':'middle','class':'anno'},svg,'spike');}
    var rMax=niceMax(Math.max(cap,Math.max.apply(null,arr))*1.1);
    function yr(v){return top1-(top1-top0)*v/rMax;}
    var bMax=niceMax(Math.max(1000,Math.max.apply(null,bl))*1.05);
    function yb(v){return bot1-(bot1-bot0)*v/bMax;}
    [0,0.5,1].forEach(function(f){var v=rMax*f;S('line',{x1:X0,x2:X1,y1:yr(v),y2:yr(v),'class':'grid'},svg);T('text',{x:X0-8,y:yr(v)+4,'text-anchor':'end','class':'anno'},svg,human(v)+'/s');
      var w=bMax*f;S('line',{x1:X0,x2:X1,y1:yb(w),y2:yb(w),'class':'grid'},svg);T('text',{x:X0-8,y:yb(w)+4,'text-anchor':'end','class':'anno'},svg,human(w));});
    T('text',{x:X0,y:16,'font-size':12,'font-weight':650,fill:'var(--ink)'},svg,'Messages per second');
    T('text',{x:X0,y:170,'font-size':12,'font-weight':650,fill:'var(--ink)'},svg,'Backlog, messages waiting');
    var p='';for(var t=0;t<=TMAX;t++){p+=(t?' L':'M')+x(t)+' '+yr(arr[t]);if(t<TMAX)p+=' L'+x(t+1)+' '+yr(arr[t]);}
    S('path',{d:p,fill:'none',stroke:'var(--blue)','stroke-width':2.2},svg);
    S('line',{x1:X0,x2:X1,y1:yr(cap),y2:yr(cap),stroke:'var(--green)','stroke-width':2,'stroke-dasharray':'6 4'},svg);
    T('text',{x:X1,y:yr(cap)-6,'text-anchor':'end','font-size':11,'font-weight':650,fill:'var(--green)'},svg,'consumer capacity '+cap+'/s');
    T('text',{x:x(2),y:yr(arr[2])-6,'font-size':11,'font-weight':650,fill:'var(--blue)'},svg,'arrivals');
    var ap='M'+x(0)+' '+yb(0),lp='';
    for(var t=0;t<=TMAX;t++){ap+=' L'+x(t)+' '+yb(bl[t]);lp+=(t?' L':'M')+x(t)+' '+yb(bl[t]);}
    ap+=' L'+x(TMAX)+' '+yb(0)+' Z';
    S('path',{d:ap,fill:'var(--red-wash)'},svg);S('path',{d:lp,fill:'none',stroke:'var(--red)','stroke-width':2.2},svg);
    S('line',{x1:X0,x2:X1,y1:bot1,y2:bot1,'class':'axis'},svg);
    for(var t=0;t<=TMAX;t+=15)T('text',{x:x(t),y:bot1+18,'text-anchor':'middle','class':'anno'},svg,t+' s');
    var peak=Math.max.apply(null,bl),pt=bl.indexOf(peak),drain=-1;
    for(var t=pt;t<=TMAX;t++){if(bl[t]===0){drain=t;break;}}
    $('#q-peak').textContent=nf.format(Math.round(peak));
    $('#q-wait').textContent=peak?trim(peak/cap)+' s':'0 s';
    var note;
    if(base>cap){$('#q-drain').textContent='Never';note='<b>Arrivals exceed capacity even without the spike</b>, so the backlog grows forever. Add consumers, make each one faster, or shed load.';}
    else if(peak===0){$('#q-drain').textContent='No backlog';note='Capacity covers even the spike, so nothing waits. You are also paying for idle consumers most of the time; autoscaling on queue depth is the usual middle ground.';}
    else{$('#q-drain').textContent=drain>=0?'at '+drain+' s':'after 90 s';note='The queue absorbs the spike instead of dropping requests. Work arriving at the peak waits about <b>'+trim(peak/cap)+' s</b>, then the backlog drains at '+(cap-base)+' messages per second, the spare capacity.';}
    $('#q-note').innerHTML=note;
  }
  ['q-in','q-c','q-spike'].forEach(function(id){document.getElementById(id).addEventListener('input',render);document.getElementById(id).addEventListener('change',render);});
  render();
});

/* ---------- token bucket ---------- */
mod('tokenbucket',function(){
  var cap=5,rate=1,tokens=5,last=performance.now(),ok=0,no=0,strip=[],shown=-1;
  var bucket=$('#tb-bucket');
  function refill(){var now=performance.now();tokens=Math.min(cap,tokens+(now-last)/1000*rate);last=now;}
  function build(){bucket.innerHTML='';for(var i=0;i<cap;i++){var t=document.createElement('span');t.className='tok';t.innerHTML='<i></i>';bucket.appendChild(t);}shown=-1;}
  function draw(){
    refill();var q=Math.round(tokens*20)/20;if(q===shown)return;shown=q;
    var ts=bucket.children;
    for(var i=0;i<ts.length;i++){var f=Math.max(0,Math.min(1,tokens-i));ts[i].firstChild.style.height=(f*100)+'%';}
    bucket.setAttribute('aria-label',trim(tokens)+' of '+cap+' tokens');
    $('#tb-ra').textContent=tokens>=1?'0 s':trim((1-tokens)/rate)+' s';
  }
  function renderStrip(){$('#tb-strip').innerHTML=strip.map(function(s){return s?'<span class="ok">200</span>':'<span class="no">429</span>';}).join('');$('#tb-ok').textContent=ok;$('#tb-no').textContent=no;}
  function send(n){refill();for(var k=0;k<n;k++){if(tokens>=1){tokens-=1;ok++;strip.push(1);}else{no++;strip.push(0);}}while(strip.length>30)strip.shift();shown=-1;renderStrip();draw();}
  $('#tb-one').addEventListener('click',function(){send(1);});
  $('#tb-burst').addEventListener('click',function(){send(10);});
  $('#tb-reset').addEventListener('click',function(){tokens=cap;last=performance.now();ok=0;no=0;strip=[];renderStrip();shown=-1;draw();});
  $('#tb-cap').addEventListener('input',function(e){cap=+e.target.value;$('#tb-cap-o').textContent=cap;tokens=Math.min(tokens,cap);build();draw();});
  $('#tb-rate').addEventListener('input',function(e){refill();rate=+e.target.value;$('#tb-rate-o').textContent=rate+(rate===1?' token/s':' tokens/s');shown=-1;draw();});
  build();renderStrip();draw();setInterval(draw,100);
});

/* ---------- URL shortener ---------- */
var ALPH='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function b62(n){if(n===0n)return '0';var s='';while(n>0n){s=ALPH[Number(n%62n)]+s;n=n/62n;}return s;}
function fnv64(str){var h=0xcbf29ce484222325n,p=0x100000001b3n,bs=new TextEncoder().encode(str);for(var i=0;i<bs.length;i++){h^=BigInt(bs[i]);h=(h*p)&0xFFFFFFFFFFFFFFFFn;}return h;}
mod('url-diagram',function(){
  var nodes=[{id:'client',x:20,y:120,w:110,h:56,t:'Client',s:'browser',kind:'client'},{id:'lb',x:170,y:120,w:130,h:56,t:'Load balancer'},{id:'api',x:340,y:120,w:140,h:56,t:'Web servers',s:'stateless'},{id:'cache',x:560,y:24,w:160,h:56,t:'Cache',s:'code → long URL',kind:'store'},{id:'db',x:560,y:216,w:160,h:60,t:'URL store',s:'code, long_url, ...',kind:'store'},{id:'idgen',x:760,y:120,w:130,h:56,t:'ID allocator',s:'leases ID ranges'}];
  function show(mode){
    var R=mode==='read';
    buildDiagram($('#url-svg'),{w:900,h:290,nodes:nodes,edges:[
      {a:'client.r',b:'lb.l',label:R?'GET /zn9edcu':'POST /urls',lp:[150,113],cls:'hot'},
      {a:'lb.r',b:'api.l',cls:'hot'},
      {a:'api.r',ao:-16,b:'cache.l',route:'hvh',via:520,label:'1 · look up code',lp:[528,98],la:'start',cls:R?'hot':'dim'},
      {a:'api.r',ao:16,b:'db.l',route:'hvh',via:520,label:R?'2 · on a miss, read':'2 · insert row',lp:[528,206],la:'start',cls:'hot'},
      {a:'api.r',b:'idgen.l',label:'1 · next ID',cls:R?'dim':'hot'},
      {pts:[[410,120],[410,96],[75,96],[75,120]],label:R?'302, Location: long URL':'201, short URL',lp:[242,90],cls:'hot'}]});
    $('#url-cap').innerHTML=R?'<b>Redirect path.</b> The web server looks the code up in the cache and reads the URL store only on a miss, then answers 302 with the long URL in the Location header. At 4,000 redirects per second and a 90% hit rate, the store sees just 400 reads per second.':'<b>Shorten path.</b> Each web server leases a block of IDs from the allocator, so 999 of every 1,000 shortens need no call to it. The server encodes the next ID in base62, inserts the row and returns the short URL. At 40 writes per second this path is never the bottleneck.';
  }
  segInit('url-path',show);show('read');
});
mod('url-lab',function(){
  function go(advance){
    var raw=($('#u-id').value||'').replace(/[^0-9]/g,'');if(!raw)raw='0';if(raw.length>30)raw=raw.slice(0,30);
    var id=BigInt(raw),code=b62(id);
    $('#u-b62').innerHTML='<span>sho.rt/</span>'+code;
    var n=id,rows=[];if(n===0n)rows.push([0n,0n,0n]);while(n>0n){rows.push([n,n/62n,n%62n]);n=n/62n;}
    $('#u-steps').innerHTML=rows.map(function(r){return '<tr><td class="num">'+r[0].toLocaleString('en-US')+'</td><td class="num">'+r[1].toLocaleString('en-US')+'</td><td class="num">'+r[2].toString()+'</td><td><b class="mono">'+ALPH[Number(r[2])]+'</b></td></tr>';}).join('');
    var url=($('#u-long').value||'').trim()||'https://example.com';
    var h=fnv64(url),full=b62(h),c7=full.slice(0,7);
    $('#u-hash').innerHTML='<span>sho.rt/</span>'+esc(c7);
    $('#u-hash-note').innerHTML='64 bit hash <span class="mono">0x'+h.toString(16).padStart(16,'0')+'</span>, in base62 <span class="mono">'+esc(full)+'</span>. Keep the first 7 characters. The same URL always produces the same code, and changing one character changes it completely. Before saving, check that <b>'+esc(c7)+'</b> is not already taken by a different URL; if it is, append a salt and hash again. FNV-1a stands in for MD5 here.';
    if(advance)$('#u-id').value=(id+1n).toString();
  }
  $('#u-go').addEventListener('click',function(){go(true);});
  $('#u-long').addEventListener('keydown',function(e){if(e.key==='Enter')go(true);});
  $('#u-id').addEventListener('keydown',function(e){if(e.key==='Enter')go(false);});
  go(false);
});

/* ---------- news feed ---------- */
mod('feed',function(){
  buildDiagram($('#feed-svg'),{w:900,h:330,nodes:[
    {id:'client',x:20,y:150,w:100,h:56,t:'Client',kind:'client'},
    {id:'lb',x:150,y:150,w:120,h:56,t:'Load balancer'},
    {id:'post',x:310,y:40,w:150,h:52,t:'Post service'},
    {id:'queue',x:500,y:40,w:150,h:52,t:'Fan-out queue',kind:'queue'},
    {id:'workers',x:690,y:40,w:170,h:52,t:'Fan-out workers'},
    {id:'postdb',x:310,y:150,w:150,h:56,t:'Posts',s:'DB + post cache',kind:'store'},
    {id:'graph',x:500,y:150,w:150,h:56,t:'Follow graph',s:'who follows whom',kind:'store'},
    {id:'feedsvc',x:310,y:260,w:150,h:56,t:'Feed service'},
    {id:'feedc',x:690,y:260,w:170,h:56,t:'Feed cache',s:'user → post IDs',kind:'store'}],
   edges:[
    {a:'client.r',b:'lb.l'},
    {a:'lb.r',ao:-12,b:'post.l',route:'hvh',via:290,label:'POST /posts',lp:[282,110],la:'end'},
    {a:'lb.r',ao:12,b:'feedsvc.l',route:'hvh',via:290,label:'GET /feed',lp:[282,250],la:'end'},
    {a:'post.r',b:'queue.l',label:'event',cls:'dash'},
    {a:'queue.r',b:'workers.l'},
    {a:'post.b',b:'postdb.t',label:'store',lp:[393,126],la:'start'},
    {a:'workers.b',ao:-40,b:'graph.r',route:'vh',label:'followers?',lp:[727,130],la:'end'},
    {a:'workers.b',ao:40,b:'feedc.t',label:'push post ID',lp:[823,180],la:'start',cls:'hot'},
    {a:'feedsvc.r',b:'feedc.l',label:'1 · read post IDs'},
    {a:'feedsvc.t',b:'postdb.b',label:'2 · hydrate',lp:[393,238],la:'start'}]});
  buildDiagram($('#pp-svg'),{w:900,h:300,
   annos:[{x:20,y:18,t:'Fan-out on write (push)',bold:1},{x:470,y:18,t:'Fan-out on read (pull)',bold:1},{x:220,y:112,t:'one write per follower',anchor:'middle'},{x:680,y:296,t:'lookups grow with follows, then merge and sort',anchor:'middle'}],
   nodes:[
    {id:'au',x:20,y:44,w:110,h:46,t:'Author posts',kind:'client'},
    {id:'fan',x:160,y:44,w:120,h:46,t:'Fan-out',s:'workers'},
    {id:'f1',x:310,y:28,w:120,h:34,t:'Feed 1',kind:'store'},
    {id:'f2',x:310,y:74,w:120,h:34,t:'Feed 2',kind:'store'},
    {id:'f3',x:310,y:120,w:120,h:34,t:'Feed 3',kind:'store'},
    {id:'rd',x:310,y:236,w:120,h:46,t:'Reader',kind:'client'},
    {id:'au2',x:470,y:44,w:110,h:46,t:'Author posts',kind:'client'},
    {id:'p1',x:620,y:140,w:80,h:40,t:'Posts A',kind:'store'},
    {id:'p2',x:710,y:140,w:80,h:40,t:'Posts B',kind:'store'},
    {id:'p3',x:800,y:140,w:80,h:40,t:'Posts C',kind:'store'},
    {id:'rd2',x:470,y:236,w:110,h:46,t:'Reader',kind:'client'},
    {id:'fs',x:650,y:236,w:140,h:46,t:'Feed service'}],
   edges:[
    {a:'au.r',b:'fan.l',label:'post'},
    {a:'fan.r',b:'f1.l',route:'hvh',via:295,cls:'hot'},
    {a:'fan.r',b:'f2.l',route:'hvh',via:295,cls:'hot'},
    {a:'fan.r',b:'f3.l',route:'hvh',via:295,cls:'hot'},
    {a:'rd.t',b:'f3.b',label:'one lookup',lp:[378,200],la:'start'},
    {a:'au2.r',b:'p1.t',route:'hv',label:'one write',lp:[590,61],la:'start'},
    {a:'rd2.r',b:'fs.l',label:'open'},
    {a:'fs.t',b:'p1.b',bo:0,route:'vhv',via:208,cls:'hot'},
    {a:'fs.t',b:'p2.b',route:'vhv',via:208,cls:'hot',label:'query every followee',lp:[800,228]},
    {a:'fs.t',b:'p3.b',route:'vhv',via:208,cls:'hot'},
    {pts:[[450,10],[450,290]],cls:'plain'}]});
  function fmtTime(s){if(s<0.001)return '< 1 ms';if(s<1)return trim(s*1000)+' ms';if(s<60)return trim(s)+' s';return trim(s/60)+' min';}
  function calc(){
    var f=Math.round(Math.pow(10,+$('#fo-f').value)),n=+$('#fo-n').value,c=Math.min(+$('#fo-c').value,n),TH=100000,RATE=1e6;
    $('#fo-f-o').textContent=nf.format(f);$('#fo-n-o').textContent=nf.format(n);$('#fo-c-o').textContent=c;
    var celeb=f>=TH;
    $('#fo-pw').textContent=nf.format(f);$('#fo-lw').textContent='1';$('#fo-hw').textContent=celeb?'1':nf.format(f);
    $('#fo-pr').textContent='1';$('#fo-lr').textContent=nf.format(n);$('#fo-hr').textContent=nf.format(1+c);
    $('#fo-pt').textContent=fmtTime(f/RATE);$('#fo-lt').textContent='next read';$('#fo-ht').textContent=celeb?'next read':fmtTime(f/RATE);
    $('#fo-note').innerHTML=celeb?'This author has <b>'+human(f)+'</b> followers, above the 100K threshold, so hybrid treats them like pull: one write, and followers fetch the post when they open their feed. Pure push would need '+nf.format(f)+' writes and about '+fmtTime(f/RATE)+' of worker time for a single post.':'This author has <b>'+nf.format(f)+'</b> followers, so hybrid pushes: '+nf.format(f)+' cheap writes that reach every feed in '+fmtTime(f/RATE)+'. Readers pay 1 + '+c+' lookups (their own feed plus the celebrities they follow) instead of '+nf.format(n)+' with pure pull.';
  }
  ['fo-f','fo-n','fo-c'].forEach(function(id){document.getElementById(id).addEventListener('input',calc);});
  calc();
});

/* ---------- chat flow ---------- */
mod('chat',function(){
  var d=buildDiagram($('#chat-svg'),{w:900,h:370,nodes:[
    {id:'alice',x:20,y:150,w:110,h:50,t:'Alice',kind:'client'},
    {id:'cs1',x:170,y:150,w:130,h:50,t:'Chat server 1',s:'holds sockets'},
    {id:'idgen',x:160,y:30,w:150,h:46,t:'ID generator',s:'Snowflake'},
    {id:'presence',x:380,y:30,w:150,h:46,t:'Presence',s:'heartbeats'},
    {id:'store',x:160,y:280,w:150,h:56,t:'Message store',s:'by conversation',kind:'store'},
    {id:'queue',x:380,y:150,w:150,h:50,t:'Bob’s inbox',kind:'queue'},
    {id:'cs2',x:590,y:150,w:130,h:50,t:'Chat server 2',s:'holds sockets'},
    {id:'bob',x:790,y:150,w:100,h:50,t:'Bob',kind:'client'},
    {id:'push',x:790,y:280,w:100,h:50,t:'Push',s:'APNs / FCM',kind:'ext'}],
   edges:[
    {id:'e1',a:'alice.r',b:'cs1.l',label:'send'},
    {id:'e2',a:'cs1.t',ao:-25,b:'idgen.b',bo:-25,label:'get ID',lp:[202,118],la:'end'},
    {id:'e7',a:'cs1.t',ao:45,b:'presence.b',route:'vhv',via:110,label:'where is Bob?',lp:[368,104]},
    {id:'e3',a:'cs1.b',b:'store.t',label:'persist',lp:[243,245],la:'start'},
    {id:'e4',a:'cs1.r',b:'queue.l',label:'enqueue'},
    {id:'e5',a:'queue.r',b:'cs2.l',label:'consume'},
    {id:'e6',a:'cs2.r',ao:-8,b:'bob.l',bo:-8,label:'push'},
    {id:'e8',a:'queue.b',b:'push.l',route:'vh',label:'Bob offline: notify',lp:[600,299]},
    {id:'e9',a:'push.t',b:'bob.b',label:'wake app',lp:[848,245],la:'start'},
    {id:'e10',a:'bob.l',ao:12,b:'cs2.r',bo:12,label:'reconnect',lp:[755,216]},
    {id:'e11',pts:[[655,200],[655,352],[235,352],[235,336]],label:'fetch messages after last seen ID',lp:[445,346]}]});
  var common=[
    {e:['e1'],n:['alice','cs1'],t:'Alice sends',d:'Alice’s app already holds an open WebSocket to Chat server 1, so the message goes up that connection with no new handshake.'},
    {e:['e2'],n:['idgen'],t:'Assign an ID',d:'The ID generator returns a 64 bit ID that sorts by time. Ordering inside the conversation comes from these IDs, never from device clocks.'},
    {e:['e3'],n:['store'],t:'Persist first',d:'The message is written to the message store before anyone is told about it. Once Alice sees one tick, the message is durable even if every chat server restarts.'}];
  var FLOW={on:common.concat([
    {e:['e7'],n:['presence'],t:'Find Bob',d:'Presence reports that Bob is online and connected to Chat server 2.'},
    {e:['e4','e5','e6'],n:['queue','cs2','bob'],t:'Deliver',d:'The message goes onto Bob’s inbox queue. Chat server 2 consumes it and pushes it down Bob’s WebSocket.'},
    {eb:['e6','e5','e4','e1'],n:['bob','alice'],t:'Receipts',d:'Bob’s device acknowledges, and the receipt travels back the same way: Alice sees two ticks. A read receipt is the same mechanism, sent when Bob opens the chat.'}]),
   off:common.concat([
    {e:['e7'],n:['presence'],t:'Bob is offline',d:'Presence has not seen a heartbeat from Bob for over 30 seconds, so he is marked offline.'},
    {e:['e8','e9'],n:['queue','push','bob'],t:'Notify',d:'The event goes to the push notification service, which asks Apple (APNs) or Google (FCM) to wake Bob’s phone.'},
    {e:['e10','e11'],n:['bob','cs2','store'],t:'Sync on reconnect',d:'Bob’s app reconnects and asks for every message after the last ID it has seen. Each device keeps its own cursor, which is also how multi-device sync works.'}])};
  var HIDE={on:['e8','e9','e10','e11'],off:['e5','e6']};
  var modeK='on',i=0;
  function render(){
    var steps=FLOW[modeK],s=steps[i];
    Object.keys(d.edges).forEach(function(id){var g=d.edges[id];var hid=HIDE[modeK].indexOf(id)>=0;
      g.classList.toggle('off',hid);
      var hot=(s.e||[]).indexOf(id)>=0,blue=(s.eb||[]).indexOf(id)>=0;
      g.classList.toggle('hot',hot);g.classList.toggle('blue',blue);g.classList.toggle('dim',!hid&&!hot&&!blue);});
    Object.keys(d.nodes).forEach(function(id){var g=d.nodes[id];g.classList.toggle('hot',s.n.indexOf(id)>=0);g.classList.toggle('dim',modeK==='on'&&id==='push');});
    $('#ch-count').textContent='Step '+(i+1)+' of '+steps.length;$('#ch-title').textContent=s.t;$('#ch-text').textContent=s.d;
    $('#ch-prev').disabled=i===0;$('#ch-next').disabled=i===steps.length-1;
  }
  segInit('ch-mode',function(v){modeK=v;i=0;render();});
  $('#ch-prev').addEventListener('click',function(){if(i>0){i--;render();}});
  $('#ch-next').addEventListener('click',function(){if(i<FLOW[modeK].length-1){i++;render();}});
  render();
});
mod('snowflake',function(){
  var EPOCH=1288834974657n,MACHINE=37n,seq=0,lastMs=0;
  function gen(){
    var now=Date.now();if(now===lastMs)seq=(seq+1)&4095;else{seq=0;lastMs=now;}
    var ts=BigInt(now)-EPOCH,id=(ts<<22n)|(MACHINE<<12n)|BigInt(seq);
    $('#sf-id').textContent=id.toString();
    $('#sf-ts').innerHTML=new Date(now).toISOString().replace('T',' ').slice(0,23)+' <small>UTC, '+nf.format(Number(ts))+' ms since epoch</small>';
    $('#sf-m').textContent=MACHINE.toString();$('#sf-s').textContent=seq;
  }
  $('#sf-gen').addEventListener('click',gen);gen();
});

/* ---------- geohash ---------- */
var B32='0123456789bcdefghjkmnpqrstuvwxyz';
function ghEncode(lat,lng,prec){
  var la=[-90,90],lo=[-180,180],hash='',even=true,ch=0,n=0,steps=[],chunks=[],cur=[];
  while(hash.length<prec){
    var r=even?lo:la,v=even?lng:lat,mid=(r[0]+r[1])/2,b=v>=mid?1:0;
    if(steps.length<10)steps.push({axis:even?'Longitude':'Latitude',lo:r[0],hi:r[1],mid:mid,b:b});
    if(b)r[0]=mid;else r[1]=mid;
    cur.push({ax:even?'x':'y',b:b});ch=(ch<<1)|b;n++;
    if(n===5){hash+=B32[ch];chunks.push({bits:cur,ch:B32[ch],dec:ch});cur=[];ch=0;n=0;}
    even=!even;
  }
  return {hash:hash,la:la,lo:lo,steps:steps,chunks:chunks};
}
mod('geohash',function(){
  var PRE=[[48.8584,2.2945],[40.7580,-73.9855],[35.6586,139.7454],[-33.8568,151.2153]];
  var SUG={'0.5':6,'1':5,'2':5,'5':4,'20':4};
  function fmtKm(k){return k>=1?trim(k)+' km':Math.round(k*1000)+' m';}
  function f4(x){return String(Math.round(x*10000)/10000);}
  function render(){
    var lat=Math.max(-90,Math.min(90,parseFloat($('#gh-lat').value)||0)),lng=Math.max(-180,Math.min(180,parseFloat($('#gh-lng').value)||0));
    var p=+$('#gh-p').value,rad=parseFloat($('#gh-rad').value);$('#gh-p-o').textContent=p;
    var g=ghEncode(lat,lng,p);
    $('#gh-hash').textContent=g.hash;
    $('#gh-chunks').innerHTML=g.chunks.map(function(c){return '<div class="chunk"><div class="bb">'+c.bits.map(function(b){return '<span class="'+b.ax+'">'+b.b+'</span>';}).join('')+'</div><span class="ch">'+c.ch+'</span><span class="dec">'+c.dec+'</span></div>';}).join('');
    $('#gh-steps').innerHTML=g.steps.map(function(s){return '<tr><td>'+s.axis+'</td><td class="mono">['+f4(s.lo)+', '+f4(s.hi)+']</td><td class="num">'+f4(s.mid)+'</td><td class="num"><b style="color:'+(s.axis==='Longitude'?'var(--blue)':'var(--red)')+'">'+s.b+'</b></td></tr>';}).join('');
    var dLat=g.la[1]-g.la[0],dLng=g.lo[1]-g.lo[0],clat=(g.la[0]+g.la[1])/2,clng=(g.lo[0]+g.lo[1])/2;
    var hKm=dLat*111.32,wKm=dLng*111.32*Math.max(0.01,Math.cos(clat*Math.PI/180));
    $('#gh-size').textContent=fmtKm(wKm)+' × '+fmtKm(hKm);
    $('#gh-sugg').innerHTML=SUG[String(rad)]+' <small>for a '+rad+' km radius</small>';
    var svg=$('#gh-svg'),C=110;svg.setAttribute('viewBox','0 0 330 330');while(svg.firstChild)svg.removeChild(svg.firstChild);
    var defs=S('defs',null,svg),cp=S('clipPath',{id:'gh-clip'},defs);S('rect',{x:0,y:0,width:330,height:330},cp);
    var fs=p>=8?10.5:12;
    for(var r=0;r<3;r++)for(var c=0;c<3;c++){
      var nlat=clat+(1-r)*dLat,nlng=clng+(c-1)*dLng;nlng=((nlng+180)%360+360)%360-180;
      var center=r===1&&c===1,h=(nlat>90||nlat<-90)?'n/a':ghEncode(nlat,nlng,p).hash;
      S('rect',{x:c*C+1,y:r*C+1,width:C-2,height:C-2,rx:3,fill:center?'var(--blue-wash)':'var(--paper)',stroke:center?'var(--blue)':'var(--rule)','stroke-width':center?2:1},svg);
      T('text',{x:c*C+C/2,y:r*C+C-12,'text-anchor':'middle',style:'font-family:var(--f-mono)','font-size':fs,'font-weight':center?700:500,fill:center?'var(--blue)':'var(--ink-2)'},svg,h);
    }
    var fx=(lng-g.lo[0])/dLng,fy=(g.la[1]-lat)/dLat,px=C+fx*C,py=C+fy*C;
    var rx=rad/wKm*C,ry=rad/hKm*C,gc=S('g',{'clip-path':'url(#gh-clip)'},svg);
    S('ellipse',{cx:px,cy:py,rx:Math.min(rx,2000),ry:Math.min(ry,2000),fill:'var(--red)','fill-opacity':0.1,stroke:'var(--red)','stroke-width':1.5,'stroke-dasharray':'4 3'},gc);
    S('circle',{cx:px,cy:py,r:5,fill:'var(--red)',stroke:'var(--sheet)','stroke-width':2},svg);
    var spills=fx*wKm<rad||(1-fx)*wKm<rad||fy*hKm<rad||(1-fy)*hKm<rad,tooBig=rad>Math.min(wKm,hKm);
    var note;
    if(tooBig)note='The radius is larger than one cell at this precision, so even nine cells may not cover it. Use a shorter geohash, such as the suggested precision.';
    else if(spills)note='The dashed circle spills over the edge of the center cell, so places inside the radius sit in neighboring cells with different hashes. That is why the query includes all nine.';
    else note='Here the circle fits inside the center cell, but you still query all nine: a point near an edge would miss places next door.';
    $('#gh-note').textContent=note;
  }
  segInit('gh-preset',function(v){var q=PRE[+v];$('#gh-lat').value=q[0];$('#gh-lng').value=q[1];render();});
  $('#gh-rad').addEventListener('change',function(){$('#gh-p').value=SUG[$('#gh-rad').value];render();});
  ['gh-lat','gh-lng','gh-p'].forEach(function(id){document.getElementById(id).addEventListener('input',render);});
  render();
});
mod('geo-diagram',function(){
  buildDiagram($('#geo-svg'),{w:740,h:285,nodes:[
    {id:'client',x:20,y:120,w:100,h:54,t:'Client',kind:'client'},
    {id:'lb',x:160,y:120,w:130,h:54,t:'Load balancer'},
    {id:'loc',x:340,y:70,w:160,h:54,t:'Location service',s:'search, read only'},
    {id:'biz',x:340,y:211,w:160,h:54,t:'Business service',s:'CRUD, low QPS'},
    {id:'gc',x:570,y:20,w:150,h:52,t:'Geo cache',s:'geohash → IDs',kind:'store'},
    {id:'rep',x:570,y:110,w:150,h:56,t:'Read replicas',s:'index + details',kind:'store'},
    {id:'prim',x:570,y:210,w:150,h:56,t:'Primary DB',s:'businesses',kind:'store'}],
   edges:[
    {a:'client.r',b:'lb.l',label:'search'},
    {a:'lb.r',ao:-12,b:'loc.l',route:'hvh',via:315,cls:'hot'},
    {a:'lb.r',ao:12,b:'biz.l',route:'hvh',via:315},
    {a:'loc.r',ao:-12,b:'gc.l',route:'hvh',via:540,label:'1 · nine cells',lp:[534,40],la:'end',cls:'hot'},
    {a:'loc.r',ao:12,b:'rep.l',route:'hvh',via:540,label:'2 · on a miss',lp:[534,160],la:'end'},
    {a:'biz.r',b:'prim.l',label:'writes'},
    {a:'prim.t',b:'rep.b',label:'replicate',lp:[653,194],la:'start',cls:'dash'}]});
});

/* ---------- key value store ---------- */
mod('quorum',function(){
  var n=$('#q-n'),w=$('#q-w'),r=$('#q-r'),svg=$('#quorum-svg');
  function render(){
    var N=+n.value;w.max=N;r.max=N;var W=Math.min(+w.value,N),R=Math.min(+r.value,N);w.value=W;r.value=R;
    $('#q-n-o').textContent=N;$('#q-w-o').textContent=W;$('#q-r-o').textContent=R;
    svg.setAttribute('viewBox','0 0 900 190');while(svg.firstChild)svg.removeChild(svg.firstChild);
    for(var i=0;i<N;i++){
      var cx=450+(i-(N-1)/2)*112,cy=92,inW=i<W,inR=i>=N-R;
      if(inR)S('circle',{cx:cx,cy:cy,r:44,fill:'none',stroke:'var(--red)','stroke-width':2.2,'stroke-dasharray':'5 4'},svg);
      S('circle',{cx:cx,cy:cy,r:34,fill:inW?'var(--blue-wash)':'var(--paper)',stroke:inW?'var(--blue)':'var(--ink-3)','stroke-width':inW?2.2:1.4},svg);
      T('text',{x:cx,y:cy+5,'text-anchor':'middle','font-size':15,'font-weight':700,fill:inW?'var(--blue)':'var(--ink-2)'},svg,inW?'v2':'v1');
      T('text',{x:cx,y:cy+62,'text-anchor':'middle','font-size':11,fill:'var(--ink-2)'},svg,'Replica '+(i+1));
    }
    T('text',{x:20,y:20,'font-size':12,'font-weight':650,fill:'var(--blue)'},svg,'Filled blue: acknowledged the new write (W = '+W+')');
    T('text',{x:880,y:20,'text-anchor':'end','font-size':12,'font-weight':650,fill:'var(--red)'},svg,'Dashed red: contacted by a read, worst case (R = '+R+')');
    var ov=W+R-N;
    $('#q-verdict').innerHTML=ov>0?'<span class="good">Strong</span> <small>R + W = '+(R+W)+' &gt; N = '+N+'</small>':'<span class="bad">Eventual</span> <small>R + W = '+(R+W)+' ≤ N = '+N+'</small>';
    $('#q-wf').innerHTML=(N-W)+' down <small>of '+N+' replicas</small>';
    $('#q-rf').innerHTML=(N-R)+' down <small>of '+N+' replicas</small>';
    var note=ov>0?'Any '+R+' replicas must include at least '+ov+' of the '+W+' that took the write, so the newest version is always among the replies.':'In the worst case the read touches only replicas that missed the write and returns the old value until replication catches up.';
    if(W===1)note+=' W = 1 makes writes as fast as the fastest replica.';
    if(R===1)note+=' R = 1 makes reads as fast as the fastest replica.';
    if(W===N)note+=' W = N means one slow or dead replica blocks every write.';
    $('#qr-note').textContent=note;
  }
  [n,w,r].forEach(function(e){e.addEventListener('input',render);});
  $$('[data-q]').forEach(function(b){b.addEventListener('click',function(){var v=b.dataset.q.split(',');n.value=v[0];w.max=v[0];r.max=v[0];w.value=v[1];r.value=v[2];render();});});
  render();
});
mod('vc-lsm',function(){
  buildDiagram($('#vc-svg'),{w:900,h:250,nodes:[
    {id:'d1',x:20,y:100,w:110,h:56,t:'D1',s:'[Sx,1]'},
    {id:'d2',x:220,y:100,w:120,h:56,t:'D2',s:'[Sx,2]'},
    {id:'d3',x:410,y:20,w:190,h:56,t:'D3',s:'[Sx,2] [Sy,1]',cls:'hot'},
    {id:'d4',x:410,y:180,w:190,h:56,t:'D4',s:'[Sx,2] [Sz,1]',cls:'hot'},
    {id:'d5',x:690,y:100,w:190,h:56,t:'D5',s:'[Sx,3] [Sy,1] [Sz,1]',cls:'ok'}],
   edges:[
    {a:'d1.r',b:'d2.l',label:'write via Sx'},
    {a:'d2.r',ao:-10,b:'d3.l',route:'hvh',via:370,label:'write via Sy',lp:[362,60],la:'end'},
    {a:'d2.r',ao:10,b:'d4.l',route:'hvh',via:370,label:'write via Sz',lp:[362,202],la:'end'},
    {a:'d3.r',b:'d5.l',bo:-10,route:'hvh',via:645,label:'client merges,',lp:[653,64],la:'start'},
    {a:'d4.r',b:'d5.l',bo:10,route:'hvh',via:645,label:'Sx writes D5',lp:[653,202],la:'start'}]});
  buildDiagram($('#lsm-svg'),{w:900,h:240,
   annos:[{x:20,y:22,t:'Write path',bold:1},{x:20,y:162,t:'Read path',bold:1}],
   nodes:[
    {id:'put',x:20,y:34,w:100,h:50,t:'put(k, v)',kind:'client'},
    {id:'log',x:180,y:34,w:150,h:50,t:'Commit log',s:'disk, append only',kind:'store'},
    {id:'mem',x:410,y:34,w:150,h:50,t:'Memtable',s:'memory, sorted'},
    {id:'sst',x:650,y:34,w:230,h:50,t:'SSTables',s:'disk, sorted, immutable',kind:'store'},
    {id:'get',x:20,y:174,w:100,h:50,t:'get(k)',kind:'client'},
    {id:'mem2',x:180,y:174,w:150,h:50,t:'Memtable',s:'newest data'},
    {id:'bloom',x:410,y:174,w:150,h:50,t:'Bloom filters',s:'one per SSTable'},
    {id:'sst2',x:650,y:174,w:230,h:50,t:'SSTables',s:'only files that may match',kind:'store'}],
   edges:[
    {a:'put.r',b:'log.l',label:'1 · log'},
    {a:'log.r',b:'mem.l',label:'2 · insert'},
    {a:'mem.r',b:'sst.l',label:'3 · flush',cls:'dash'},
    {a:'get.r',b:'mem2.l',label:'check'},
    {a:'mem2.r',b:'bloom.l',label:'miss'},
    {a:'bloom.r',b:'sst2.l',label:'may contain'}]});
});

/* ---------- payments ---------- */
mod('pay-diagram',function(){
  buildDiagram($('#pay-svg'),{w:900,h:375,nodes:[
    {id:'client',x:20,y:150,w:110,h:50,t:'Checkout',kind:'client'},
    {id:'ps',x:170,y:150,w:130,h:50,t:'Payment service'},
    {id:'paydb',x:20,y:280,w:130,h:56,t:'Payment DB',s:'orders, keys',kind:'store'},
    {id:'exec',x:370,y:150,w:140,h:50,t:'Payment executor'},
    {id:'psp',x:570,y:150,w:140,h:50,t:'PSP',s:'Stripe, Adyen',kind:'ext'},
    {id:'card',x:770,y:150,w:120,h:50,t:'Card networks',s:'Visa, Mastercard',kind:'ext'},
    {id:'recon',x:770,y:40,w:120,h:50,t:'Reconciliation',s:'nightly'},
    {id:'ledger',x:370,y:280,w:140,h:56,t:'Ledger',s:'double entry',kind:'store'},
    {id:'wallet',x:570,y:280,w:140,h:56,t:'Wallet',s:'seller balances',kind:'store'}],
   edges:[
    {a:'client.r',b:'ps.l',label:'pay',cls:'hot'},
    {a:'ps.r',b:'exec.l',label:'execute',cls:'hot'},
    {a:'exec.r',b:'psp.l',label:'charge',cls:'hot'},
    {a:'psp.r',b:'card.l',label:'authorize'},
    {a:'ps.b',ao:-25,b:'paydb.r',route:'vh',label:'store order',lp:[202,262],la:'end'},
    {pts:[[610,150],[610,112],[235,112],[235,150]],label:'webhook: payment status',lp:[422,106],cls:'dash'},
    {a:'psp.t',ao:40,b:'recon.l',route:'vh',label:'settlement file',lp:[688,102],la:'start',cls:'dash'},
    {pts:[[260,200],[260,360],[440,360],[440,336]],label:'append entries',lp:[350,354]},
    {pts:[[260,200],[260,360],[640,360],[640,336]],label:'update balance',lp:[540,354]}]});
});
mod('pay-sim',function(){
  var btn=$('#pay-run'),log=$('#pay-log');
  function counts(n,keys){$('#pay-n').textContent=n;$('#pay-amt').textContent='€'+(n*50);
    var ks=Object.keys(keys);$('#pay-keys').innerHTML=ks.length?ks.map(function(k){return '<tr><td class="mono">'+k+'</td><td>'+esc(keys[k])+'</td></tr>';}).join(''):'<tr><td colspan="2" style="color:var(--ink-3)">Empty</td></tr>';}
  function add(c,w,t){var li=document.createElement('li');if(c)li.className=c;li.innerHTML='<span class="who">'+w+'</span>'+esc(t);log.appendChild(li);}
  btn.addEventListener('click',function(){
    btn.disabled=true;log.innerHTML='';
    var key=$('#pay-key').checked,K='ord_7f3a',n=0,keys={};counts(0,keys);
    var ev=[
      function(){add('','Client','POST /payments {amount: 5000, currency: "EUR"}'+(key?' with Idempotency-Key: '+K:' with no key'));},
      function(){n++;if(key)keys[K]='pay_001 · SUCCESS';add('ok','Server','New request. Charges €50 through the PSP: payment pay_001 succeeded.'+(key?' Stores the result under '+K+'.':''));},
      function(){add('warn','Network','The response is lost on the way back. The client sees only a timeout and cannot tell whether the buyer was charged.');},
      function(){add('','Client','Retries the same request, attempt 2'+(key?', with the same key '+K+'.':'.'));},
      function(){if(key)add('ok','Server','Key '+K+' already exists. Returns the stored result pay_001 without calling the PSP.');else{n++;add('err','Server','Looks like a new request. Charges €50 again: payment pay_002 succeeded.');}},
      function(){add(key?'ok':'err','Result',key?'Buyer charged once, €50. The retry was harmless.':'Buyer charged twice, €100 for one order. Now you owe a refund, a support ticket and an apology.');}
    ];
    var i=0;
    (function next(){ev[i]();counts(n,keys);i++;if(i<ev.length)setTimeout(next,RM?0:650);else btn.disabled=false;})();
  });
  counts(0,{});
});

/* ---------- quiz ---------- */
mod('quiz',function(){
  var QZ=[
    {q:'A read heavy service (100 reads per write) is slowing down under database load. What is usually the first move?',o:['Shard the database','Put a cache in front of the database and add read replicas','Switch to a NoSQL database','Add a message queue'],a:1,w:'Reads dominate, so serve them from memory and spread the rest across replicas. Sharding helps when writes or data size outgrow one primary, and it costs far more complexity.'},
    {q:'Why do web servers behind a load balancer need to be stateless?',o:['Stateless servers use less memory','So any server can handle any request, letting the balancer route freely and scale out','Load balancers cannot forward cookies','HTTP requires it'],a:1,w:'If session data lives on one server, a user routed elsewhere loses it. Moving state to a shared store makes servers interchangeable, which enables autoscaling and rolling deploys.'},
    {q:'A store runs with N = 5, W = 3, R = 2. Are reads guaranteed to see the latest write?',o:['Yes, because W is a majority','Yes, because R is at least 1','No, because R + W must be greater than N','No, because W must equal N'],a:2,w:'R + W = 5, which is not greater than N = 5. A worst case read can hit the two replicas that missed the write. Raise R to 3 or W to 4.'},
    {q:'An account with 50M followers posts. How should the feed system handle it?',o:['Push the post ID into all 50M feeds right away','Skip fan-out and merge the post in when followers read their feeds','Store the post only in a cache','Send each follower a push notification instead'],a:1,w:'Pushing 50M feed writes for one post takes nearly a minute of worker time at 1M inserts per second. Hybrid feeds pull celebrity posts at read time.'},
    {q:'A client times out waiting for a payment response and retries. What prevents a double charge?',o:['A longer timeout','A distributed lock around the PSP call','An idempotency key that the server stores with the result','Retrying only once'],a:2,w:'The first attempt may have succeeded. The server recognizes the repeated key and returns the stored result instead of charging again.'},
    {q:'A cache cluster uses hash(key) mod N with 4 nodes. You add a fifth. Roughly what share of keys move?',o:['About 20%','About 50%','About 80%','None'],a:2,w:'A key stays put only if hash mod 4 equals hash mod 5, which holds for about 1 key in 5, so roughly 80% move. Consistent hashing moves about 20%, just the new node’s share.'},
    {q:'You need codes for 12B short URLs in base62. What is the minimum code length?',o:['5 characters','6 characters','7 characters','8 characters'],a:1,w:'62⁵ is about 916M, too few. 62⁶ is about 56.8B, which is enough. Many designs still pick 7 for headroom.'},
    {q:'A nearby search misses a café 50 m away, just across a geohash cell boundary. What is the fix?',o:['Use a longer geohash','Query the cell plus its 8 neighbors, then filter by exact distance','Switch to a relational database','Index latitude and longitude separately'],a:1,w:'Neighboring points can have different prefixes. Searching the 3 × 3 block around the user covers the boundary, and exact distance removes the extras.'},
    {q:'A token bucket holds 10 tokens and refills 2 per second. It is full when 15 requests arrive at once. What happens?',o:['All 15 are allowed','10 are allowed and 5 get 429','2 are allowed and 13 get 429','All 15 are queued'],a:1,w:'A full bucket lets a burst up to its capacity through. The other 5 are rejected until tokens refill, one every half second.'},
    {q:'During a network partition, what does an AP system do when asked to read?',o:['Returns an error','Waits until the partition heals','Answers with the data it has, which may be stale','Forwards the read to the other side'],a:2,w:'AP systems stay available by answering locally and reconcile after the partition heals. CP systems refuse instead of risking a stale answer.'},
    {q:'Two fans try to hold the same seat at the same instant. Which approach guarantees exactly one succeeds?',o:['Check the seat in application code, then update it','One UPDATE with status = FREE in its WHERE clause, then check the rows changed','Cache seat status in each server’s memory','Let both succeed and refund one later'],a:1,w:'The database applies the conditional update atomically, so only one statement changes the row. Check then update in application code leaves a race window between the two steps.'},
    {q:'Why does each trie node in an autocomplete service store its top 5 completions?',o:['To save memory','So a lookup is a walk down the prefix, with no search of the subtree','Because tries cannot be sharded otherwise','To support typo correction'],a:1,w:'Precomputing the answer at every node makes serving cost proportional to the prefix length. The ranking happens offline in the builder.'},
    {q:'A user edits page 3 of a 40 MB file synced in 4 MB blocks. Roughly how much is uploaded?',o:['40 MB','About 4 MB','About 20 MB','Nothing until the next full sync'],a:1,w:'Only blocks whose hash changed are uploaded. A small edit usually touches one block, and content defined chunking keeps it that way even when bytes are inserted.'},
    {q:'What does adaptive bitrate streaming do?',o:['Compresses video harder on the server when traffic is high','Lets the player choose the quality of each segment from measured bandwidth','Sends every quality at once and the player discards the rest','Lowers the frame rate to save bandwidth'],a:1,w:'Each rendition is cut into short segments listed in a manifest. The player picks the next segment’s quality from its throughput and buffer, so quality drops instead of the video freezing.'},
    {q:'What keeps a web crawler from overloading a single website?',o:['A Bloom filter of seen URLs','One back queue per host, with a delay between fetches','Fetching only home pages','Adding more fetcher machines'],a:1,w:'Politeness comes from the frontier: each host has its own queue and a next allowed fetch time. The Bloom filter prevents duplicate fetches, not overload.'}
  ];
  var box=$('#qz'),answered=0,right=0;
  function score(){$('#qz-score').textContent=answered+' of '+QZ.length+' answered'+(answered?' · '+right+' correct':'');}
  function build(){
    answered=0;right=0;box.innerHTML='';
    QZ.forEach(function(it,qi){
      var d=document.createElement('div');d.className='q';
      d.innerHTML='<h4>Question '+(qi+1)+'</h4><p class="qt">'+esc(it.q)+'</p><div class="opts"></div><p class="why" hidden></p>';
      var opts=$('.opts',d),why=$('.why',d);
      it.o.forEach(function(o,oi){var b=document.createElement('button');b.type='button';b.className='opt';b.textContent=o;
        b.addEventListener('click',function(){
          $$('.opt',d).forEach(function(x,xi){x.disabled=true;if(xi===it.a)x.classList.add('right');});
          var ok=oi===it.a;if(!ok)b.classList.add('wrong');
          answered++;if(ok)right++;score();
          why.innerHTML='<b>'+(ok?'Correct.':'Not quite.')+'</b> '+esc(it.w);why.hidden=false;
        });opts.appendChild(b);});
      box.appendChild(d);
    });
    score();
  }
  $('#qz-reset').addEventListener('click',build);
  build();
});

/* =====================================================================
   SHORT VIDEOS: animated, captioned system walkthroughs
   ===================================================================== */
var EXT={};

var VID={};
function NN(a){return a.map(function(r){return {id:r[0],x:r[1],y:r[2],w:r[3],h:r[4],t:r[5],s:r[6]||'',kind:r[7]||'svc'};});}
function EE(a){return a.map(function(r){var e={id:r[0],a:r[1],b:r[2],label:r[3]||''};var o=r[4]||{};for(var k in o)e[k]=o[k];return e;});}
function VDEF(key,title,nodes,edges,scenes){VID[key]={title:title,nodes:NN(nodes),edges:EE(edges),scenes:scenes};}

/* ---- III.1 load balancing ---- */
VDEF('lb','Load balancing',
 [['users',14,155,80,50,'Users','','client'],['lb',130,150,130,60,'Load balancer','health checks'],['A',360,40,120,46,'Server A'],['B',360,157,120,46,'Server B'],['C',360,274,120,46,'Server C'],['sb',130,284,130,50,'Standby LB','same floating IP']],
 [['ul','users.r','lb.l'],['ea','lb.r','A.l','',{ao:-12,route:'hvh',via:320}],['eb','lb.r','B.l'],['ec','lb.r','C.l','',{ao:12,route:'hvh',via:320}],['es','lb.b','sb.t','heartbeat',{cls:'both dash',lp:[202,252],la:'start'}]],
 [{c:'Every request arrives at one public address: the load balancer.',add:'users lb ul',f:'ul ul'},
  {c:'It forwards each request to a healthy server behind it. Round robin simply takes turns: A, then B, then C.',add:'A B C ea eb ec',f:'ul ea ul eb ul ec'},
  {tr:1,c:'If server C gets slow, round robin keeps feeding it. Least connections sends new work to whoever has the fewest open requests instead.',set:{C:'Server C|3× slower'},hi:'C',f:'ul ea ul eb ul ea ul eb'},
  {c:'Health checks call every server every few seconds. When C stops answering, it is taken out of rotation and users never notice.',set:{C:'Server C|failed'},rm:'ec',hi:'C',f:'ul ea ul eb'},
  {c:'The balancer itself must not become the new single point of failure, so run a standby pair that shares one floating IP address.',add:'sb es',f:'es es'}]);

/* ---- III.2 caching ---- */
VDEF('cache','Caching',
 [['app',20,152,120,56,'App server'],['cache',250,40,140,56,'Cache','Redis','store'],['db',480,152,140,56,'Database','','store']],
 [['get','app.t','cache.l','GET user:42',{ao:20,route:'vh',lp:[146,60],la:'start'}],['hit','cache.b','app.r','hit, 0.3 ms',{route:'vh',lp:[326,140],la:'start'}],
  ['read','app.r','db.l','miss: query',{ao:14,bo:14,lp:[410,186]}],['fill','app.t','cache.t','SET with a TTL',{ao:-30,route:'vhv',via:22,lp:[180,15],la:'start'}]],
 [{c:'Without a cache, every read is a database query of a few milliseconds, and the database becomes the bottleneck.',add:'app db read',f:'read read<'},
  {c:'With cache aside, the app checks the cache first. A hit comes back from memory in well under a millisecond.',add:'cache get hit',f:'get hit'},
  {c:'On a miss, the app reads the database and then stores the result in the cache with a time to live.',add:'fill',set:{hit:'miss'},hi:'read fill',f:'get hit read read< fill'},
  {c:'Real traffic is skewed toward popular items. With a ninety percent hit rate, the database sees only one read in ten.',set:{hit:'hit, 0.3 ms'},f:'get hit get hit get hit read'},
  {tr:1,c:'When data changes, update the database first, then delete the cache key, so the next read loads the fresh value.',set:{get:'DEL user:42'},hi:'get read',f:'read get'},
  {c:'And protect hot keys. When one expires, let a single request refresh it while the others wait, and add random jitter to expiry times.',set:{get:'GET user:42'},f:'get hit'}]);

/* ---- III.4 CAP ---- */
VDEF('cap','CAP and consistency',
 [['A',14,152,90,50,'Client A','writes','client'],['n1',170,145,130,64,'Node 1','x = 1','store'],['n2',340,145,130,64,'Node 2','x = 1','store'],['B',536,152,90,50,'Client B','reads','client']],
 [['w','A.r','n1.l','write'],['rep','n1.r','n2.l','replicate',{cls:'both dash'}],['r','B.l','n2.r','read']],
 [{c:'Two replicas hold the same value. A write to node one is copied to node two.',add:'A n1 n2 B w rep r',set:{n1:'Node 1|x = 2',n2:'Node 2|x = 2'},f:'w rep'},
  {c:'Client B reads from node two and gets the new value. While the network works, everyone agrees.',f:'r r<'},
  {c:'Now the link between them fails. This is a network partition, and in a real network it is only a matter of time.',cls:{rep:'cut'},set:{rep:'partitioned'},hi:'rep'},
  {tr:1,c:'A consistent system refuses the write rather than let the replicas disagree. Correct, but unavailable until the network heals.',set:{n1:'Node 1|refuses'},hi:'n1',f:'w w<'},
  {tr:1,c:'An available system accepts the write on node one, while node two keeps answering with the old value. Available, but stale.',set:{n1:'Node 1|x = 3',n2:'Node 2|x = 2, stale'},hi:'n2',f:'w r r<'},
  {c:'When the network heals, the replicas sync. Choose consistency for money and inventory, and availability for feeds and carts.',cls:{rep:'both dash'},set:{rep:'replicate',n2:'Node 2|x = 3'},f:'rep'}]);

/* ---- III.5 queues ---- */
VDEF('queues','Queues and streams',
 [['prod',14,152,110,56,'Producers','web servers'],['q',190,152,180,56,'Queue','','queue'],['c1',466,62,150,44,'Consumer 1'],['c2',466,158,150,44,'Consumer 2'],['c3',466,254,150,44,'Consumer 3'],['dlq',190,290,180,46,'Dead letters','','queue']],
 [['pq','prod.r','q.l','publish'],['q1','q.r','c1.l','',{ao:-12,route:'hvh',via:420}],['q2','q.r','c2.l'],['q3','q.r','c3.l','',{ao:12,route:'hvh',via:420}],['qd','q.b','dlq.t','after 5 failures',{cls:'dash',lp:[288,256],la:'start'}]],
 [{c:'A queue sits between the services that produce work and the services that do it, so neither has to wait for the other.',add:'prod q pq',f:'pq pq pq'},
  {c:'Consumers pull messages at their own pace and acknowledge each one when it is done.',add:'c1 c2 q1 q2',f:'pq q1 pq q2'},
  {c:'During a spike, messages arrive faster than consumers can handle them. The queue absorbs the burst instead of dropping requests.',set:{q:'Queue|backlog 12,000'},hi:'q',f:'pq+q1 pq+q2 pq pq'},
  {c:'Add consumers, or let autoscaling add them based on queue depth, and the backlog drains.',add:'c3 q3',set:{q:'Queue|draining'},f:'q1+q2+q3 q1+q2+q3'},
  {tr:1,c:'Delivery is at least once, so the same message can arrive twice. Every consumer must be idempotent.',set:{q:'Queue|'},hi:'c2',f:'q2 q2'},
  {c:'A message that keeps failing is moved to a dead letter queue, so it never blocks the messages behind it.',add:'dlq qd',f:'qd'}]);

/* ---- III.6 rate limiting ---- */
VDEF('ratelimit','Rate limiting',
 [['client',14,152,96,50,'Client','','client'],['gw',170,145,150,64,'API gateway','rate limiter'],['redis',170,284,150,56,'Redis','token counts','store'],['api',440,152,180,50,'API servers']],
 [['cg','client.r','gw.l'],['gr','gw.b','redis.t','take token',{cls:'both',lp:[252,254],la:'start'}],['ga','gw.r','api.l','allowed'],['rej','gw.t','client.t','429 Too Many Requests',{route:'vhv',via:100,cls:'hot'}]],
 [{c:'A rate limiter sits in the API gateway and decides, for each user or API key, whether a request may pass.',add:'client gw api cg ga',f:'cg ga'},
  {c:'With a token bucket, each user has a bucket of tokens. Every request takes one, and tokens drip back at a fixed rate.',add:'redis gr',set:{gw:'API gateway|tokens: 5 of 5'},f:'cg gr ga'},
  {tr:1,c:'A burst can spend the whole bucket at once. That keeps normal use feeling fast, at the cost of short spikes reaching the servers.',set:{gw:'API gateway|tokens: 0 of 5'},f:'cg ga cg ga cg ga'},
  {c:'When the bucket is empty, the gateway answers four twenty nine, too many requests, with a header saying when to retry.',add:'rej',hi:'gw',f:'cg rej'},
  {c:'Counts live in Redis so every gateway node sees the same numbers. An atomic script stops two nodes from spending the last token.',set:{gw:'API gateway|tokens: 1 of 5'},f:'cg gr gr< ga'}]);

/* ---- IV.1 URL shortener ---- */
VDEF('url','URL shortener',
 [['client',14,150,90,50,'Client','','client'],['api',150,147,130,56,'Web servers','stateless'],['idg',150,284,130,50,'ID allocator','leases ranges'],['cache',400,40,150,56,'Cache','code → URL','store'],['db',400,254,150,56,'URL store','','store']],
 [['ca','client.r','api.l'],['ai','api.b','idg.t','next ID',{lp:[222,252],la:'start'}],['ac','api.r','cache.l','lookup',{ao:-12,route:'hvh',via:340,lp:[346,112],la:'start'}],
  ['ad','api.r','db.l','insert / read',{ao:12,route:'hvh',via:340,lp:[346,240],la:'start'}],['re','api.t','client.t','302 redirect',{route:'vhv',via:110}]],
 [{c:'A URL shortener has two paths. Creating a short link is rare. Following one is about a hundred times more common.',add:'client api ca',f:'ca ca'},
  {c:'To shorten a link, the server takes the next number from an ID range it leased, writes it in base 62, and stores the row. No collisions, no extra reads.',add:'idg ai db ad',f:'ca ai ai< ad'},
  {c:'Following a link, the server checks the cache and answers with a redirect to the long URL.',add:'cache ac re',f:'ca ac ac< re'},
  {c:'Only cache misses reach the database. With a ninety percent hit rate, four thousand redirects a second become four hundred reads.',hi:'ad',f:'ca ac ad ad< re'},
  {tr:1,c:'Use a temporary redirect, a 302, so every click passes through you and can be counted. A permanent 301 is cached by browsers and hides those clicks.',hi:'re',f:'ca re'}]);

/* ---- IV.2 news feed ---- */
VDEF('feed','News feed',
 [['author',14,40,100,46,'Author','','client'],['post',150,40,130,46,'Post service'],['q',318,40,140,46,'Fan-out queue','','queue'],['wk',496,40,130,46,'Workers'],
  ['pdb',150,150,130,50,'Posts','','store'],['graph',318,150,140,50,'Follow graph','','store'],['fc',496,268,130,56,'Feed cache','user → post IDs','store'],
  ['reader',14,268,100,50,'Reader','','client'],['fs',260,270,140,50,'Feed service']],
 [['ap','author.r','post.l'],['pq','post.r','q.l','',{cls:'dash'}],['qw','q.r','wk.l'],['pd','post.b','pdb.t','store',{lp:[221,124],la:'start'}],
  ['wg','wk.b','graph.r','followers?',{ao:-30,route:'vh',lp:[536,132],la:'start'}],['wf','wk.b','fc.t','push post ID',{ao:30,bo:30,lp:[585,224],la:'end'}],
  ['rf','reader.r','fs.l'],['ff','fs.r','fc.l','1 · IDs'],['fd','fs.t','pdb.b','2 · hydrate',{ao:-30,route:'vhv',via:236}]],
 [{c:'When someone posts, the post service stores it once.',add:'author post pdb ap pd',f:'ap pd'},
  {c:'Then it drops an event on a queue. Fan out workers look up everyone who follows the author.',add:'q wk graph pq qw wg',f:'pq qw wg wg<'},
  {c:'For each follower, the workers push the new post ID into that follower’s feed cache. This is fan out on write.',add:'fc wf',hi:'wf',f:'wf wf wf'},
  {c:'Reading is now cheap. The feed service takes the list of IDs from the cache and fills in the posts.',add:'reader fs rf ff fd',f:'rf ff ff< fd fd< rf<'},
  {tr:1,c:'But a celebrity with fifty million followers would need fifty million writes for a single post.',set:{author:'Celebrity|50M followers'},hi:'wk wf',f:'wf wf wf wf wf'},
  {tr:1,c:'So celebrity posts skip fan out and are merged in when a follower opens the feed. This hybrid is the standard answer.',hi:'fd',f:'rf ff fd fd<'}]);

/* ---- IV.3 chat ---- */
VDEF('chat','Chat system',
 [['alice',10,152,70,46,'Alice','','client'],['cs1',100,150,120,50,'Chat server 1'],['idg',100,40,120,44,'ID service','Snowflake'],['store',100,272,120,50,'Messages','','store'],
  ['pres',250,40,120,44,'Presence'],['q',250,150,120,50,'Bob’s inbox','','queue'],['cs2',400,150,120,50,'Chat server 2'],['bob',548,152,78,46,'Bob','','client'],['push',548,272,78,50,'Push','APNs, FCM','ext']],
 [['ac','alice.r','cs1.l'],['ci','cs1.t','idg.b','ID',{lp:[166,124],la:'start'}],['cs','cs1.b','store.t','persist',{lp:[166,244],la:'start'}],
  ['cp','cs1.t','pres.b','where is Bob?',{ao:40,route:'vhv',via:112}],['cq','cs1.r','q.l'],['qc','q.r','cs2.l'],['cb','cs2.r','bob.l'],
  ['qp','q.b','push.l','offline: notify',{route:'vh'}],['pb','push.t','bob.b','wake',{lp:[593,240],la:'start'}]],
 [{tr:1,c:'Each chat app keeps a WebSocket open to a chat server, so messages flow both ways instantly. The price: chat servers become stateful and must handle reconnects.',add:'alice cs1 ac',f:'ac ac<'},
  {c:'When Alice sends a message, the server first gets an ID that sorts by time, so everyone sees the same order.',add:'idg ci',f:'ac ci ci<'},
  {c:'It stores the message before doing anything else. Once Alice sees one tick, the message cannot be lost.',add:'store cs',f:'cs cs<'},
  {c:'Presence says Bob is connected to the second server, so the message travels through Bob’s inbox queue and down his socket.',add:'pres cp q cs2 bob cq qc cb',f:'cp cq qc cb'},
  {c:'Bob’s phone acknowledges, and the receipt travels back. Now Alice sees two ticks.',f:'cb< qc< cq< ac<',fc:'blue'},
  {c:'If Bob is offline, a push notification wakes his phone. When it reconnects, it fetches every message after the last ID it saw.',add:'push qp pb',set:{bob:'Bob|offline'},hi:'push',f:'cq qp pb'}]);

/* ---- IV.4 notifications ---- */
VDEF('notify','Notification system',
 [['svc',14,150,100,56,'Services','billing, social'],['ns',150,150,124,56,'Notifier','prefs, dedupe'],['pref',150,282,124,50,'Preferences','','store'],
  ['q1',320,50,124,44,'Push queue','','queue'],['q2',320,156,124,44,'SMS queue','','queue'],['q3',320,262,124,44,'Email queue','','queue'],
  ['p1',490,50,136,44,'APNs, FCM','','ext'],['p2',490,156,136,44,'SMS provider','','ext'],['p3',490,262,136,44,'Email provider','','ext']],
 [['sn','svc.r','ns.l'],['np','ns.b','pref.t','opted in?',{lp:[218,254],la:'start'}],['n1','ns.r','q1.l','',{ao:-12,route:'hvh',via:298}],['n2','ns.r','q2.l'],['n3','ns.r','q3.l','',{ao:12,route:'hvh',via:298}],
  ['w1','q1.r','p1.l'],['w2','q2.r','p2.l'],['w3','q3.r','p3.l']],
 [{c:'Many services need to reach users: a payment went through, a friend commented, a login code was requested.',add:'svc ns sn',f:'sn sn'},
  {c:'The notification service checks the user’s preferences and quiet hours, and drops duplicates using the event ID.',add:'pref np',f:'sn np np<'},
  {tr:1,c:'Each channel gets its own queue, so a slow email provider never delays push notifications or login codes.',add:'q1 q2 q3 n1 n2 n3',f:'n1+n2+n3 n1+n2+n3'},
  {c:'Workers send through providers: Apple and Google for push, an SMS gateway, and an email service.',add:'p1 p2 p3 w1 w2 w3',f:'w1+w2+w3 w1+w2+w3'},
  {c:'Providers fail and time out. Workers retry with backoff, and after too many failures the message goes to a dead letter queue.',set:{p2:'SMS provider|timeout'},hi:'p2',f:'w2 w2 w2'},
  {c:'Delivery is at least once, so every notification carries an ID and the app hides duplicates. Track sent, delivered and opened for each one.',set:{p2:'SMS provider|'},f:'sn n1 w1'}]);

/* ---- IV.5 autocomplete ---- */
VDEF('auto','Search autocomplete',
 [['user',14,40,96,50,'User','types “tw”','client'],['api',150,40,130,50,'Suggest API'],['trie',330,36,150,58,'Trie cache','prefix → top 5','store'],
  ['logs',150,170,130,46,'Query log','','queue'],['agg',330,170,150,46,'Aggregator','hourly + weekly'],['build',330,284,150,46,'Trie builder']],
 [['ua','user.r','api.l'],['at','api.r','trie.l','lookup'],['al','api.b','logs.t','log',{cls:'dash',lp:[221,140],la:'start'}],['lg','logs.r','agg.l','count'],
  ['gb','agg.b','build.t','scores',{lp:[411,262],la:'start'}],['bt','build.r','trie.r','swap in',{route:'hvh',via:540,cls:'dash',lp:[546,185],la:'start'}]],
 [{c:'As the user types, every keystroke asks for the five best completions of that prefix. The answer must arrive in tens of milliseconds.',add:'user api ua',f:'ua ua'},
  {c:'Suggestions come from a trie held in memory. Each node already stores its top five results, so a lookup is just a walk down the prefix.',add:'trie at',f:'ua at at< ua<'},
  {c:'Every search is logged. An aggregator counts queries for each prefix, hourly for trending terms and weekly for everything else.',add:'logs agg al lg',f:'ua al lg'},
  {tr:1,c:'A builder creates a new trie from those counts and swaps it in. Reads never wait for writes.',add:'build gb bt',f:'gb bt'},
  {c:'To cut traffic, the browser waits a moment between keystrokes and caches results, and the trie is sharded by prefix range.',f:'ua at at<'}]);

/* ---- IV.6 crawler ---- */
VDEF('crawl','Web crawler',
 [['seeds',14,40,96,46,'Seed URLs','','ext'],['front',150,36,140,54,'Frontier','per host queues','queue'],['fetch',330,36,120,54,'Fetchers'],['web',490,36,136,54,'Websites','robots.txt','ext'],
  ['parse',330,160,120,54,'Parser','dedupe content'],['store',490,160,136,54,'Page store','','store'],['links',150,160,140,54,'Link filter','seen before?']],
 [['sf','seeds.r','front.l'],['ff','front.r','fetch.l'],['fw','fetch.r','web.l','GET'],['fp','fetch.b','parse.t','HTML',{lp:[396,132],la:'start'}],
  ['ps','parse.r','store.l','save'],['pl','parse.l','links.r','links'],['lf','links.t','front.b','new URLs',{lp:[226,130],la:'start'}]],
 [{c:'A crawler starts from a list of seed URLs placed in the frontier, a set of queues that decides what to fetch next.',add:'seeds front sf',f:'sf sf'},
  {c:'Fetchers take URLs and download pages. One queue per website keeps the crawler polite, and robots rules are always respected.',add:'fetch web ff fw',f:'ff fw fw<'},
  {c:'The parser extracts text and links, and a fingerprint of the content catches the same page under different addresses.',add:'parse store fp ps',f:'fp ps'},
  {tr:1,c:'Each link is checked against a Bloom filter of URLs already seen. It uses a fraction of the memory of a full set; the cost is that a false positive occasionally skips a page.',add:'links pl lf',f:'pl lf'},
  {c:'That loop runs on hundreds of machines. A billion pages a month is about four hundred pages every second.',f:'ff fw fw< fp pl lf'},
  {c:'Watch for traps like endless calendar pages. Cap the depth and the number of pages for each site.',hi:'links',f:'pl lf'}]);

/* ---- IV.7 nearby places ---- */
VDEF('geo','Nearby places',
 [['user',14,152,90,50,'User','','client'],['loc',150,148,150,58,'Location service','read only'],['gc',380,56,150,54,'Geo cache','cell → place IDs','store'],['rep',380,250,150,54,'Read replicas','full index','store']],
 [['ul','user.r','loc.l'],['lg','loc.r','gc.l','9 cells',{ao:-12,route:'hvh',via:340,lp:[346,120],la:'start'}],['lr','loc.r','rep.l','on a miss',{ao:12,route:'hvh',via:340,lp:[346,240],la:'start'}]],
 [{c:'Geohash turns a location into a short string. Places close together share a prefix, so everything in one cell becomes a fast prefix lookup.',card:{h:'Cells share prefixes',grid:{lat:48.8584,lng:2.2945,p:6}}},
  {c:'But a café across the street can sit in the next cell. So always search the cell and its eight neighbors, then filter by exact distance.',card:{h:'Search nine cells',grid:{lat:48.8584,lng:2.2945,p:6,all:1}}},
  {c:'The location service looks up those nine cells in a cache keyed by geohash.',add:'user loc gc ul lg',f:'ul lg lg< ul<'},
  {tr:1,c:'The index for two hundred million places is only a few gigabytes, so every replica keeps a full copy instead of sharding by region and creating hot shards in big cities.',add:'rep lr',f:'ul lr lr< ul<'}]);

/* ---- IV.8 ticket booking ---- */
VDEF('ticket','Ticket booking',
 [['fa',14,60,90,46,'Fan A','','client'],['fb',14,254,90,46,'Fan B','','client'],['wr',140,150,124,56,'Waiting room','virtual queue'],['bk',300,150,130,56,'Booking service'],
  ['hold',300,36,130,50,'Seat holds','10 min expiry','store'],['db',470,150,150,56,'Seats DB','','store'],['pay',470,276,150,50,'Payment','PSP','ext']],
 [['ab','fa.r','bk.l','',{route:'hvh',via:282,bo:-10}],['bb','fb.r','bk.l','',{route:'hvh',via:282,bo:10}],
  ['aw','fa.r','wr.l','',{route:'hvh',via:122,bo:-10}],['bw','fb.r','wr.l','',{route:'hvh',via:122,bo:10}],['wb','wr.r','bk.l'],
  ['bh','bk.t','hold.b','hold',{lp:[371,122],la:'start'}],['bd','bk.r','db.l','reserve'],['bp','bk.b','pay.l','charge',{route:'vh'}]],
 [{c:'Two fans click the same seat at the same moment. Without care, both purchases succeed, and one of them gets a nasty surprise at the venue.',add:'fa fb bk db ab bb bd',f:'ab+bb bd bd'},
  {c:'Let the database decide. Update the seat only if it is still free. Exactly one update changes a row, and the other changes nothing.',set:{db:'Seats DB|WHERE status = FREE'},hi:'db',f:'bd bd<'},
  {c:'The winner gets a hold that expires in ten minutes. If they abandon checkout, the seat quietly becomes free again.',add:'hold bh',f:'bh bh<'},
  {c:'After payment succeeds, the hold becomes a confirmed booking, with an idempotency key so a retry can never book twice.',add:'pay bp',f:'bp bp< bd'},
  {c:'When a huge tour goes on sale, millions arrive at once. A virtual waiting room admits fans in batches the system can handle.',rm:'ab bb',add:'wr aw bw wb',set:{wr:'Waiting room|2M fans'},hi:'wr',f:'aw+bw wb aw+bw wb'},
  {tr:1,c:'Locks, version checks or conditional updates all work. Name your choice, and say exactly what happens to the fan who loses.',f:'wb bd'}]);

/* ---- IV.9 ride sharing ---- */
VDEF('ride','Ride sharing',
 [['drv',14,40,100,46,'Drivers','','client'],['gw',150,40,140,50,'Driver gateway','GPS + offers'],['geo',340,36,150,58,'Driver index','in memory, by cell','store'],
  ['rider',14,262,100,46,'Rider','','client'],['match',150,260,140,50,'Matching'],['trip',340,260,150,50,'Trips','','store']],
 [['dg','drv.r','gw.l','',{cls:'both'}],['gg','gw.r','geo.l','update'],['rm','rider.r','match.l'],['mg','match.t','geo.b','nearby drivers',{ao:40,bo:-40,route:'vhv',via:175}],
  ['of','match.t','gw.b','offer',{ao:-30,bo:-30,lp:[196,180],la:'start'}],['mt','match.r','trip.l','create']],
 [{c:'Drivers send their location every few seconds. With a million drivers online, that is a quarter of a million updates per second.',add:'drv gw dg',f:'dg dg dg'},
  {tr:1,c:'So positions live in memory, in an index keyed by map cell, and old points simply expire. Never write every update to the main database.',add:'geo gg',f:'dg gg'},
  {c:'A rider requests a trip. Matching asks the index for available drivers in nearby cells and ranks them by estimated arrival time.',add:'rider match rm mg',f:'rm mg mg<'},
  {c:'The ride is offered to one driver at a time, with a short timeout before it moves on to the next.',add:'of',f:'of dg<'},
  {c:'When the driver accepts, the trip is created. A compare and set on the driver’s status stops two riders from getting the same car.',add:'trip mt',f:'dg of< mt'},
  {c:'Everything is partitioned by city. Matching in Malmö never needs data from Melbourne.',f:'dg gg rm mg'}]);

/* ---- IV.10 video streaming ---- */
VDEF('video','Video streaming',
 [['cr',14,40,100,46,'Creator','','client'],['up',150,40,120,46,'Upload API'],['raw',306,36,130,54,'Originals','object store','store'],['tq',472,40,154,46,'Transcode jobs','','queue'],
  ['tw',472,152,154,50,'Transcoders','parallel segments'],['seg',472,262,154,54,'Renditions','240p to 4K','store'],['cdn',270,262,140,54,'CDN','edge caches','ext'],['view',14,262,110,54,'Viewer','','client']],
 [['cu','cr.r','up.l'],['ur','up.r','raw.l'],['rq','raw.r','tq.l','',{cls:'dash'}],['qt','tq.b','tw.t'],['ts','tw.b','seg.t'],['sc','seg.l','cdn.r','cache'],['vc','view.r','cdn.l','segments']],
 [{c:'Creators upload in chunks straight into object storage, so a dropped connection resumes instead of starting over.',add:'cr up raw cu ur',f:'cu ur ur ur'},
  {c:'A finished upload triggers transcoding. The video is cut into segments of a few seconds and processed in parallel.',add:'tq tw rq qt',f:'rq qt'},
  {c:'Each segment is encoded at several resolutions and bit rates, from 240p for weak mobile networks up to 4K.',add:'seg ts',f:'ts ts ts'},
  {c:'Viewers stream from a CDN close to them. Popular videos are served almost entirely from edge caches.',add:'cdn view sc vc',f:'sc vc< vc<'},
  {c:'The player measures bandwidth and switches quality segment by segment. This is adaptive bitrate streaming, using HLS or DASH.',set:{view:'Viewer|1080p → 480p'},hi:'view',f:'vc vc< vc vc<'},
  {tr:1,c:'Bandwidth is the real bill. Spend extra encoding time on popular videos with newer codecs, where every saved byte is multiplied by millions of views, and keep the long tail cheap.',set:{view:'Viewer|'},f:'sc vc<'}]);

/* ---- IV.11 file sync ---- */
VDEF('sync','File sync',
 [['laptop',14,150,96,50,'Laptop','','client'],['api',150,40,140,50,'Sync service'],['meta',330,40,150,50,'Metadata DB','versions, journal','store'],
  ['notif',516,40,110,50,'Notifier','long poll'],['phone',516,262,110,50,'Phone','','client'],['blocks',150,262,140,50,'Block store','4 MB chunks','store']],
 [['la','laptop.t','api.l','commit',{route:'vh',lp:[68,110],la:'start'}],['lb','laptop.b','blocks.l','changed blocks',{route:'vh',lp:[68,248],la:'start'}],
  ['am','api.r','meta.l'],['mn','meta.r','notif.l','',{cls:'dash'}],['np','notif.b','phone.t','file changed',{lp:[577,176],la:'start'}],
  ['pm','phone.l','meta.b','fetch block list',{ao:-12,route:'hv'}],['bp','blocks.r','phone.l','download blocks',{ao:12,bo:12,lp:[400,292]}]],
 [{c:'Files are split into 4 MB blocks named by the hash of their contents. After an edit, only blocks whose hash changed are uploaded, and identical blocks are stored once for everyone.',add:'laptop blocks lb',f:'lb lb'},
  {c:'Then the client commits a new version, which is just the list of block hashes, to the metadata database.',add:'api meta la am',f:'la am'},
  {c:'Your other devices hold a long poll open to the notifier, which answers as soon as something in the folder changes.',add:'notif phone mn np',f:'mn np'},
  {c:'The phone fetches the new block list and downloads only the blocks it does not already have.',add:'pm bp',f:'pm pm< bp'},
  {tr:1,c:'If two devices edit the same file offline, the second commit is based on an old version. Keep both as a conflicted copy, and never lose work.',set:{phone:'Phone|conflicted copy'},hi:'phone'}]);

/* ---- IV.12 collaborative editor ---- */
VDEF('docs','Collaborative editor',
 [['alice',14,60,96,46,'Alice','','client'],['bob',14,256,96,46,'Bob','','client'],['srv',170,150,150,60,'Collab server','one per document'],
  ['log',400,60,150,50,'Operation log','append only','store'],['snap',400,256,150,50,'Snapshots','','store']],
 [['as','alice.r','srv.l','',{route:'hvh',via:140,bo:-12,cls:'both'}],['bs','bob.r','srv.l','',{route:'hvh',via:140,bo:12,cls:'both'}],
  ['sl','srv.r','log.l','append',{route:'hvh',via:360,ao:-10,lp:[366,128],la:'start'}],['ls','log.b','snap.t','every 1,000 ops',{cls:'dash',lp:[481,184],la:'start'}]],
 [{c:'Everyone editing a document connects over a WebSocket to the one collaboration server that owns that document.',add:'alice bob srv as bs',f:'as+bs'},
  {c:'Edits travel as small operations, such as insert X at position one. The server orders them and sends each one to everyone else.',f:'as bs< bs as<'},
  {c:'Trouble starts when edits cross. Bob deleted the letter c at position two, but Alice’s insert has already shifted it to position three.',card:{h:'Two edits cross',lines:['Text: "abc"','Alice: insert X at 1 → "aXbc"','Bob:   delete at 2  (the c)','Applied as sent → "aXc"  ✗']}},
  {c:'The server transforms Bob’s delete against Alice’s insert, so it becomes delete at three, and everyone converges on the same text. This is operational transformation.',card:{h:'Transform, then apply',all:1,lines:['Text: "abc"','Alice: insert X at 1 → "aXbc"','Bob:   delete at 2 → delete at 3','!Result everywhere: "aXb"  ✓']}},
  {c:'Every operation is appended to a log, and a snapshot every thousand operations makes opening a document fast.',add:'log snap sl ls',f:'as sl ls'},
  {tr:1,c:'CRDTs are the alternative. They merge edits in any order without a central server, which suits offline editing. Libraries like Yjs and Automerge use them.',f:'as+bs as<+bs<'}]);

/* ---- IV.13 key value store ---- */
VDEF('kv','Key value store',
 [['client',14,152,86,50,'Client','','client'],['co',140,150,130,56,'Coordinator','any node'],['r1',340,40,130,48,'Replica 1','v1','store'],['r2',340,154,130,48,'Replica 2','v1','store'],
  ['r3',340,268,130,48,'Replica 3','v1','store'],['hn',510,154,116,48,'Node D','holds hints','store']],
 [['cc','client.r','co.l'],['c1','co.r','r1.l','',{ao:-14,route:'hvh',via:310}],['c2','co.r','r2.l'],['c3','co.r','r3.l','',{ao:14,route:'hvh',via:310}],
  ['ch','co.b','hn.b','hinted write',{route:'vhv',via:340,cls:'dash'}],['h3',null,null,'hand back',{pts:[[530,202],[530,292],[470,292]],lp:[536,250],la:'start'}]],
 [{c:'A key value store spreads keys over hundreds of nodes with consistent hashing. Any node can coordinate a request.',add:'client co cc',f:'cc cc'},
  {c:'Each key lives on three replicas, so N is three. A write is sent to all of them at once.',add:'r1 r2 r3 c1 c2 c3',f:'cc c1+c2+c3'},
  {c:'The coordinator waits for W acknowledgements, here two, then answers the client. The third replica may lag behind.',set:{r1:'Replica 1|v2',r2:'Replica 2|v2'},hi:'r1 r2',f:'c1<+c2< cc<'},
  {tr:1,c:'A read asks R replicas, here two. Because R plus W is greater than N, at least one of them already has the newest version.',hi:'r2 r3',f:'c2+c3 c2<+c3<'},
  {c:'If a replica is down, the write goes to another node along with a hint, so writes keep succeeding.',set:{r3:'Replica 3|down'},add:'hn ch',hi:'r3',f:'cc ch'},
  {c:'When the replica recovers, the hint is handed back. Gossip spreads who is alive, and Merkle trees repair whatever still differs.',add:'h3',set:{r3:'Replica 3|v2'},f:'h3 h3'}]);

/* ---- IV.14 payments ---- */
VDEF('pay','Payment system',
 [['shop',14,152,92,50,'Checkout','','client'],['ps',140,150,130,56,'Payment service'],['pdb',140,278,130,54,'Payment DB','order + key','store'],['psp',330,40,120,50,'PSP','Stripe, Adyen','ext'],
  ['recon',500,40,126,50,'Reconcile','nightly'],['wallet',330,278,120,54,'Wallet','','store'],['ledger',500,278,126,54,'Ledger','double entry','store']],
 [['sp','shop.r','ps.l'],['pd','ps.b','pdb.t','record',{lp:[211,250],la:'start'}],['pp','ps.r','psp.l','charge',{ao:-12,route:'hvh',via:300,lp:[306,112],la:'start'}],
  ['wh','psp.b','ps.r','webhook',{bo:6,route:'vh',cls:'dash',lp:[396,150],la:'start'}],['pw','ps.r','wallet.t','credit seller',{ao:18,bo:-30,route:'hv',lp:[366,244],la:'start'}],
  ['wl','wallet.r','ledger.l','same transaction',{lp:[475,268]}],['pr','psp.r','recon.l','settlement file',{cls:'dash',lp:[475,30]}],['rl','recon.b','ledger.t','compare',{cls:'dash',lp:[569,184],la:'start'}]],
 [{c:'Checkout sends a payment with an idempotency key, usually the order ID. The payment service records it before calling anyone.',add:'shop ps pdb sp pd',f:'sp pd'},
  {c:'Then it asks the payment provider to charge the card. Card numbers never touch our own servers.',add:'psp pp',f:'pp pp'},
  {c:'The response is lost and the request times out. Did the charge happen? From here, we cannot tell.',set:{ps:'Payment service|timed out'},hi:'ps',f:'pp sp<'},
  {tr:1,c:'The client retries with the same key. The service finds that key, returns the stored result, and the buyer is charged exactly once.',set:{ps:'Payment service|',pdb:'Payment DB|key found'},hi:'pdb',f:'sp pd pd< sp<'},
  {c:'When the provider confirms by webhook, the seller’s wallet and a double entry ledger are updated in the same transaction.',add:'wh wallet ledger pw wl',f:'wh pw wl'},
  {c:'Every night, reconciliation matches the provider’s settlement file against the ledger, line by line, and flags every difference.',add:'recon pr rl',f:'pr rl'}]);

/* ---- player engine ---- */
var IC={
  play:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
  replay:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5V1.5L7 6l5 4.5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor"/></svg>',
  fs:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
var PLAYERS=[],STEP=0.95;
function vwords(s){return s.split(/\s+/).length;}
function fmtT(s){s=Math.max(0,Math.round(s));var m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r;}
function vids(s){return s?String(s).split(/\s+/).filter(Boolean):[];}
function vflow(s){return vids(s).map(function(step){return step.split('+').map(function(t){var rev=t.slice(-1)==='<';return {id:rev?t.slice(0,-1):t,rev:rev};});});}
function clamp01(x){return x<0?0:x>1?1:x;}

function makePlayer(el,key){
  var spec=VID[key];if(!spec)return;
  var title=spec.title,sc=spec.scenes,n=sc.length;
  var durs=sc.map(function(s){return s.d||Math.max(5,Math.min(14,vwords(s.c)/2.4+1.8));});
  var starts=[],acc=0;durs.forEach(function(d){starts.push(acc);acc+=d;});var total=acc;
  var vis=[],added=[],sets=[],clss=[],flows=[],cur=new Set(),cs={},cc={};
  sc.forEach(function(s){
    vids(s.rm).forEach(function(x){cur.delete(x);});var ad=vids(s.add);ad.forEach(function(x){cur.add(x);});
    vis.push(new Set(cur));added.push(new Set(ad));
    if(s.set)for(var k in s.set)cs[k]=s.set[k];sets.push(Object.assign({},cs));
    if(s.cls)for(var k2 in s.cls)cc[k2]=s.cls[k2];clss.push(Object.assign({},cc));
    flows.push(vflow(s.f));
  });
  var ext=EXT[key];
  el.classList.add('is-idle');el.tabIndex=0;el.setAttribute('role','group');el.setAttribute('aria-label','Short video: '+title);
  el.innerHTML='<div class="vp-screen"><svg class="dg vstage" role="img" aria-label="'+esc('Animated diagram: '+title)+'"></svg>'+
    '<span class="vp-chip"><i></i>Video · '+fmtT(total)+'</span><span class="vp-tag" hidden>Tradeoff</span>'+
    '<button class="vp-big" type="button" aria-label="'+esc('Play video: '+title)+'">'+IC.play+'</button></div>'+
    '<p class="vp-cap" aria-live="polite"></p>'+
    '<div class="vp-bar"><button class="vp-b vp-play" type="button" aria-label="Play">'+IC.play+'</button>'+
    '<div class="vp-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="'+Math.round(total)+'" aria-valuenow="0">'+
      durs.map(function(d,i){return '<span class="vp-seg" style="flex-grow:'+d.toFixed(2)+'" title="Part '+(i+1)+'"><i></i></span>';}).join('')+'</div>'+
    '<span class="vp-time">0:00 / '+fmtT(total)+'</span>'+
    '<button class="vp-b vp-speed" type="button" aria-label="Playback speed, 1×">1×</button>'+
    (document.fullscreenEnabled?'<button class="vp-b vp-fs" type="button" aria-label="Fullscreen">'+IC.fs+'</button>':'')+
    '</div>'+
    '';
  var svg=el.querySelector('svg.vstage'),cap=el.querySelector('.vp-cap'),big=el.querySelector('.vp-big'),pbtn=el.querySelector('.vp-play'),
      track=el.querySelector('.vp-track'),segs=$$('.vp-seg',el),timeEl=el.querySelector('.vp-time'),tag=el.querySelector('.vp-tag'),
      sbtn=el.querySelector('.vp-speed'),fbtn=el.querySelector('.vp-fs');
  var d=buildDiagram(svg,{w:640,h:360,nodes:spec.nodes,edges:spec.edges});
  var nodeSpec={},edgeBase={},edgeLabel={};
  spec.nodes.forEach(function(nd){nodeSpec[nd.id]=nd;});
  spec.edges.forEach(function(e){edgeBase[e.id]=e.cls||'';edgeLabel[e.id]=e.label||'';});
  var gP=S('g',{'class':'pk'},svg),gC=S('g',{'class':'vcard'},svg),dots=[],lens={};
  for(var k=0;k<6;k++)dots.push(S('circle',{r:5,cx:-20,cy:-20},gP));
  var curScene=0,cardEls=null,t=0,playing=false,state='idle',speed=1,raf=0,last=0;

  function setNodeText(id,val){
    var g=d.nodes[id],nd=nodeSpec[id];if(!g||!nd)return;
    var tt=nd.t,ss=nd.s;
    if(val!=null){if(val.indexOf('|')>=0){var p=val.split('|');tt=p[0];ss=p[1];}else ss=val;}
    var sig=tt+'|'+ss;if(g.getAttribute('data-txt')===sig)return;g.setAttribute('data-txt',sig);
    $$('text',g).forEach(function(x){g.removeChild(x);});
    var cx=nd.x+nd.w/2,cy=nd.y+nd.h/2;if(nd.kind==='store')cy+=4;else if(nd.kind==='queue')cx=nd.x+(nd.w-27)/2;
    if(ss){T('text',{'class':'t',x:cx,y:cy-3,'text-anchor':'middle'},g,tt);T('text',{'class':'s',x:cx,y:cy+12,'text-anchor':'middle'},g,ss);}
    else T('text',{'class':'t',x:cx,y:cy+4.5,'text-anchor':'middle'},g,tt);
  }
  function applyScene(i,poster){
    curScene=i;var s=sc[i],V=vis[i],A=added[i],H=new Set(poster?[]:vids(s.hi)),SET=sets[i],CL=clss[i],dim=!poster&&s.dim&&H.size;
    if(RM&&!poster)flows[i].forEach(function(st){st.forEach(function(f){H.add(f.id);});});
    Object.keys(d.nodes).forEach(function(id){
      var nd=nodeSpec[id],on=V.has(id),c='node '+(nd.kind||'svc');
      if(!on)c+=' off';else if(H.has(id))c+=' hot';else if(!poster&&i>0&&A.has(id))c+=' new';else if(dim)c+=' dim';
      d.nodes[id].setAttribute('class',c);setNodeText(id,SET[id]);
    });
    Object.keys(d.edges).forEach(function(id){
      var g=d.edges[id],on=V.has(id),base=(id in CL)?CL[id]:edgeBase[id],c='edge'+(base?' '+base:'');
      if(!on)c+=' off';else if(H.has(id))c+=' hot';else if(!poster&&i>0&&A.has(id))c+=' blue';else if(dim)c+=' dim';
      g.setAttribute('class',c);
      var tx=g.querySelector('text');if(tx){var lv=(id in SET)?SET[id]:edgeLabel[id];if(tx.textContent!==lv)tx.textContent=lv;}
    });
    buildCard(i);var tr=!poster&&s.tr;tag.hidden=!tr;cap.classList.toggle('is-tr',!!tr);
    cap.innerHTML=(tr?'<b class="tr">Tradeoff.</b> ':'')+esc(s.c);
    segs.forEach(function(sg,j){sg.classList.toggle('cur',j===i);});
  }
  function plen(id){if(lens[id]==null){var p=d.edges[id]&&d.edges[id].querySelector('path');try{lens[id]=p?p.getTotalLength():0;}catch(e){lens[id]=0;}}return lens[id];}
  function drawPackets(i,local,show){
    var used=0,fl=flows[i];
    if(show&&!RM&&fl.length&&!sc[i].card){
      var period=fl.length*STEP+0.7,ph=local-0.3;
      if(ph>=0){ph=ph%period;var kk=Math.floor(ph/STEP);
        if(kk<fl.length){var fr=clamp01((ph-kk*STEP)/STEP),e=fr<0.5?2*fr*fr:1-Math.pow(-2*fr+2,2)/2;
          fl[kk].forEach(function(f){var g=d.edges[f.id];if(!g||used>=dots.length)return;var L=plen(f.id);if(!L)return;
            var pt=g.querySelector('path').getPointAtLength((f.rev?1-e:e)*L),c=dots[used++];
            c.setAttribute('cx',pt.x.toFixed(1));c.setAttribute('cy',pt.y.toFixed(1));c.setAttribute('class',sc[i].fc==='blue'?'b':'');});}}
    }
    for(var j=used;j<dots.length;j++){dots[j].setAttribute('cx',-20);dots[j].setAttribute('cy',-20);}
  }
  function buildCard(i){
    while(gC.firstChild)gC.removeChild(gC.firstChild);cardEls=null;
    var cd=sc[i].card;if(!cd)return;
    S('rect',{'class':'card-bg',x:0,y:0,width:640,height:360},gC);
    if(cd.h)T('text',{'class':'card-h',x:36,y:56},gC,cd.h);
    cardEls={lines:[]};
    (cd.lines||[]).forEach(function(l,j){var em=l.charAt(0)==='!';cardEls.lines.push(T('text',{'class':'card-l'+(em?' em':''),x:36,y:110+j*40},gC,em?l.slice(1):l));});
    if(cd.grid)drawGrid(cd.grid);
  }
  function drawGrid(cfg){
    var g=ghEncode(cfg.lat,cfg.lng,cfg.p),dLat=g.la[1]-g.la[0],dLng=g.lo[1]-g.lo[0],clat=(g.la[0]+g.la[1])/2,clng=(g.lo[0]+g.lo[1])/2;
    var CW=120,CH=80,X0=320-1.5*CW,Y0=82;
    for(var r=0;r<3;r++)for(var c=0;c<3;c++){var ctr=r===1&&c===1,on=ctr||cfg.all,h=ghEncode(clat+(1-r)*dLat,clng+(c-1)*dLng,cfg.p).hash;
      S('rect',{x:X0+c*CW+2,y:Y0+r*CH+2,width:CW-4,height:CH-4,rx:4,fill:on?'var(--blue-wash)':'var(--sheet)',stroke:on?'var(--blue)':'var(--rule)','stroke-width':ctr?2.4:1.2},gC);
      T('text',{x:X0+c*CW+CW/2,y:Y0+r*CH+CH-14,'text-anchor':'middle','class':'card-v',style:'font-weight:'+(ctr?700:500)+';fill:'+(on?'var(--blue)':'var(--ink-2)')},gC,h);}
    var hKm=dLat*111.32,wKm=dLng*111.32*Math.cos(clat*Math.PI/180);
    var px=X0+CW+(cfg.lng-g.lo[0])/dLng*CW,py=Y0+CH+(g.la[1]-cfg.lat)/dLat*CH;
    if(cfg.all)S('ellipse',{cx:px,cy:py,rx:0.5/wKm*CW,ry:0.5/hKm*CH,fill:'var(--red)','fill-opacity':0.1,stroke:'var(--red)','stroke-width':1.5,'stroke-dasharray':'4 3'},gC);
    S('circle',{cx:px,cy:py,r:5,fill:'var(--red)',stroke:'var(--paper)','stroke-width':2},gC);
    T('text',{'class':'card-n',x:320,y:342,'text-anchor':'middle'},gC,'Precision '+cfg.p+': each cell ≈ '+trim(wKm)+' × '+trim(hKm)+' km'+(cfg.all?'; dashed circle = 0.5 km radius':''));
  }
  function drawCard(i,local,dur){
    if(!cardEls)return;var cd=sc[i].card,nl=cardEls.lines.length,gap=cd.all?0:Math.max(0.5,Math.min(1.7,(dur-2)/Math.max(1,nl)));
    cardEls.lines.forEach(function(tx,j){tx.style.opacity=cd.all?1:clamp01((local-0.3-j*gap)/0.35);});
  }
  function sceneAt(tt){for(var q=n-1;q>=0;q--)if(tt>=starts[q]-1e-6)return q;return 0;}
  function progress(){
    segs.forEach(function(sg,j){var f=t<=starts[j]?0:t>=starts[j]+durs[j]?1:(t-starts[j])/durs[j];sg.firstChild.style.width=(f*100).toFixed(1)+'%';});
    timeEl.textContent=fmtT(t)+' / '+fmtT(total);
    track.setAttribute('aria-valuenow',Math.round(t));track.setAttribute('aria-valuetext',fmtT(t)+' of '+fmtT(total)+', part '+(curScene+1)+' of '+n);
  }
  function render(){var local=t-starts[curScene];drawPackets(curScene,local,true);drawCard(curScene,local,durs[curScene]);progress();}
  function enter(i){applyScene(i);}
  function setState(s){state=s;['idle','playing','paused','ended'].forEach(function(x){el.classList.toggle('is-'+x,x===s);});
    var ic=s==='playing'?IC.pause:s==='ended'?IC.replay:IC.play,lb=s==='playing'?'Pause':s==='ended'?'Replay':'Play';
    pbtn.innerHTML=ic;pbtn.setAttribute('aria-label',lb);big.innerHTML=s==='ended'?IC.replay:IC.play;big.setAttribute('aria-label',lb+' video: '+title);}
  function frame(now){
    if(!playing)return;
    t+=Math.min(0.1,(now-last)/1000)*speed;last=now;
    var nx=curScene+1;
    if(nx<n&&t>=starts[nx])enter(nx);
    if(t>=total){finish();return;}
    render();raf=requestAnimationFrame(frame);
  }
  function play(){
    PLAYERS.forEach(function(p){if(p.el!==el)p.pause();});
    if(state==='ended'||state==='idle')t=0;
    playing=true;setState('playing');last=performance.now();
    enter(sceneAt(t));render();
    raf=requestAnimationFrame(frame);
  }
  function pause(){if(!playing)return;playing=false;cancelAnimationFrame(raf);setState('paused');}
  function poster(){applyScene(n-1,true);drawPackets(n-1,0,false);drawCard(n-1,999,durs[n-1]);}
  function finish(){playing=false;t=total;setState('ended');poster();progress();
    cap.textContent='End of video. Press play to watch again, or click the bar to jump to any part.';}
  function seek(tt){
    t=Math.max(0,Math.min(total-0.05,tt));var i=sceneAt(t);
    if(playing){enter(i);render();}
    else{if(state!=='paused')setState('paused');applyScene(i);render();}
  }
  big.addEventListener('click',function(){playing?pause():play();});
  pbtn.addEventListener('click',function(){playing?pause():play();});
  sbtn.addEventListener('click',function(){speed=speed===1?1.5:speed===1.5?0.75:1;sbtn.textContent=speed+'×';sbtn.setAttribute('aria-label','Playback speed, '+speed+'×');});
  if(fbtn)fbtn.addEventListener('click',function(){try{if(document.fullscreenElement===el){document.exitFullscreen();}else{var pr=el.requestFullscreen();if(pr&&pr.catch)pr.catch(function(){});}}catch(e){}});
  var dragging=false;
  function seekAt(ev){var r=track.getBoundingClientRect();if(r.width>0)seek(clamp01((ev.clientX-r.left)/r.width)*total);}
  track.addEventListener('pointerdown',function(ev){dragging=true;try{track.setPointerCapture(ev.pointerId);}catch(e){}seekAt(ev);});
  track.addEventListener('pointermove',function(ev){if(dragging)seekAt(ev);});
  track.addEventListener('pointerup',function(){dragging=false;});
  track.addEventListener('pointercancel',function(){dragging=false;});
  el.addEventListener('keydown',function(ev){
    var tg=ev.target.tagName;if(tg==='A'||tg==='INPUT')return;
    if((ev.key===' '||ev.key==='k')&&tg!=='BUTTON'){ev.preventDefault();playing?pause():play();}
    else if(ev.key==='ArrowRight'){ev.preventDefault();seek(starts[Math.min(n-1,curScene+1)]);}
    else if(ev.key==='ArrowLeft'){ev.preventDefault();var into=t-starts[curScene];seek(starts[into>1.5||curScene===0?curScene:curScene-1]);}
  });
  setState('idle');poster();progress();
  cap.textContent='Press play for a '+fmtT(total)+' animated walkthrough of the system at work. Captions explain each step, tradeoffs are marked, and you can click any part of the bar to jump.';
  PLAYERS.push({el:el,pause:pause});
}
mod('videos',function(){
  $$('.vplayer[data-v]').forEach(function(el){mod('video '+el.getAttribute('data-v'),function(){makePlayer(el,el.getAttribute('data-v'));});});
  document.addEventListener('visibilitychange',function(){if(document.hidden)PLAYERS.forEach(function(p){p.pause();});});
});

/* ---------- extra static figures ---------- */
mod('frontier',function(){
  var el=document.getElementById('frontier-svg');if(!el)return;
  buildDiagram(el,{w:900,h:250,
   annos:[{x:365,y:18,t:'Front queues: what matters',anchor:'middle',bold:1},{x:670,y:18,t:'Back queues: one per host',anchor:'middle',bold:1}],
   nodes:[{id:'in',x:10,y:100,w:120,h:50,t:'New URLs',s:'from the parser'},{id:'pr',x:160,y:100,w:120,h:50,t:'Prioritizer',s:'rank, freshness'},
    {id:'f1',x:310,y:32,w:110,h:40,t:'High',kind:'queue'},{id:'f2',x:310,y:105,w:110,h:40,t:'Medium',kind:'queue'},{id:'f3',x:310,y:178,w:110,h:40,t:'Low',kind:'queue'},
    {id:'rt',x:450,y:100,w:120,h:50,t:'Host router',s:'host → queue'},
    {id:'b1',x:600,y:32,w:140,h:40,t:'a.com',kind:'queue'},{id:'b2',x:600,y:105,w:140,h:40,t:'b.org',kind:'queue'},{id:'b3',x:600,y:178,w:140,h:40,t:'c.net',kind:'queue'},
    {id:'fe',x:770,y:100,w:120,h:50,t:'Fetchers',s:'next allowed time'}],
   edges:[{a:'in.r',b:'pr.l'},
    {a:'pr.r',b:'f1.l',route:'hvh',via:295},{a:'pr.r',b:'f2.l'},{a:'pr.r',b:'f3.l',route:'hvh',via:295},
    {a:'f1.r',b:'rt.l',route:'hvh',via:435},{a:'f2.r',b:'rt.l'},{a:'f3.r',b:'rt.l',route:'hvh',via:435},
    {a:'rt.r',b:'b1.l',route:'hvh',via:585},{a:'rt.r',b:'b2.l'},{a:'rt.r',b:'b3.l',route:'hvh',via:585},
    {a:'b1.r',b:'fe.l',route:'hvh',via:755},{a:'b2.r',b:'fe.l'},{a:'b3.r',b:'fe.l',route:'hvh',via:755}]});
});
mod('vdag',function(){
  var el=document.getElementById('vdag-svg');if(!el)return;
  buildDiagram(el,{w:840,h:240,nodes:[
    {id:'o',x:10,y:94,w:120,h:52,t:'Original',s:'object store',kind:'store'},{id:'sp',x:165,y:95,w:120,h:50,t:'Split',s:'into segments'},
    {id:'e1',x:330,y:12,w:140,h:40,t:'Encode 240p'},{id:'e2',x:330,y:70,w:140,h:40,t:'Encode 720p'},{id:'e3',x:330,y:128,w:140,h:40,t:'Encode 1080p'},{id:'e4',x:330,y:186,w:140,h:40,t:'Encode 4K'},
    {id:'pk',x:515,y:95,w:130,h:50,t:'Package',s:'HLS + DASH'},{id:'cdn',x:690,y:95,w:130,h:50,t:'CDN origin',s:'publish',kind:'ext'}],
   edges:[{a:'o.r',b:'sp.l'},
    {a:'sp.r',b:'e1.l',route:'hvh',via:308},{a:'sp.r',b:'e2.l',route:'hvh',via:308},{a:'sp.r',b:'e3.l',route:'hvh',via:308},{a:'sp.r',b:'e4.l',route:'hvh',via:308},
    {a:'e1.r',b:'pk.l',route:'hvh',via:493},{a:'e2.r',b:'pk.l',route:'hvh',via:493},{a:'e3.r',b:'pk.l',route:'hvh',via:493},{a:'e4.r',b:'pk.l',route:'hvh',via:493},
    {a:'pk.r',b:'cdn.l'}]});
});

/* ---------- use case map filter ---------- */
mod('usecases',function(){
  var rows=$$('#usecases tbody tr');
  segInit('uc-filter',function(v){rows.forEach(function(r){r.hidden=!(v==='all'||r.getAttribute('data-l')===v);});});
});

/* ---------- most asked questions ---------- */
mod('faq',function(){
  var F=[
  ['Fundamentals',1,'What is the difference between horizontal and vertical scaling?','Vertical scaling means a bigger machine: more CPU, memory or disk. It needs no code changes, but it has a hard ceiling and leaves a single point of failure.\nHorizontal scaling means more machines behind a load balancer. It grows almost without limit and survives failures, but it needs stateless services and partitioned data. Start vertical, and go horizontal when you need failover or hit the ceiling.'],
  ['Fundamentals',0,'Latency or throughput: what is the difference?','Latency is how long one request takes; throughput is how many requests the system completes per second. They pull against each other: batching raises throughput but adds latency.\nQuote percentiles such as p50 and p99 rather than averages. A page that makes 50 backend calls hits at least one slow 1% call on about four page loads in ten.'],
  ['Fundamentals',1,'What does 99.99% availability actually allow?','Each extra nine cuts the downtime budget by ten: 99.9% allows about 8.8 hours a year (43 minutes a month), 99.99% about 53 minutes a year (4.3 minutes a month), and 99.999% about 5 minutes a year.\nDependencies in series multiply, so two 99.9% services in a chain give about 99.8%. Redundant copies in parallel raise availability.'],
  ['Fundamentals',0,'Monolith or microservices?','A monolith is one deployable unit: simple calls, easy transactions, ideal for small teams. Microservices let teams deploy and scale independently and isolate failures, but every call becomes a network call, data is spread across services, and you need serious observability.\nSplit along business boundaries when team size or very different scaling needs make the monolith hurt.'],
  ['Fundamentals',0,'What makes a service stateless, and why does it matter?','A stateless service keeps nothing about a client between requests, so any instance can serve any request and you can add or remove instances freely. State lives in dedicated stores such as databases and caches.\nStateful components, like WebSocket servers or databases, need sticky routing, replication and careful failover.'],
  ['Fundamentals',0,'Reverse proxy, load balancer, API gateway: what is the difference?','A reverse proxy sits in front of servers and handles TLS, compression and caching. A load balancer is a reverse proxy whose job is spreading traffic over healthy instances. An API gateway adds API concerns: authentication, rate limiting, routing to many services and versioning.\nOne product, such as NGINX or Envoy, can play all three roles.'],
  ['Databases',1,'SQL or NoSQL: how do you choose?','Relational databases give schemas, joins, ACID transactions and flexible queries, and scale out with some effort through replicas and sharding. NoSQL stores (key value, document, wide column, graph) trade some of that for built-in partitioning and huge scale on known access patterns.\nChoose from your access patterns and consistency needs: money and rich relationships lean SQL, massive simple lookups lean NoSQL.'],
  ['Databases',1,'What is sharding, and how do you pick a shard key?','Sharding splits rows across independent databases by a key. A good key has many distinct values, spreads load evenly, and keeps most queries on one shard, such as user_id in a user centric app.\nBad keys concentrate load: a timestamp sends every new write to the newest shard, and country makes a few shards huge. Resharding is painful, so start with many logical shards mapped onto fewer machines, or use consistent hashing.'],
  ['Databases',1,'Replication: leader-follower, multi-leader or leaderless?','Leader-follower sends all writes to one leader and reads to followers; it is simple, but followers lag and failover must be handled. Multi-leader accepts writes in several regions and must resolve conflicts. Leaderless systems such as Cassandra write to and read from quorums of replicas; they stay available but need conflict handling.\nSynchronous replication protects data at the cost of latency; asynchronous is fast but can lose the latest writes on failover.'],
  ['Databases',0,'What do ACID and BASE mean?','ACID transactions are atomic (all or nothing), consistent (rules hold), isolated (they behave as if run one at a time) and durable (they survive crashes).\nBASE, short for basically available, soft state, eventually consistent, describes stores that favor availability and let replicas converge over time. Many modern databases let you choose per request.'],
  ['Databases',1,'How do indexes work, and when do they hurt?','A B-tree index keeps keys sorted, so a lookup or range scan takes logarithmic time instead of a full table scan.\nEvery index slows writes, because it must be updated too, and costs storage. Index the columns you filter, join and sort on; in a composite index, column order matters because only a leftmost prefix can be used.'],
  ['Databases',0,'B-tree or LSM tree storage?','B-trees, used by PostgreSQL and MySQL, update pages in place: fast reads, more random writes. LSM trees, used by Cassandra and RocksDB, append writes to a memory table and flush sorted files that are later compacted: very fast writes, while reads may check several files, helped by Bloom filters.\nWrite heavy workloads favor LSM.'],
  ['Databases',0,'When should you denormalize?','Normalize to keep one copy of each fact and avoid update anomalies. Denormalize, copying data into tables shaped for reads, when joins become too slow at scale, as with a feed or a dashboard.\nThe copies must then be kept in sync, usually by events or background jobs, and you accept brief inconsistency.'],
  ['Databases',1,'How do you stop two users booking the same seat, or spending the same money twice?','Let the database arbitrate. Use a conditional update such as `UPDATE … WHERE status = \'FREE\'` and check the rows affected, optimistic locking with a version column, or `SELECT … FOR UPDATE`.\nBack it with a unique constraint as the final guard. A distributed lock alone is not enough unless writes carry a fencing token.'],
  ['Databases',0,'What are transaction isolation levels?','Read committed hides uncommitted data; repeatable read or snapshot isolation gives each transaction a stable view; serializable makes transactions behave as if run one at a time.\nWeaker levels allow anomalies such as lost updates and write skew; stronger ones cost throughput. PostgreSQL defaults to read committed, MySQL InnoDB to repeatable read.'],
  ['Databases',0,'How would you build a real time leaderboard?','Keep scores in a Redis sorted set: `ZINCRBY` updates a score and `ZREVRANGE` returns the top players in logarithmic time. Shard by game or region when one set gets too big, and persist scores in a database for durability.\nFor top K over an endless stream, such as trending hashtags, use a count-min sketch with a small heap to approximate counts in bounded memory.'],
  ['Caching',0,'Where can you cache?','At every layer: the browser or app, a CDN at the edge, the API gateway, an application cache such as Redis or Memcached, and the database’s own buffer pool.\nCache as close to the user as freshness allows, and always know how each layer is invalidated.'],
  ['Caching',1,'How do you keep a cache consistent with the database?','Set TTLs as a safety net. On writes, update the database and then delete the cache key (cache-aside), or use write-through when reads must see writes immediately.\nAcross services or regions, publish change events, often captured from the database log, to invalidate copies. Then state the staleness you accept, such as up to 30 seconds.'],
  ['Caching',0,'Redis or Memcached?','Memcached is a simple, multithreaded cache of strings. Redis adds data structures (lists, sets, sorted sets, streams, geo indexes), persistence, replication, Lua scripts and pub/sub, so it doubles as a leaderboard, rate limiter or lightweight queue.\nDefault to Redis unless you only need a plain cache.'],
  ['Caching',1,'How does a CDN work? Push or pull?','Edge servers around the world cache content, and DNS or anycast sends each user to a nearby one.\nA pull CDN fetches from your origin on the first miss and caches it per TTL, which is easy to run. A push CDN has you upload content ahead of time, which suits large files that rarely change. Put a version in file names so you never need to purge.'],
  ['Caching',0,'What is a cache stampede, and how do you prevent it?','A hot key expires, thousands of requests miss at once, and they all hammer the database.\nPrevent it by letting a single request rebuild the value while others wait (request coalescing), serving the stale value while refreshing in the background, refreshing popular keys slightly early, and adding random jitter to TTLs.'],
  ['Messaging',1,'Queue, pub/sub or log: what is the difference?','In a queue, each message goes to exactly one consumer, which suits distributing jobs. In pub/sub, every subscriber gets every message, which suits fan-out.\nA log such as Kafka keeps messages durably in ordered partitions; consumers track their own offsets and can replay, and consumer groups give you either pattern.'],
  ['Messaging',0,'Why is Kafka so fast?','It only appends to disk sequentially, leans on the operating system’s page cache, sends data from disk to network without copying it through the application, batches and compresses messages, and spreads load over partitions.\nOrdering is guaranteed only within a partition.'],
  ['Messaging',1,'How do you get exactly-once processing?','Networks force at-least-once delivery, so make the effect idempotent: record each processed message ID in the same transaction as the side effect and skip IDs you have already seen.\nInside Kafka, transactions can make read, process and write atomic. In practice, exactly once means at-least-once delivery plus idempotent processing.'],
  ['Messaging',0,'What is backpressure?','A way for a slow consumer to slow down producers instead of being overwhelmed: bounded queues, rejecting work with 429 or 503, or letting consumers pull at their own pace.\nWithout it, buffers grow until something runs out of memory.'],
  ['Messaging',0,'What is the outbox pattern?','Write the business change and the event describing it in the same database transaction, using an outbox table. A relay, or change data capture from the database log, publishes the event afterwards.\nIt removes the classic bug where the database commit succeeds but publishing the event fails.'],
  ['Distributed systems',1,'Explain the CAP theorem.','When a network partition splits a replicated system, each side must either refuse requests it cannot answer correctly (consistency) or answer with possibly stale data (availability).\nPartitions are unavoidable, so the real choice is which to give up during one. PACELC adds that even without partitions you trade latency against consistency.'],
  ['Distributed systems',1,'What is consistent hashing, and why use it?','Keys and nodes are hashed onto the same ring, and each key belongs to the next node clockwise. Adding or removing a node moves only about 1/N of the keys, where hash mod N would move almost all of them.\nVirtual nodes even out the load. Dynamo, Cassandra and most sharded caches use it.'],
  ['Distributed systems',0,'How do leader election and consensus work?','Protocols such as Raft and Paxos have nodes vote; a candidate with a majority becomes leader for a term, and an entry counts as committed once a majority has stored it.\nA cluster of 2f + 1 nodes tolerates f failures, so 3 nodes survive one failure and 5 survive two. Use etcd or ZooKeeper rather than building it yourself.'],
  ['Distributed systems',1,'Two-phase commit or saga?','Two-phase commit has a coordinator ask every participant to prepare, then commit. It is atomic, but participants block if the coordinator fails, and it couples services tightly.\nA saga is a chain of local transactions, each with a compensating action, such as a refund that undoes a charge. It stays available and loosely coupled, but other services can see the intermediate states.'],
  ['Distributed systems',1,'What is idempotency, and how do you implement it?','An operation is idempotent when doing it twice has the same effect as doing it once.\nImplement it with client generated idempotency keys stored with the result under a unique constraint, by preferring absolute updates (set the balance to 50) over relative ones (add 10), and with deduplication tables in consumers.'],
  ['Distributed systems',0,'Why not order events by wall clock time?','Clocks on different machines drift and jump when NTP corrects them, so timestamps can disagree about what happened first.\nUse a single sequencer, logical clocks (Lamport or vector clocks), or clocks with bounded uncertainty such as Spanner’s TrueTime.'],
  ['Distributed systems',0,'What is split brain?','After a partition, two nodes both believe they are the leader and accept conflicting writes.\nPrevent it with majority quorums, leader leases that expire, and fencing tokens: increasing numbers attached to writes, so storage rejects anything from a deposed leader.'],
  ['Distributed systems',0,'How do you generate unique IDs at scale?','Auto increment is simple but needs one authority. Random UUIDs need no coordination but are 128 bits, unsortable and scatter index writes.\nTime ordered IDs such as UUIDv7, ULID or Snowflake (timestamp, machine and sequence in 64 bits) sort by creation time with no coordination; prefer them for time ordered data.'],
  ['Reliability',1,'What is a circuit breaker?','A wrapper around calls to a dependency. After too many failures it opens and fails fast for a cooldown period, then lets a few trial calls through, and closes again if they succeed.\nIt stops one failing service from tying up every caller’s threads. Pair it with timeouts, limited retries and a fallback.'],
  ['Reliability',1,'How should clients retry?','Retry only errors that may succeed later (timeouts, 503, 429), and only operations that are idempotent or carry an idempotency key.\nUse exponential backoff with random jitter, cap the number of attempts, and keep a retry budget for the whole service. Unlimited retries turn a small outage into a big one.'],
  ['Reliability',0,'SLI, SLO and SLA: what is the difference?','An SLI is a measurement, such as the share of requests served under 300 ms. An SLO is your internal target for it, such as 99.9% over 30 days. An SLA is a contract with customers, with penalties, and is usually looser than the SLO.\nThe error budget, one minus the SLO, is what you may spend on releases and incidents.'],
  ['Reliability',0,'How do you deploy with zero downtime?','Roll out gradually: rolling deploys with health checks and connection draining, blue-green deployments that switch traffic between two full environments, or canaries that take a few percent of traffic first while you watch the metrics.\nDatabase changes must be backward compatible: expand the schema, migrate, then remove the old parts.'],
  ['Reliability',0,'What are RPO and RTO?','The recovery point objective is how much data you can afford to lose, such as five minutes, which sets how often you replicate or back up. The recovery time objective is how long you can be down.\nPushing both toward zero needs multi-region active-active setups and costs much more.'],
  ['Reliability',0,'What are the three pillars of observability?','Metrics are cheap aggregated numbers for dashboards and alerts. Logs are detailed records of individual events. Traces follow one request across services with timings for each hop.\nTie them together with a trace ID passed along with every call.'],
  ['Reliability',0,'How would you design metrics and monitoring?','Agents on each host push metrics, or a collector pulls them as Prometheus does, into a time series database built for heavy appends. Keep recent data at full resolution and downsample older data.\nAlert on symptoms users feel, such as error rate and latency against SLOs, rather than on every CPU spike.'],
  ['APIs and networking',1,'What happens when you type a URL and press Enter?','The browser checks its cache, then resolves the name through DNS: browser, operating system, resolver, then root, top level and authoritative servers. It opens a TCP connection, or QUIC for HTTP/3, negotiates TLS, and sends the HTTP request, which passes load balancers on its way to a server.\nThe HTML response is parsed, further assets are fetched, often from a CDN, and the page is rendered.'],
  ['APIs and networking',0,'REST, gRPC or GraphQL?','REST exposes resources over HTTP, usually with JSON; it is universal and cacheable, ideal for public APIs. gRPC sends compact Protobuf messages over HTTP/2 with typed contracts and streaming, ideal between internal services.\nGraphQL lets clients ask for exactly the fields they need in one round trip, which suits many different clients, but makes caching and rate limiting harder.'],
  ['APIs and networking',1,'Long polling, server-sent events or WebSockets?','Long polling holds a normal request open until data arrives: simple, and it works everywhere. Server-sent events stream one way from server to client over HTTP and reconnect automatically, good for feeds and notifications.\nWebSockets are full duplex with little overhead per message, needed for chat, games and collaborative editing.'],
  ['APIs and networking',0,'TCP or UDP?','TCP gives a reliable, ordered byte stream with congestion control, at the cost of a handshake and head-of-line blocking. UDP sends independent packets with no guarantees and minimal delay, which suits video calls, games and DNS.\nQUIC builds reliability on top of UDP to avoid TCP’s limits.'],
  ['APIs and networking',1,'Offset or cursor pagination?','`OFFSET n` makes the database read and discard n rows, so deep pages get slow, and new rows shift every page so items repeat or vanish.\nCursor pagination remembers the last key seen, as in `WHERE id < :cursor ORDER BY id DESC LIMIT 20`, which is fast at any depth and stable.'],
  ['APIs and networking',0,'How do you version an API?','Put the version in the path (/v1/), a header or the media type.\nPrefer additive, backward compatible changes such as new optional fields, and announce deprecations with a timeline before removing anything.'],
  ['Security',1,'Sessions or JWTs for authentication?','A server session stores state in a database or cache and gives the browser a random ID in a cookie, which is easy to revoke.\nA JWT is a signed token that services verify without a lookup. It scales well but cannot easily be revoked before it expires, so keep it short-lived and pair it with refresh tokens. Use OAuth 2.0 and OpenID Connect for delegated login.'],
  ['Security',0,'How should passwords be stored?','Never in plain text, and never with fast hashes such as MD5 or SHA-256.\nUse a slow, salted password hashing function (Argon2id, bcrypt or scrypt) with a unique salt per user, rate limit login attempts, and offer multi-factor authentication.'],
  ['Security',0,'How do you protect data in transit and at rest?','Use TLS everywhere, including mutual TLS between internal services.\nEncrypt disks and objects with keys held in a key management service, rotate keys, grant least privilege access, and keep audit logs of who read what.']
  ].map(function(r){return {c:r[0],s:r[1],q:r[2],a:r[3]};});

  function rich(s){return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>');}
  var list=$('#faq-list'),cats=['All'],cat='All',star=false,q='';
  F.forEach(function(it){if(cats.indexOf(it.c)<0)cats.push(it.c);
    var d=document.createElement('details');d.className='qa faq-item';
    d.innerHTML='<summary><span class="faq-qt">'+esc(it.q)+'</span><span class="faq-tags">'+(it.s?'<span class="star" title="Most asked" aria-label="Most asked">★</span>':'')+'<span class="tag b">'+esc(it.c)+'</span></span></summary>'+
      '<div class="faq-a">'+it.a.split('\n').map(function(p){return '<p>'+rich(p)+'</p>';}).join('')+'</div>';
    it.el=d;it.txt=(it.q+' '+it.a+' '+it.c).toLowerCase();list.appendChild(d);});
  var empty=document.createElement('p');empty.className='faq-empty';empty.hidden=true;empty.textContent='No questions match. Clear the search or pick another category.';list.appendChild(empty);
  var chipBox=$('#faq-cat');
  cats.forEach(function(c){var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',String(c==='All'));
    var cnt=c==='All'?F.length:F.filter(function(x){return x.c===c;}).length;
    b.innerHTML=esc(c)+'<span class="n">'+cnt+'</span>';
    b.addEventListener('click',function(){cat=c;$$('.chip',chipBox).forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});apply();});chipBox.appendChild(b);});
  function visible(){var terms=q.split(/\s+/).filter(Boolean);return F.filter(function(it){return (cat==='All'||it.c===cat)&&(!star||it.s)&&terms.every(function(tm){return it.txt.indexOf(tm)>=0;});});}
  function apply(){var vis=visible();F.forEach(function(it){it.el.hidden=vis.indexOf(it)<0;});empty.hidden=vis.length>0;
    $('#faq-count').textContent=vis.length+' of '+F.length+' questions';}
  $('#faq-q').addEventListener('input',function(e){q=e.target.value.toLowerCase().trim();apply();});
  $('#faq-star').addEventListener('change',function(e){star=e.target.checked;apply();});
  $('#faq-open').addEventListener('click',function(){visible().forEach(function(it){it.el.open=true;});});
  $('#faq-close').addEventListener('click',function(){F.forEach(function(it){it.el.open=false;});});
  /* flashcards */
  var deck=[],ix=0,card=$('#faq-card');
  function showCard(){var it=deck[ix];$('#fc-meta').textContent='Card '+(ix+1)+' of '+deck.length+' · '+it.c+(it.s?' · most asked':'');
    $('#fc-q').textContent=it.q;var a=$('#fc-a');a.innerHTML=it.a.split('\n').map(function(p){return '<p>'+rich(p)+'</p>';}).join('');a.hidden=true;
    $('#fc-show').textContent='Show answer';$('#fc-prev').disabled=ix===0;$('#fc-next').disabled=ix===deck.length-1;}
  $('#faq-practice').addEventListener('click',function(){deck=visible();if(!deck.length)return;ix=0;list.hidden=true;card.hidden=false;showCard();card.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});});
  $('#fc-exit').addEventListener('click',function(){card.hidden=true;list.hidden=false;});
  $('#fc-show').addEventListener('click',function(){var a=$('#fc-a');a.hidden=!a.hidden;$('#fc-show').textContent=a.hidden?'Show answer':'Hide answer';});
  $('#fc-next').addEventListener('click',function(){if(ix<deck.length-1){ix++;showCard();}});
  $('#fc-prev').addEventListener('click',function(){if(ix>0){ix--;showCard();}});
  $('#fc-shuffle').addEventListener('click',function(){for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=deck[i];deck[i]=deck[j];deck[j]=tmp;}ix=0;showCard();});
  apply();
});

/* =====================================================================
   FOUNDATIONS: glossary, charts and small simulators
   ===================================================================== */
var TIP=(function(){
  var el=document.createElement('div');el.className='ttip';el.hidden=true;document.body.appendChild(el);
  function show(lines,x,y){
    el.textContent='';
    lines.forEach(function(l,i){var d=document.createElement(i===0?'b':'div');d.textContent=l;el.appendChild(d);});
    el.hidden=false;
    var r=el.getBoundingClientRect(),px=x+14,py=y+14;
    if(px+r.width>window.innerWidth-8)px=x-r.width-14;
    if(py+r.height>window.innerHeight-8)py=y-r.height-14;
    el.style.left=Math.max(8,px)+'px';el.style.top=Math.max(8,py)+'px';
  }
  function hide(){el.hidden=true;}
  return {show:show,hide:hide};
})();
function bindTip(node,fn){
  node.setAttribute('tabindex','0');
  node.addEventListener('pointermove',function(e){TIP.show(fn(),e.clientX,e.clientY);});
  node.addEventListener('pointerleave',TIP.hide);
  node.addEventListener('focus',function(){var r=node.getBoundingClientRect();TIP.show(fn(),r.left+r.width/2,r.top+r.height/2);});
  node.addEventListener('blur',TIP.hide);
}
function barH(x,y,w,h){if(w<=0.5)w=0.5;var r=Math.min(4,w/2,h/2);return 'M'+x+' '+y+'H'+(x+w-r)+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'V'+(y+h-r)+'Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+'H'+x+'Z';}
function barV(x,y,w,h){if(h<=0)return 'M0 0';var r=Math.min(4,w/2,h);return 'M'+x+' '+(y+h)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'H'+(x+w-r)+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'V'+(y+h)+'Z';}
function niceStep(span,count){var raw=span/count,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}
function clearSvg(svg,w,h){svg.setAttribute('viewBox','0 0 '+w+' '+h);while(svg.firstChild)svg.removeChild(svg.firstChild);}
function fmtMs(ms){return ms>=1000?trim(ms/1000)+' s':Math.round(ms)+' ms';}
function fmtDur(min){if(min>=1440*1.5)return trim(min/1440)+' days';if(min>=90)return trim(min/60)+' hours';if(min>=1)return trim(min)+' min';return Math.max(1,Math.round(min*60))+' s';}
function fmtSecs(s){if(s<1)return trim(s*1000)+' ms';if(s<90)return trim(s)+' s';if(s<5400)return trim(s/60)+' min';if(s<172800)return trim(s/3600)+' hours';if(s<86400*365)return trim(s/86400)+' days';return trim(s/(86400*365))+' years';}
function pctStr(x){var p=x*100,gap=+(100-p).toPrecision(6);if(gap<1e-5)return '> 99.99999%';var d=Math.min(6,Math.max(1,Math.ceil(-Math.log10(gap))+1));return p.toFixed(d)+'%';}
function tocLink(id){return document.querySelector('.toc a[data-sheet="'+id+'"]');}
function tocLabel(id){var a=tocLink(id);if(!a)return null;var c=a.cloneNode(true);$$('span',c).forEach(function(s){s.parentNode.removeChild(s);});return c.textContent.trim();}

/* ---------- I.1 glossary ---------- */
mod('glossary',function(){
  var G=[
  ['Latency','Performance','Time for one operation to complete, end to end. Report percentiles, not averages.','f-latency'],
  ['Throughput','Performance','Work completed per unit of time, such as requests per second or MB per second.','f-latency'],
  ['Bandwidth','Performance','The maximum data rate of a link, in bits per second. Throughput is what you actually achieve through it.','f-units'],
  ['Percentile (p50, p95, p99)','Performance','The value a given share of measurements stays under. At p99 = 250 ms, one request in a hundred is slower.','f-latency'],
  ['Tail latency','Performance','The slowest requests, p99 and beyond. It dominates when one page fans out into many calls.','f-latency'],
  ['QPS or RPS','Performance','Queries or requests per second, the basic unit of load. Peak is usually 2 to 3 times the average.','estimate'],
  ['Round trip time (RTT)','Performance','Time for a message to reach the other side and come back, set by distance and network hops.','f-request'],
  ['Utilization','Performance','The share of time a resource is busy. Latency climbs steeply as it approaches 100%.','f-load'],
  ['Little’s law','Performance','Items in a system equal arrival rate times the time each spends inside: L = λ × W.','f-load'],
  ['Bottleneck','Performance','The one resource that limits the throughput of the whole system. Scaling anything else does not help.','scale'],
  ['Availability','Reliability','The share of time a system serves requests correctly, such as 99.9%.','f-avail'],
  ['MTBF and MTTR','Reliability','Mean time between failures and mean time to recovery. Availability ≈ MTBF ÷ (MTBF + MTTR).','f-avail'],
  ['SLI, SLO and SLA','Reliability','The measured indicator, your internal target for it, and the customer contract with penalties.','faq'],
  ['Error budget','Reliability','One minus the SLO: the unreliability you may spend on releases and incidents.','faq'],
  ['Single point of failure','Reliability','A component whose failure stops the whole system. Removed with redundancy.','f-avail'],
  ['Redundancy','Reliability','Extra copies of a component so one can fail without an outage.','f-avail'],
  ['Failover','Reliability','Moving traffic to a standby when the primary fails, automatically or by hand.','lb'],
  ['Health check','Reliability','A periodic probe, such as GET /healthz, that decides whether an instance receives traffic.','lb'],
  ['Graceful degradation','Reliability','Serving a reduced experience, such as cached or partial results, instead of failing completely.','faq'],
  ['Circuit breaker','Reliability','Stops calling a failing dependency for a cooldown so one failure does not cascade.','faq'],
  ['Retry with backoff','Reliability','Retrying after growing, randomized waits so retries do not stampede a struggling service.','c-pay'],
  ['Idempotency','Reliability','Doing an operation twice has the same effect as doing it once, which makes retries safe.','c-pay'],
  ['Vertical scaling','Scaling','Making one machine bigger: more CPU, memory or disk. Simple, with a hard ceiling.','scale'],
  ['Horizontal scaling','Scaling','Adding machines behind a load balancer. Needs stateless services and partitioned data.','scale'],
  ['Stateless service','Scaling','Keeps nothing about a client between requests, so any instance can serve any request.','scale'],
  ['Load balancer','Scaling','Spreads incoming requests across healthy servers.','lb'],
  ['Cache','Scaling','A fast copy of data that is slow to fetch or compute, usually held in memory.','cache'],
  ['CDN','Scaling','Edge servers around the world that cache content close to users.','f-request'],
  ['Replication','Scaling','Keeping copies of the same data on several machines for read capacity and failover.','scale'],
  ['Sharding','Scaling','Splitting data across machines by a key so each holds one part. Also called partitioning.','scale'],
  ['Hot spot','Scaling','A key or shard that gets far more traffic than the rest, such as a celebrity’s profile.','c-feed'],
  ['Autoscaling','Scaling','Adding and removing instances automatically based on load or queue depth.','queues'],
  ['Backpressure','Scaling','Slowing producers down when consumers cannot keep up, instead of buffering forever.','queues'],
  ['Rate limiting','Scaling','Capping how many requests a client may make in a time window.','ratelimit'],
  ['ACID','Data','Atomic, consistent, isolated, durable: the guarantees of a database transaction.','f-data'],
  ['Transaction','Data','A group of operations that succeed or fail together.','f-data'],
  ['Index','Data','A sorted structure that finds rows without a full scan. Speeds reads, slows writes.','f-data'],
  ['Normalization','Data','Keeping one copy of each fact. Denormalization copies data to make reads faster.','faq'],
  ['SQL and NoSQL','Data','Relational databases with schemas and joins, versus key value, document, wide column and graph stores built for specific access patterns.','f-data'],
  ['OLTP and OLAP','Data','Many small transactional reads and writes, versus large analytical scans over history.','f-data'],
  ['Object storage','Data','A flat store of immutable blobs fetched by key, such as Amazon S3. Cheap and very durable.','f-data'],
  ['Write-ahead log','Data','Changes appended to a log before they are applied, for crash recovery and replication.','f-data'],
  ['Change data capture','Data','Streaming a database’s changes from its log to other systems, such as caches and search indexes.','faq'],
  ['LSM tree','Data','A storage engine that buffers writes in memory and flushes sorted files: fast writes, used by Cassandra and RocksDB.','c-kv'],
  ['Strong consistency','Distributed','Every read sees the latest completed write, as if there were only one copy.','cap'],
  ['Eventual consistency','Distributed','Replicas may disagree for a while but converge once writes stop.','cap'],
  ['CAP theorem','Distributed','During a network partition, a replicated system must choose consistency or availability.','cap'],
  ['Network partition','Distributed','Some nodes cannot reach others, although each is still running.','cap'],
  ['Quorum','Distributed','How many replicas must answer. With R + W > N, every read overlaps the latest write.','c-kv'],
  ['Consensus','Distributed','Nodes agreeing on one value or leader despite failures, as Raft and Paxos do.','faq'],
  ['Leader election','Distributed','Choosing one node to coordinate writes, and replacing it when it fails.','faq'],
  ['Split brain','Distributed','Two nodes both acting as leader after a partition. Prevented by quorums and fencing tokens.','faq'],
  ['Consistent hashing','Distributed','Keys and servers on one ring, so adding a server moves only about 1/N of the keys.','hashing'],
  ['Vector clock','Distributed','Per server counters attached to a value that reveal whether two writes were concurrent.','c-kv'],
  ['Gossip protocol','Distributed','Nodes share state with a few random peers each round until everyone knows.','c-kv'],
  ['Two-phase commit','Distributed','A coordinator asks all participants to prepare, then to commit. Atomic but blocking.','faq'],
  ['Saga','Distributed','A chain of local transactions, each with a compensating action that undoes it.','faq'],
  ['DNS','Networking','Turns names into IP addresses, with answers cached at every level for each record’s TTL.','f-request'],
  ['TCP and UDP','Networking','TCP is a reliable, ordered stream with a handshake. UDP sends independent packets with no guarantees.','faq'],
  ['TLS','Networking','Encrypts a connection and proves the server’s identity. HTTPS is HTTP over TLS.','f-request'],
  ['HTTP/2 and HTTP/3','Networking','HTTP/2 multiplexes many requests on one TCP connection. HTTP/3 runs over QUIC on UDP and saves a handshake.','f-request'],
  ['Keep-alive','Networking','Reusing an open connection for many requests to skip DNS and the handshakes.','f-request'],
  ['Layer 4 and layer 7','Networking','Routing by IP address and port, versus routing by HTTP content such as path and headers.','lb'],
  ['Reverse proxy','Networking','A server in front of your servers that handles TLS, caching and routing.','faq'],
  ['API gateway','Networking','A reverse proxy for APIs that adds authentication, rate limiting and routing to many services.','ratelimit'],
  ['WebSocket','Networking','A long lived, two way connection over which either side can send at any time.','f-comm'],
  ['Server-sent events','Networking','A one way stream of events from server to browser over plain HTTP.','f-comm'],
  ['Long polling','Networking','The server holds a request open until there is news, then the client asks again.','f-comm'],
  ['Message queue','Messaging','A buffer where each message goes to one consumer and is deleted once acknowledged.','queues'],
  ['Pub/sub','Messaging','Every subscriber of a topic receives every message published to it.','queues'],
  ['Log or stream','Messaging','An ordered, durable sequence of messages that consumers read at their own offset and can replay, as in Kafka.','queues'],
  ['Consumer group','Messaging','Consumers that share a topic’s partitions, so each message is processed once per group.','queues'],
  ['At-least-once delivery','Messaging','Messages are never lost but may arrive twice, so consumers must be idempotent.','queues'],
  ['Dead letter queue','Messaging','Where messages go after repeated failures, so they stop blocking the rest.','queues'],
  ['Fan-out','Messaging','One event triggering many deliveries, such as a post pushed to every follower’s feed.','c-feed'],
  ['Authentication','Security','Proving who someone is: passwords, keys, tokens.','faq'],
  ['Authorization','Security','Deciding what an authenticated identity is allowed to do.','faq'],
  ['Encryption in transit and at rest','Security','TLS on the wire; encrypted disks and objects with keys held in a key management service.','faq'],
  ['Hashing','Security','A one way fingerprint of data, used for passwords (with a slow, salted hash), checksums and partitioning.','faq'],
  ['JWT','Security','A signed token carrying claims that services can verify without a database lookup.','faq'],
  ['OAuth 2.0','Security','A standard for granting an app limited access to an account without sharing the password.','faq']
  ].map(function(r){return {t:r[0],c:r[1],d:r[2],l:r[3]};});
  var list=$('#gl-list'),cats=['All'],cat='All',q='';
  G.forEach(function(it){
    if(cats.indexOf(it.c)<0)cats.push(it.c);
    var box=document.createElement('div');box.className='g-item';
    var dt=document.createElement('dt');dt.textContent=it.t;var tg=document.createElement('span');tg.className='tag b';tg.textContent=it.c;dt.appendChild(tg);
    var dd=document.createElement('dd');dd.textContent=it.d+' ';
    var lab=tocLabel(it.l);
    if(lab){var a=document.createElement('a');a.className='g-link';a.href=tocLink(it.l).getAttribute('href');a.textContent=lab+' →';dd.appendChild(a);}
    box.appendChild(dt);box.appendChild(dd);list.appendChild(box);
    it.el=box;it.txt=(it.t+' '+it.d+' '+it.c).toLowerCase();
  });
  var empty=document.createElement('p');empty.className='faq-empty';empty.hidden=true;empty.textContent='No terms match. Clear the search or pick another area.';list.appendChild(empty);
  var chipBox=$('#gl-cat');
  cats.forEach(function(c){var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',String(c==='All'));
    var n=c==='All'?G.length:G.filter(function(x){return x.c===c;}).length;
    b.textContent=c;var s=document.createElement('span');s.className='n';s.textContent=n;b.appendChild(s);
    b.addEventListener('click',function(){cat=c;$$('.chip',chipBox).forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});apply();});chipBox.appendChild(b);});
  function apply(){var terms=q.split(/\s+/).filter(Boolean),n=0;
    G.forEach(function(it){var ok=(cat==='All'||it.c===cat)&&terms.every(function(tm){return it.txt.indexOf(tm)>=0;});it.el.hidden=!ok;if(ok)n++;});
    empty.hidden=n>0;$('#gl-count').textContent=n+' of '+G.length+' terms';}
  $('#gl-q').addEventListener('input',function(e){q=e.target.value.toLowerCase().trim();apply();});
  apply();
});

/* ---------- I.2 request waterfall ---------- */
mod('waterfall',function(){
  var svg=$('#wf-svg'),dist=40,proto='h2',repeat=false,SERVER=60,DL=32,DNS=20;
  function phases(R,pr,rep){
    var rows=[
      {n:'DNS lookup',d:rep?0:DNS,k:2,why:rep?'Skipped: answer already cached':'Nearby resolver, answer cached'},
      {n:pr==='h3'?'Transport handshake':'TCP handshake',d:rep||pr==='h3'?0:R,k:2,why:rep?'Skipped: connection reused':pr==='h3'?'Folded into the QUIC handshake':'SYN, SYN-ACK, ACK: 1 round trip'},
      {n:pr==='h3'?'QUIC + TLS 1.3 handshake':'TLS handshake',d:rep?0:(pr==='h1'?2*R:R),k:2,why:rep?'Skipped: connection reused':pr==='h1'?'TLS 1.2: 2 round trips':'TLS 1.3: 1 round trip'},
      {n:'Request and server work',d:R+SERVER,k:1,why:'1 round trip + '+SERVER+' ms of server work'},
      {n:'Download 200 KB',d:DL,k:1,why:'200 KB at 50 Mbps'}];
    var t=0;rows.forEach(function(r){r.s=t;t+=r.d;});return rows;
  }
  function render(){
    var rows=phases(dist,proto,repeat),total=rows[4].s+rows[4].d,setup=rows[3].s,ttfb=rows[3].s+rows[3].d;
    var W=860,X0=210,X1=780,RH=38,TOP=34,H=TOP+rows.length*RH+40;
    clearSvg(svg,W,H);
    var max=Math.max(100,total*1.04),step=niceStep(max,6);max=Math.ceil(max/step)*step;
    function x(v){return X0+(X1-X0)*v/max;}
    for(var v=0;v<=max+1e-9;v+=step){S('line',{x1:x(v),x2:x(v),y1:TOP-6,y2:TOP+rows.length*RH,'class':'grid'},svg);T('text',{x:x(v),y:TOP+rows.length*RH+18,'text-anchor':'middle','class':'ax'},svg,Math.round(v)+' ms');}
    S('line',{x1:x(ttfb),x2:x(ttfb),y1:TOP-14,y2:TOP+rows.length*RH,'class':'mk-line'},svg);
    T('text',{x:x(ttfb),y:TOP-18,'text-anchor':x(ttfb)>X1-60?'end':'middle','class':'mk'},svg,'first byte at '+Math.round(ttfb)+' ms');
    rows.forEach(function(r,i){var y=TOP+i*RH;
      T('text',{x:X0-12,y:y+RH/2+4,'text-anchor':'end','class':'rl'},svg,r.n);
      if(r.d>0){S('rect',{x:x(r.s),y:y+RH/2-9,width:Math.max(2,x(r.s+r.d)-x(r.s)),height:18,rx:4,'class':r.k===2?'c2':'c1'},svg);
        T('text',{x:x(r.s+r.d)+6,y:y+RH/2+4,'class':'vl'},svg,Math.round(r.d)+' ms');}
      else T('text',{x:x(r.s)+4,y:y+RH/2+4,'class':'ax'},svg,'0 ms · '+r.why.replace('Skipped: ','skipped, ').replace('Folded','folded'));
      var hit=S('rect',{x:X0-200,y:y,width:X1-X0+260,height:RH,'class':'bar-hit'},svg);
      bindTip(hit,function(){return [Math.round(r.d)+' ms',r.n,r.why,'starts at '+Math.round(r.s)+' ms'];});
    });
    $('#wf-setup').innerHTML=Math.round(setup)+' ms <small>'+Math.round(setup/total*100)+'% of the total</small>';
    $('#wf-ttfb').textContent=Math.round(ttfb)+' ms';$('#wf-total').textContent=Math.round(total)+' ms';
    var note;
    if(repeat)note='Reusing the connection skips DNS and both handshakes, which is why HTTP clients keep connection pools and browsers keep connections alive.';
    else if(dist===150){var near=phases(10,proto,false);note='Distance multiplies every round trip. A CDN edge in the user’s own city (try Same city) would cut connection setup from '+Math.round(setup)+' ms to '+Math.round(near[3].s)+' ms.';}
    else if(proto==='h1')note='TLS 1.2 spends two round trips on keys. TLS 1.3 needs one, and HTTP/3 also folds the TCP handshake into QUIC.';
    else note='Connection setup is '+Math.round(setup)+' ms before your code even sees the request. Try the other distances and protocols, or a repeat request.';
    $('#wf-note').textContent=note;
  }
  segInit('wf-dist',function(v){dist=+v;render();});
  segInit('wf-proto',function(v){proto=v;render();});
  $('#wf-repeat').addEventListener('change',function(e){repeat=e.target.checked;render();});
  render();
});
mod('dns',function(){
  buildDiagram($('#dns-svg'),{w:900,h:250,nodes:[
    {id:'br',x:14,y:104,w:120,h:50,t:'Browser',s:'+ OS cache',kind:'client'},
    {id:'rs',x:300,y:98,w:160,h:62,t:'Resolver',s:'caches every answer'},
    {id:'root',x:640,y:22,w:240,h:48,t:'Root server',s:'refers to .com servers',kind:'ext'},
    {id:'tld',x:640,y:105,w:240,h:48,t:'.com TLD server',s:'refers to example.com servers',kind:'ext'},
    {id:'auth',x:640,y:188,w:240,h:48,t:'Authoritative server',s:'example.com = 93.184.216.34',kind:'ext'}],
   edges:[
    {a:'br.r',ao:-10,b:'rs.l',bo:-10,label:'1 · example.com?'},
    {a:'rs.l',ao:10,b:'br.r',bo:10,label:'5 · answer, cached',cls:'blue'},
    {a:'rs.r',ao:-14,b:'root.l',route:'hvh',via:560,label:'2',lp:[552,40],la:'end',cls:'both'},
    {a:'rs.r',b:'tld.l',label:'3',lp:[600,122],cls:'both'},
    {a:'rs.r',ao:14,b:'auth.l',route:'hvh',via:560,label:'4',lp:[552,206],la:'end',cls:'both'}]});
});

/* ---------- I.3 percentiles ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
mod('percentiles',function(){
  var rnd=mulberry32(42),Z=[],MED=80,svg=$('#pc-svg');
  for(var i=0;i<10000;i++){var u=rnd()||1e-9,v=rnd();Z.push(Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}
  Z.sort(function(a,b){return a-b;});
  function render(){
    var sg=+$('#pc-tail').value;$('#pc-tail-o').textContent=sg<0.4?'Short':sg<0.8?'Medium':'Long';
    var xs=Z.map(function(z){return MED*Math.exp(sg*z);}),n=xs.length,sum=0;xs.forEach(function(v){sum+=v;});
    var mean=sum/n;function q(p){return xs[Math.min(n-1,Math.floor(p*(n-1)))];}
    var p50=q(0.5),p95=q(0.95),p99=q(0.99);
    var W=860,H=300,X0=56,X1=830,Y0=40,Y1=250,BINS=44;
    clearSvg(svg,W,H);
    var xmax=q(0.995)*1.05,st=niceStep(xmax,6);xmax=Math.ceil(xmax/st)*st;
    var bw=xmax/BINS,counts=new Array(BINS).fill(0),over=0;
    xs.forEach(function(v){var b=Math.floor(v/bw);if(b>=BINS)over++;else counts[b]++;});
    var cmax=Math.max.apply(null,counts),cst=niceStep(cmax,4),ctop=Math.ceil(cmax/cst)*cst;
    function x(v){return X0+(X1-X0)*v/xmax;}function y(c){return Y1-(Y1-Y0)*c/ctop;}
    for(var c=0;c<=ctop+1e-9;c+=cst){S('line',{x1:X0,x2:X1,y1:y(c),y2:y(c),'class':'grid'},svg);T('text',{x:X0-8,y:y(c)+4,'text-anchor':'end','class':'ax'},svg,nf.format(c));}
    for(var v=0;v<=xmax+1e-9;v+=st)T('text',{x:x(v),y:Y1+18,'text-anchor':'middle','class':'ax'},svg,Math.round(v)+' ms');
    T('text',{x:X0,y:16,'class':'ax'},svg,'Requests per bucket');
    var colW=(X1-X0)/BINS,bars=[];
    counts.forEach(function(cnt,b){var p=S('path',{d:barV(X0+b*colW+1,y(cnt),Math.min(24,colW-2),Y1-y(cnt)),'class':'c1'},svg);bars.push(p);});
    var marks=[['p50',p50,0],['mean',mean,1],['p95',p95,0],['p99',p99,1]];
    marks.sort(function(a,b){return a[1]-b[1];});
    marks.forEach(function(m,i){var mx=x(m[1]);S('line',{x1:mx,x2:mx,y1:Y0-6+(i%2)*14,y2:Y1,'class':'mk-line'},svg);
      T('text',{x:mx+4,y:Y0-8+(i%2)*14,'class':'mk'},svg,m[0]+' '+Math.round(m[1])+' ms');});
    var hl=null;
    var hit=S('rect',{x:X0,y:Y0-20,width:X1-X0,height:Y1-Y0+20,'class':'hit'},svg);
    hit.addEventListener('pointermove',function(e){var r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)*W/r.width,b=Math.max(0,Math.min(BINS-1,Math.floor((vx-X0)/colW)));
      if(hl)hl.classList.remove('hl');hl=bars[b];hl.classList.add('hl');
      TIP.show([nf.format(counts[b])+' requests',Math.round(b*bw)+' to '+Math.round((b+1)*bw)+' ms'],e.clientX,e.clientY);});
    hit.addEventListener('pointerleave',function(){if(hl)hl.classList.remove('hl');TIP.hide();});
    $('#pc-p50').textContent=Math.round(p50)+' ms';$('#pc-mean').textContent=Math.round(mean)+' ms';$('#pc-p95').textContent=Math.round(p95)+' ms';$('#pc-p99').textContent=Math.round(p99)+' ms';
    $('#pc-note').textContent='The mean ('+Math.round(mean)+' ms) sits above the median ('+Math.round(p50)+' ms) because slow requests pull it up. The p99 is '+trim(p99/p50)+'× the median: one request in a hundred waits that long'+(over?', and '+over+' requests are slower than the chart shows.':'.');
  }
  $('#pc-tail').addEventListener('input',render);render();
});
mod('tail-at-scale',function(){
  var svg=$('#ts-svg');
  function P(n){return 1-Math.pow(0.99,n);}
  function render(){
    var n=+$('#ts-n').value;$('#ts-n-o').textContent=n;
    var W=860,H=280,X0=56,X1=820,Y0=24,Y1=236,NMAX=200;clearSvg(svg,W,H);
    function x(v){return X0+(X1-X0)*(v-1)/(NMAX-1);}function y(p){return Y1-(Y1-Y0)*p;}
    [0,0.25,0.5,0.75,1].forEach(function(p){S('line',{x1:X0,x2:X1,y1:y(p),y2:y(p),'class':'grid'},svg);T('text',{x:X0-8,y:y(p)+4,'text-anchor':'end','class':'ax'},svg,Math.round(p*100)+'%');});
    [1,25,50,75,100,125,150,175,200].forEach(function(v){T('text',{x:x(v),y:Y1+18,'text-anchor':'middle','class':'ax'},svg,v);});
    T('text',{x:X1,y:Y1+34,'text-anchor':'end','class':'ax'},svg,'backend calls per page');
    var d='',a='M'+x(1)+' '+y(0);for(var k=1;k<=NMAX;k++){d+=(k===1?'M':'L')+x(k).toFixed(1)+' '+y(P(k)).toFixed(1);a+=' L'+x(k).toFixed(1)+' '+y(P(k)).toFixed(1);}
    a+=' L'+x(NMAX)+' '+y(0)+' Z';S('path',{d:a,'class':'ch-area'},svg);S('path',{d:d,'class':'ch-line'},svg);
    var xh=S('line',{x1:-9,x2:-9,y1:Y0,y2:Y1,'class':'xhair'},svg);
    S('circle',{cx:x(n),cy:y(P(n)),r:5,'class':'ch-dot'},svg);
    T('text',{x:x(n)+(n>170?-10:10),y:y(P(n))+(P(n)>0.85?18:-10),'text-anchor':n>170?'end':'start','class':'vl'},svg,Math.round(P(n)*100)+'% of pages');
    var hit=S('rect',{x:X0,y:Y0,width:X1-X0,height:Y1-Y0,'class':'hit'},svg);
    hit.addEventListener('pointermove',function(e){var r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)*W/r.width,k=Math.max(1,Math.min(NMAX,Math.round(1+(vx-X0)/(X1-X0)*(NMAX-1))));
      xh.setAttribute('x1',x(k));xh.setAttribute('x2',x(k));TIP.show([(P(k)*100).toFixed(1)+'% of pages hit a slow call',k+' backend calls per page'],e.clientX,e.clientY);});
    hit.addEventListener('pointerleave',function(){xh.setAttribute('x1',-9);xh.setAttribute('x2',-9);TIP.hide();});
    $('#ts-note').textContent='If each call is slower than its own p99 one time in a hundred, a page that waits on '+n+' calls is slow '+(P(n)*100).toFixed(0)+'% of the time. Fixes: fewer calls on the critical path, caching, timeouts, and hedged requests that send a second copy when the first passes the p95.';
  }
  $('#ts-n').addEventListener('input',render);render();
});

/* ---------- I.4 availability ---------- */
mod('nines',function(){
  var svg=$('#nines-svg'),R=[['99%','two nines',0.99],['99.9%','three nines',0.999],['99.95%','',0.9995],['99.99%','four nines',0.9999],['99.999%','five nines',0.99999]];
  var W=860,X0=190,X1=760,RH=40,TOP=16,H=TOP+R.length*RH+40,LMAX=Math.log10(10080);
  clearSvg(svg,W,H);
  function x(m){return X0+(X1-X0)*Math.max(0,Math.log10(m))/LMAX;}
  [[1,'1 min'],[10,'10 min'],[60,'1 hour'],[1440,'1 day'],[10080,'1 week']].forEach(function(tk){S('line',{x1:x(tk[0]),x2:x(tk[0]),y1:TOP-4,y2:TOP+R.length*RH,'class':'grid'},svg);T('text',{x:x(tk[0]),y:TOP+R.length*RH+18,'text-anchor':'middle','class':'ax'},svg,tk[1]);});
  R.forEach(function(r,i){var y=TOP+i*RH,m=(1-r[2])*525600;
    T('text',{x:X0-12,y:y+RH/2+4,'text-anchor':'end','class':'rl'},svg,r[0]+(r[1]?'  ('+r[1]+')':''));
    S('path',{d:barH(X0,y+RH/2-10,x(m)-X0,20),'class':'c1'},svg);
    T('text',{x:x(m)+6,y:y+RH/2+4,'class':'vl'},svg,fmtDur(m));
    var hit=S('rect',{x:0,y:y,width:W,height:RH,'class':'bar-hit'},svg);
    bindTip(hit,function(){return [fmtDur(m)+' per year',r[0]+' available',fmtDur(m/12)+' per month, '+fmtDur(m/52)+' per week'];});
  });
});
mod('avail-chain',function(){
  var svg=$('#av-svg'),k=1,NAMES=['DNS','Load balancer','App server','Cache','Database','Payments API'];
  function render(){
    var a=+$('#av-a').value,n=+$('#av-n').value,ap=+(a*100).toFixed(4);$('#av-n-o').textContent=n;
    var stage=1-Math.pow(1-a,k),sys=Math.pow(stage,n);
    var W=900,H=196,SW=118,GAP=30,tot=n*SW+(n-1)*GAP,x0=(W-tot)/2,BH=32,BG=8,REG=3*BH+2*BG,RY=40;
    clearSvg(svg,W,H);
    for(var i=0;i<n;i++){var sx=x0+i*(SW+GAP),cy=RY+REG/2;
      T('text',{x:sx+SW/2,y:24,'text-anchor':'middle','class':'rl',style:'font-weight:650'},svg,NAMES[i]);
      var top=cy-(k*BH+(k-1)*BG)/2;
      for(var j=0;j<k;j++){var g=S('g',{'class':'node'+(j>0?' new':'')},svg);
        S('rect',{'class':'shape',x:sx,y:top+j*(BH+BG),width:SW,height:BH,rx:4},g);
        T('text',{'class':'s',x:sx+SW/2,y:top+j*(BH+BG)+BH/2+4,'text-anchor':'middle'},g,ap+'% up');}
      T('text',{x:sx+SW/2,y:RY+REG+26,'text-anchor':'middle','class':'ax'},svg,'stage '+pctStr(stage));
      if(i<n-1){var g2=S('g',{'class':'edge'},svg);S('path',{d:'M'+(sx+SW+3)+' '+cy+' L'+(sx+SW+GAP-3)+' '+cy},g2);}
    }
    $('#av-stage').textContent=pctStr(stage);$('#av-sys').textContent=pctStr(sys);
    $('#av-down').textContent=fmtDur((1-sys)*525600);
    var note;
    if(k===1){var s2=Math.pow(1-Math.pow(1-a,2),n);note='A chain of '+n+' components at '+ap+'% each is only '+pctStr(sys)+', about '+fmtDur((1-sys)*525600)+' of downtime a year. Give every component a second copy and the chain rises to '+pctStr(s2)+'.';}
    else note='With '+k+' copies of each component, the chain reaches '+pctStr(sys)+'. At this point the real risks are failures that hit every copy at once: a bad deploy, a shared database, a region outage.';
    $('#av-note').textContent=note;
  }
  $('#av-a').addEventListener('change',render);$('#av-n').addEventListener('input',render);
  segInit('av-k',function(v){k=+v;render();});render();
});

/* ---------- I.5 utilization ---------- */
mod('utilization',function(){
  var svg=$('#ut-svg'),S0=10,YMAX=250;
  function Wt(r){return S0/(1-r);}
  function render(){
    var rho=+$('#ut-rho').value/100;$('#ut-rho-o').textContent=Math.round(rho*100)+'%';
    var W=860,H=290,X0=60,X1=830,Y0=26,Y1=246;clearSvg(svg,W,H);
    function x(r){return X0+(X1-X0)*r;}function y(w){return Y1-(Y1-Y0)*Math.min(w,YMAX)/YMAX;}
    S('rect',{x:x(0.8),y:Y0,width:x(1)-x(0.8),height:Y1-Y0,'class':'zone'},svg);
    T('text',{x:x(0.8)+8,y:Y0+16,'class':'mk'},svg,'Danger zone');
    for(var w=0;w<=YMAX;w+=50){S('line',{x1:X0,x2:X1,y1:y(w),y2:y(w),'class':'grid'},svg);T('text',{x:X0-8,y:y(w)+4,'text-anchor':'end','class':'ax'},svg,w+' ms');}
    for(var p=0;p<=100;p+=20)T('text',{x:x(p/100),y:Y1+18,'text-anchor':'middle','class':'ax'},svg,p+'%');
    T('text',{x:X1,y:Y1+34,'text-anchor':'end','class':'ax'},svg,'utilization');
    var d='',a='M'+x(0)+' '+y(0),last=0;
    for(var r=0;r<=0.96+1e-9;r+=0.004){d+=(r===0?'M':'L')+x(r).toFixed(1)+' '+y(Wt(r)).toFixed(1);a+=' L'+x(r).toFixed(1)+' '+y(Wt(r)).toFixed(1);last=r;}
    a+=' L'+x(last)+' '+y(0)+' Z';S('path',{d:a,'class':'ch-area'},svg);S('path',{d:d,'class':'ch-line'},svg);
    var xh=S('line',{x1:-9,x2:-9,y1:Y0,y2:Y1,'class':'xhair'},svg);
    var wv=Wt(rho),cy=y(wv);
    S('circle',{cx:x(rho),cy:cy,r:5,'class':'ch-dot'},svg);
    T('text',{x:x(rho)+(rho>0.85?-10:10),y:wv>YMAX?Y0+34:cy-10,'text-anchor':rho>0.85?'end':'start','class':'vl'},svg,Math.round(wv)+' ms'+(wv>YMAX?' (off the chart)':''));
    var hit=S('rect',{x:X0,y:Y0,width:X1-X0,height:Y1-Y0,'class':'hit'},svg);
    hit.addEventListener('pointermove',function(e){var rr=svg.getBoundingClientRect(),vx=(e.clientX-rr.left)*W/rr.width,r=Math.max(0,Math.min(0.98,(vx-X0)/(X1-X0)));r=Math.round(r*100)/100;
      xh.setAttribute('x1',x(r));xh.setAttribute('x2',x(r));TIP.show([Math.round(Wt(r))+' ms','at '+Math.round(r*100)+'% utilization',trim(1/(1-r))+'× an idle server'],e.clientX,e.clientY);});
    hit.addEventListener('pointerleave',function(){xh.setAttribute('x1',-9);xh.setAttribute('x2',-9);TIP.hide();});
    $('#ut-w').textContent=Math.round(wv)+' ms';$('#ut-x').textContent=trim(1/(1-rho))+'×';$('#ut-l').textContent=trim(rho/(1-rho));
  }
  $('#ut-rho').addEventListener('input',render);render();
});
mod('littles-law',function(){
  function render(){var r=parseFloat($('#ll-rate').value)||0,l=parseFloat($('#ll-lat').value)||0,L=r*l/1000;
    $('#ll-out').textContent=nf.format(Math.round(L));
    $('#ll-note').textContent='At '+nf.format(r)+' requests per second and '+nf.format(l)+' ms each, about '+nf.format(Math.round(L))+' requests are in flight at any moment. That is how many threads, connections or buffers you need. If latency doubles during an incident, so does that number, which is how slow dependencies exhaust connection pools.';}
  ['ll-rate','ll-lat'].forEach(function(id){document.getElementById(id).addEventListener('input',render);});render();
});

/* ---------- I.6 data models ---------- */
mod('data-models',function(){
  var DM={
    rel:{code:'users\n id  name  city\n 42  Ada   Malmö\n\norders\n id    user_id  total  placed_at\n 9001  42       120    2026-09-01\n 9002  42       35     2026-09-14\n\nSELECT o.id, o.total\nFROM orders o JOIN users u ON u.id = o.user_id\nWHERE u.city = \'Malmö\';',
      shape:'Tables of rows with a fixed schema, linked by keys.',good:'Joins, transactions, constraints and new questions you did not plan for.',weak:'Spreading one database over many machines takes deliberate sharding work.',ex:'PostgreSQL, MySQL, SQL Server'},
    kv:{code:'GET user:42\n→ {"name":"Ada","city":"Malmö"}\n\nGET order:9001\n→ {"user":42,"total":120}\n\nSET cart:42 "[...]" EX 3600',
      shape:'A giant hash map: a key and an opaque value.',good:'One lookup by key at any scale, in microseconds to milliseconds. Caches, sessions, carts.',weak:'Anything other than “get this key”: no queries by value, no joins.',ex:'Redis, DynamoDB, Memcached'},
    doc:{code:'{\n  "_id": 42, "name": "Ada", "city": "Malmö",\n  "orders": [\n    { "id": 9001, "total": 120, "items": ["keyboard"] },\n    { "id": 9002, "total": 35,  "items": ["cable"] }\n  ]\n}',
      shape:'Self-contained JSON documents, often with nested data.',good:'Reading or writing a whole object in one go; fields that vary between records.',weak:'Joins across documents and many-to-many relationships; duplicated data drifts.',ex:'MongoDB, Firestore, Couchbase'},
    wide:{code:'PRIMARY KEY ((user_id), placed_at)\n\nuser_id  placed_at   order_id  total\n42       2026-09-14  9002      35\n42       2026-09-01  9001      120\n\n/* one partition per user, rows sorted by time:\n   "latest orders for user 42" is one read */',
      shape:'Rows grouped into partitions by key and sorted inside each partition.',good:'Huge write volumes and time ordered reads within one key: messages, events, feeds.',weak:'Any query not shaped by the partition key; you design tables per query.',ex:'Cassandra, ScyllaDB, HBase, Bigtable'},
    graph:{code:'(Ada)-[:BOUGHT]->(Keyboard)<-[:BOUGHT]-(Bo)\n(Bo)-[:BOUGHT]->(Wrist rest)\n\nMATCH (:User {name:\'Ada\'})-[:BOUGHT]->(p)\n      <-[:BOUGHT]-(other)-[:BOUGHT]->(rec)\nRETURN rec   /* → Wrist rest */',
      shape:'Nodes and the relationships between them, both first class.',good:'Many hops through relationships: friends of friends, fraud rings, recommendations.',weak:'Bulk analytics and scans over everything; sharding a graph is hard.',ex:'Neo4j, Amazon Neptune'},
    search:{code:'term          documents\n"wireless"    17, 204, 9001\n"keyboard"    9001, 9310\n"ergonomic"   204, 9001\n\nquery "wireless keyboard"\n→ intersect the lists → 9001, ranked by relevance',
      shape:'An inverted index: each word points to the documents that contain it.',good:'Full text search, relevance ranking, typo tolerance, facets.',weak:'Being the source of truth: updates appear after a short delay, so feed it from your main database.',ex:'Elasticsearch, OpenSearch, Solr'}
  };
  function show(k){var m=DM[k];$('#dm-code').textContent=m.code;$('#dm-shape').textContent=m.shape;$('#dm-good').textContent=m.good;$('#dm-weak').textContent=m.weak;$('#dm-ex').textContent=m.ex;}
  segInit('dm-tabs',show);show('rel');
});
mod('row-column',function(){
  var svg=$('#rc-svg'),W=900,H=226;clearSvg(svg,W,H);
  var ROWS=[['9001','42','120','09-01'],['9002','42','35','09-14'],['9003','7','64','09-15'],['9004','19','210','09-20']],COLS=['id','user','total','date'],HOT=2;
  T('text',{x:14,y:22,'class':'rl',style:'font-weight:650'},svg,'Table: orders');
  var CW=44,CH=24,TX=14,TY=34;
  COLS.forEach(function(c,j){T('text',{x:TX+j*CW+CW/2,y:TY+16,'text-anchor':'middle','class':'ax'},svg,c);});
  ROWS.forEach(function(r,i){r.forEach(function(v,j){var hot=j===HOT;
    S('rect',{x:TX+j*CW,y:TY+CH+i*CH,width:CW-2,height:CH-2,rx:2,fill:hot?'var(--blue-wash)':'var(--paper)',stroke:hot?'var(--blue)':'var(--rule)'},svg);
    T('text',{x:TX+j*CW+CW/2-1,y:TY+CH+i*CH+15,'text-anchor':'middle','class':'ax',style:'fill:var(--ink)'},svg,v);});});
  var SX=250,SC=38;
  function strip(y,title,order,note){
    T('text',{x:SX,y:y-10,'class':'rl',style:'font-weight:650'},svg,title);
    order.forEach(function(rc,p){var v=ROWS[rc[0]][rc[1]],hot=rc[1]===HOT;
      S('rect',{x:SX+p*SC,y:y,width:SC-2,height:28,rx:2,fill:hot?'var(--blue-wash)':'var(--paper)',stroke:hot?'var(--blue)':'var(--rule)'},svg);
      T('text',{x:SX+p*SC+SC/2-1,y:y+18,'text-anchor':'middle','class':'ax',style:'fill:var(--ink)'},svg,v);});
    T('text',{x:SX,y:y+48,'class':'ax'},svg,note);
  }
  var rowOrder=[],colOrder=[];for(var i=0;i<4;i++)for(var j=0;j<4;j++){rowOrder.push([i,j]);colOrder.push([j,i]);}
  strip(46,'Row store on disk',rowOrder,'Sum of totals: reads all 16 cells, row by row');
  strip(150,'Column store on disk',colOrder,'Sum of totals: reads 4 cells in one sequential run');
  S('line',{x1:SX+8*SC,x2:SX+12*SC-2,y1:184,y2:184,stroke:'var(--blue)','stroke-width':3,'stroke-linecap':'round'},svg);
});

/* ---------- I.7 communication patterns ---------- */
mod('comm',function(){
  var svg=$('#cm-svg'),W=900,H=350,LX=230,RX=670,TOP=58,BOT=336;
  var TXT={
    poll:['The client asks on a timer. Most answers are empty, and news waits until the next poll comes round.','Dashboards that refresh now and then. Costs: wasted requests and up to one interval of delay; shorter intervals multiply the load.'],
    long:['The client asks and the server holds the request open until there is news or a timeout. The client asks again immediately.','When WebSockets are not available. Costs: one held connection per client and a fresh request after every message.'],
    sse:['One HTTP request opens a stream and the server writes events down it as they happen. The browser reconnects automatically.','Feeds, notifications, progress bars and live scores. One way only: the client still uses normal requests to send.'],
    ws:['An HTTP request is upgraded to a WebSocket, a full duplex connection where either side can send at any time with tiny overhead.','Chat, games and collaborative editing. Costs: stateful servers, sticky routing and reconnect logic.'],
    hook:['Instead of you polling a provider, you give it a URL and it calls you when something happens, retrying until you answer 200.','Payments, CI and integrations between companies. Costs: a public endpoint, signature checks, and handling duplicates and out of order events.']
  };
  function msg(y1,y2,fromLeft,label,cls){
    var x1=fromLeft?LX:RX,x2=fromLeft?RX:LX,g=S('g',{'class':'edge'+(cls?' '+cls:'')},svg);
    S('path',{d:'M'+x1+' '+y1+' L'+x2+' '+y2},g);
    T('text',{x:(x1+x2)/2,y:(y1+y2)/2-6,'text-anchor':'middle'},g,label);
  }
  function hold(x,y1,y2,label){S('rect',{x:x-5,y:y1,width:10,height:y2-y1,rx:3,fill:'var(--blue-wash)',stroke:'var(--blue)','stroke-width':1},svg);if(label)T('text',{x:x+(x===RX?12:-12),y:(y1+y2)/2+4,'text-anchor':x===RX?'start':'end','class':'ax'},svg,label);}
  function band(y1,y2,label){S('rect',{x:LX,y:y1,width:RX-LX,height:y2-y1,fill:'var(--blue-wash)','fill-opacity':0.45},svg);T('text',{x:(LX+RX)/2,y:y2-8,'text-anchor':'middle','class':'ax'},svg,label);}
  function news(y,side){var x=side==='L'?LX:RX;S('circle',{cx:x,cy:y,r:5.5,fill:'var(--ch2)',stroke:'var(--sheet)','stroke-width':2},svg);T('text',{x:x+(side==='L'?-12:12),y:y+4,'text-anchor':side==='L'?'end':'start','class':'mk'},svg,'new data');}
  function draw(k){
    clearSvg(svg,W,H);
    var L=k==='hook'?'Your server':'Client',R=k==='hook'?'Provider (e.g. Stripe)':'Server';
    [[LX,L],[RX,R]].forEach(function(p){S('line',{x1:p[0],x2:p[0],y1:TOP-12,y2:BOT,stroke:'var(--rule)','stroke-width':2},svg);
      var g=S('g',{'class':'node'+(p[0]===LX&&k!=='hook'?' client':'')},svg);S('rect',{'class':'shape',x:p[0]-90,y:8,width:180,height:36,rx:p[0]===LX&&k!=='hook'?14:4},g);T('text',{'class':'t',x:p[0],y:31,'text-anchor':'middle'},g,p[1]);});
    T('text',{x:24,y:TOP+4,'class':'ax'},svg,'time');S('path',{d:'M34 '+(TOP+12)+' V'+(BOT-6),stroke:'var(--ink-3)','stroke-width':1.2,fill:'none','marker-end':'url(#ah)'},svg);
    if(k==='poll'){news(132,'R');news(240,'R');
      [[68,0],[124,0],[180,1],[236,0],[292,1]].forEach(function(p){msg(p[0],p[0]+10,true,'any news?','');msg(p[0]+16,p[0]+26,false,p[1]?'here is the data':'nothing new',p[1]?'blue':'faint');});}
    else if(k==='long'){news(140,'R');news(250,'R');
      msg(68,78,true,'any news? (I will wait)','');hold(RX,80,140,'held open');msg(140,150,false,'here is the data','blue');
      msg(160,170,true,'any news?','');hold(RX,172,250,'held open');msg(250,260,false,'here is the data','blue');
      msg(270,280,true,'any news?','');hold(RX,282,BOT-4,'held open');}
    else if(k==='sse'){news(146,'R');news(254,'R');
      msg(68,78,true,'GET /events','');msg(84,94,false,'200, stream stays open','');band(100,BOT-2,'one HTTP connection stays open');
      msg(146,156,false,'event: data','blue');msg(200,210,false,': keep-alive comment','faint');msg(254,264,false,'event: data','blue');}
    else if(k==='ws'){news(146,'R');news(268,'R');
      msg(68,78,true,'GET, Upgrade: websocket','');msg(84,94,false,'101 Switching Protocols','');band(100,BOT-2,'full duplex connection, either side may send');
      msg(146,156,false,'message','blue');msg(206,216,true,'message','');msg(268,278,false,'message','blue');}
    else if(k==='hook'){news(140,'R');news(222,'R');
      msg(64,74,true,'register https://you.example/hooks','');msg(80,90,false,'200','faint');
      msg(140,150,false,'POST event evt_1','blue');msg(156,166,true,'200 OK','faint');
      msg(222,232,false,'POST event evt_2','hot');T('text',{x:LX-12,y:236,'text-anchor':'end','class':'mk',style:'fill:var(--red)'},svg,'you time out');
      msg(286,296,false,'retry evt_2, same ID','blue');msg(302,312,true,'200 OK','faint');}
    $('#cm-how').textContent=TXT[k][0];$('#cm-cost').textContent=TXT[k][1];
  }
  segInit('cm-tabs',draw);draw('poll');
});

/* ---------- I.8 transfer times ---------- */
mod('transfer',function(){
  var svg=$('#tx-svg'),LINKS=[['10 Mbps','slow mobile',1e7],['100 Mbps','home broadband',1e8],['1 Gbps','server network card',1e9],['10 Gbps','data center link',1e10],['100 Gbps','backbone link',1e11]];
  function render(){
    var amt=Math.max(0,parseFloat($('#tx-n').value)||0),unit=+$('#tx-u').value,bytes=amt*unit,uName=$('#tx-u').selectedOptions[0].textContent;
    var secs=LINKS.map(function(l){return bytes*8/l[2];});
    var W=860,X0=200,X1=740,RH=40,TOP=16,H=TOP+LINKS.length*RH+40;clearSvg(svg,W,H);
    if(bytes<=0){T('text',{x:X0,y:60,'class':'rl'},svg,'Enter an amount of data to see transfer times.');$('#tx-note').textContent='';return;}
    var lo=Math.floor(Math.log10(Math.min.apply(null,secs))),hi=Math.ceil(Math.log10(Math.max.apply(null,secs)));if(hi===lo)hi++;
    function x(s){return X0+(X1-X0)*(Math.log10(s)-lo)/(hi-lo);}
    for(var e=lo;e<=hi;e++){S('line',{x1:x(Math.pow(10,e)),x2:x(Math.pow(10,e)),y1:TOP-4,y2:TOP+LINKS.length*RH,'class':'grid'},svg);T('text',{x:x(Math.pow(10,e)),y:TOP+LINKS.length*RH+18,'text-anchor':'middle','class':'ax'},svg,fmtSecs(Math.pow(10,e)));}
    LINKS.forEach(function(l,i){var y=TOP+i*RH,s=secs[i];
      T('text',{x:X0-12,y:y+RH/2+4,'text-anchor':'end','class':'rl'},svg,l[0]+'  ('+l[1]+')');
      S('path',{d:barH(X0,y+RH/2-10,Math.max(2,x(s)-X0),20),'class':'c1'},svg);
      T('text',{x:Math.max(X0+2,x(s))+6,y:y+RH/2+4,'class':'vl'},svg,fmtSecs(s));
      var hit=S('rect',{x:0,y:y,width:W,height:RH,'class':'bar-hit'},svg);
      bindTip(hit,function(){return [fmtSecs(s),nf.format(amt)+' '+uName+' over '+l[0],'about '+fmtSecs(s/0.8)+' at a realistic 80% of line rate'];});
    });
    $('#tx-note').textContent='Moving '+nf.format(amt)+' '+uName+' takes '+fmtSecs(secs[1])+' on home broadband and '+fmtSecs(secs[3])+' over a 10 Gbps link, before overhead. At petabyte scale, companies ship physical disks instead; AWS Snowball exists for exactly this.';
  }
  ['tx-n','tx-u'].forEach(function(id){document.getElementById(id).addEventListener('input',render);document.getElementById(id).addEventListener('change',render);});
  render();
});

/* ---------- URL shortener: calculator ---------- */
mod('url-guides',function(){
  if(!document.getElementById('ug-calc-plate'))return;
  /* calculator */
  var P={
    us:{n:100e6/30,r:100e6/30*100,p:2,t:12e9,b:500,h:20,note:'Starting values are the estimates at the top of this case study. The cache figure uses the 80/20 rule on a day of redirects.'}
  };
  var F={n:'ug-new',r:'ug-red',p:'ug-peak',t:'ug-rec',b:'ug-bytes',h:'ug-hot'};
  function num(k){var v=parseFloat(document.getElementById(F[k]).value);return isFinite(v)&&v>=0?v:0;}
  function calc(){
    var n=num('n'),r=num('r'),p=Math.max(1,num('p')),t=Math.max(1,num('t')),b=num('b'),h=Math.min(100,num('h'));
    var ws=n/86400,rs=r/86400,ps=rs*p,st=t*b,code=Math.max(1,Math.ceil(Math.log(t)/Math.log(62)-1e-9)),cache=h/100*r*b,redis=Math.max(1,Math.ceil(ps/100000));
    $('#ug-o-w').textContent=human(ws)+'/s';$('#ug-o-r').textContent=human(rs)+'/s';$('#ug-o-p').textContent=human(ps)+'/s';
    $('#ug-o-s').textContent=bytes(st);$('#ug-o-c').innerHTML=code+' chars <small>62^'+code+' ≈ '+human(Math.pow(62,code))+'</small>';$('#ug-o-m').textContent=bytes(cache);
    var imp=[];
    if(ps>100000)imp.push(['r','Reads','A peak of '+human(ps)+' redirects per second is more than one SSD’s ≈ 100K random reads. Serve redirects from memory: about '+redis+' Redis nodes at 100K ops/s each, plus a CDN for the hottest links.']);
    else if(ps>10000)imp.push(['a','Reads','A peak of '+human(ps)+' redirects per second fits one Redis node (100K+ ops/s). Add a replica for failover; the database only sees cache misses.']);
    else imp.push(['g','Reads','A peak of '+human(ps)+' redirects per second is light. One database with an index could serve it; a cache still cuts latency.']);
    if(ws>1000)imp.push(['a','Writes',human(ws)+' writes per second is real load for one primary. Hand out IDs in batches of 1,000 so the counter sees only '+human(ws/1000)+' calls per second.']);
    else imp.push(['g','Writes',human(ws)+' writes per second is trivial for one primary; a Redis counter handing out batches of 1,000 IDs is barely touched.']);
    if(st>60e12)imp.push(['r','Storage',bytes(st)+' exceeds the largest single machine’s ≈ 60 TB of local SSD. Partition the table by short code.']);
    else if(st>5e12)imp.push(['a','Storage',bytes(st)+' fits on one large machine but is heavy to back up and restore. Plan partitioning by short code before you reach it.']);
    else imp.push(['g','Storage',bytes(st)+' fits on one database server. Replicate it for availability; do not shard it for size.']);
    imp.push(['b','Code',code+' base62 characters cover '+human(t)+' URLs (62^'+code+' ≈ '+human(Math.pow(62,code))+'). Many designs add one character for headroom.']);
    imp.push([cache>512e9?'a':'g','Cache','Caching '+h+'% of a day’s redirects at '+b+' B each takes about '+bytes(cache)+(cache>512e9?', more than one large server’s 512 GiB, so spread it across several Redis nodes.':', which fits in one Redis server.')]);
    $('#ug-imp').innerHTML=imp.map(function(x){return '<li><span class="tag '+x[0]+'">'+x[1]+'</span><span>'+esc(x[2])+'</span></li>';}).join('');
  }
  function preset(k){var q=P[k];document.getElementById(F.n).value=Math.round(q.n);document.getElementById(F.r).value=Math.round(q.r);document.getElementById(F.p).value=q.p;
    document.getElementById(F.t).value=q.t;document.getElementById(F.b).value=q.b;document.getElementById(F.h).value=q.h;$('#ug-pnote').textContent=q.note;calc();}
  Object.keys(F).forEach(function(k){var el=document.getElementById(F[k]);el.addEventListener('input',calc);});
  preset('us');
});
})();

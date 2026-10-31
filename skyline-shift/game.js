(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const overlay=$('overlay'),mainBtn=$('mainBtn'),pauseBtn=$('pauseBtn'),restartBtn=$('restartBtn');
let state='ready',score=0,energy=0,elapsed=0,speed=250,spawn=0,last=0,objects=[],particles=[],player={lane:1,y:0,from:1,move:0},keys={},sound=true,audio=null,nearBonus=0,rafId=0;
let shield=false,nitroTimer=0,magnetTimer=0,screenShake=0;
let best=Number(localStorage.getItem('skylineBest')||0);$('bestTop').textContent=best;
const W=900,H=600,lanes=[300,450,600];
function resize(){canvas.width=900;canvas.height=600;}
function audioCtx(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A();}if(audio?.state==='suspended')audio.resume();}
function beep(freq=500,dur=.07,type='sine',vol=.04){if(!sound)return;audioCtx();if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}
function reset(){score=0;energy=0;elapsed=0;speed=250;spawn=.6;objects=[];particles=[];nearBonus=0;shield=false;nitroTimer=0;magnetTimer=0;screenShake=0;player={lane:1,y:0,from:1,move:0};updateHud();}
function start(){cancelAnimationFrame(rafId);audioCtx();reset();state='playing';overlay.classList.add('hidden');$('pauseTag').hidden=true;pauseBtn.disabled=false;pauseBtn.textContent='Ⅱ PAUSE';last=performance.now();rafId=requestAnimationFrame(loop);}
function end(){state='over';pauseBtn.disabled=true;best=Math.max(best,score);localStorage.setItem('skylineBest',best);$('bestTop').textContent=best;$('overTag').textContent='RUN COMPLETE';$('overTitle').innerHTML='CITY RECORD<br><em>'+score.toString().padStart(5,'0')+'</em>'; $('overText').textContent='You collected '+energy+' energy orbs and travelled '+Math.floor(elapsed*12)+' metres. '+(score>=best?'New personal best!':'Can you beat your best of '+best+'?');mainBtn.innerHTML='RUN IT BACK <b>↗</b>';overlay.classList.remove('hidden');beep(170,.35,'sawtooth',.05);}
function pause(){if(state==='playing'){state='paused';cancelAnimationFrame(rafId);pauseBtn.textContent='▶ RESUME';$('pauseTag').hidden=false;}else if(state==='paused'){state='playing';pauseBtn.textContent='Ⅱ PAUSE';$('pauseTag').hidden=true;last=performance.now();rafId=requestAnimationFrame(loop);}}
function move(dir){if(state!=='playing')return;const next=Math.max(0,Math.min(2,player.lane+dir));if(next!==player.lane){player.from=player.lane;player.lane=next;player.move=0;beep(280+next*80,.045,'triangle',.018);}}
function spawnObject(){
  const lane=Math.floor(Math.random()*3);
  const rand=Math.random();
  let type='gate';
  if(rand < 0.52) type='orb';
  else if(rand < 0.60) type='shield';
  else if(rand < 0.68) type='nitro';
  else if(rand < 0.76) type='magnet';
  objects.push({lane,y:-45,type,passed:false,phase:Math.random()*6});
}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=50+Math.random()*180;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.4,max:.85,color,size:2+Math.random()*4});}}
function update(dt){
  elapsed+=dt;
  if(nitroTimer>0){ nitroTimer-=dt; speed=620; }
  else { speed=Math.min(540,250+elapsed*7); }
  if(magnetTimer>0) magnetTimer-=dt;

  score+=Math.floor(dt*(nitroTimer>0?25:10));
  spawn-=dt;
  if(spawn<=0){spawnObject();spawn=Math.max(.36,1.05-elapsed*.008)+Math.random()*.22;}
  player.move=Math.min(1,player.move+dt*9);

  for(const o of objects){
    o.y+=speed*dt;
    // Magnet attraction
    if(magnetTimer>0 && o.type==='orb' && !o.passed && o.y>300 && o.y<550){
      o.lane = player.lane;
    }

    if(!o.passed&&o.y>470&&o.lane!==player.lane){
      o.passed=true;
      if(o.type==='gate'){score+=25;nearBonus++;burst(lanes[o.lane],470,'#ff477e',5);beep(760,.05,'sine',.015);}
    }
    if(!o.passed&&o.y>480&&o.y<555&&o.lane===player.lane){
      o.passed=true;
      if(o.type==='gate'){
        if(nitroTimer>0){
          score+=150;
          burst(lanes[o.lane],o.y,'#facc15',25);
          beep(880,.08,'triangle',.05);
          screenShake=8;
          continue;
        }
        if(shield){
          shield=false;
          burst(lanes[o.lane],o.y,'#38bdf8',25);
          beep(440,.15,'triangle',.05);
          screenShake=10;
          continue;
        }
        screenShake=20;
        end();
        return;
      } else if(o.type==='shield'){
        shield=true;
        burst(lanes[o.lane],o.y,'#38bdf8',20);
        beep(880,.12,'sine',.05);
      } else if(o.type==='nitro'){
        nitroTimer=4.5;
        burst(lanes[o.lane],o.y,'#facc15',25);
        beep(1046,.15,'sawtooth',.06);
      } else if(o.type==='magnet'){
        magnetTimer=6.0;
        burst(lanes[o.lane],o.y,'#a855f7',20);
        beep(784,.12,'sine',.05);
      } else {
        energy++;
        score+=100*Math.min(5,1+Math.floor(energy/5));
        burst(lanes[o.lane],o.y,'#43f4e5',17);
        beep(620+Math.min(energy,10)*35,.09,'triangle',.045);
      }
    }
  }
  objects=objects.filter(o=>o.y<H+60);
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  if(screenShake>0) screenShake*=0.88;
  updateHud();
}
function updateHud(){
  $('score').textContent=String(score).padStart(5,'0');
  $('combo').textContent='x'+Math.min(5,1+Math.floor(energy/5)) + (shield?' 🛡️':'') + (nitroTimer>0?' ⚡':'') + (magnetTimer>0?' 🧲':'');
  $('time').textContent=Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
  $('missionText').textContent=energy>=15?'Mission complete — keep going!':'Collect '+Math.max(0,15-energy)+' more energy orbs';
  $('missionProgress').style.width=Math.min(100,energy/15*100)+'%';
}
function draw(){
  ctx.save();
  if(screenShake>0.5){
    ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);
  }
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0b1530');
  bg.addColorStop(1,'#080d1c');
  ctx.fillStyle=bg;
  ctx.fillRect(0,0,W,H);

  // skyline silhouettes
  for(let i=0;i<16;i++){
    const x=i*62-10,h=65+(i*37%95);
    ctx.fillStyle=i%2?'#101d38':'#0d1931';
    ctx.fillRect(x,100-h,43,h+100);
    for(let yy=115-h;yy<95;yy+=17)for(let xx=x+8;xx<x+36;xx+=13){
      ctx.fillStyle=(i+yy+xx)%3?'#1e4160':'#25475d';
      ctx.fillRect(xx,yy,4,6);
    }
  }
  ctx.fillStyle='#0b1326';ctx.beginPath();ctx.moveTo(190,0);ctx.lineTo(710,0);ctx.lineTo(850,600);ctx.lineTo(50,600);ctx.closePath();ctx.fill();
  // perspective lane lines
  for(let i=0;i<4;i++){
    const x=190+i*173;
    ctx.strokeStyle=i===0||i===3?'#29405d':'#233958';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(450+(x-450)*.58,0);
    ctx.lineTo(x,600);
    ctx.stroke();
  }
  const offset=(elapsed*speed*.7)%80;
  for(let y=-80+offset;y<600;y+=80){
    ctx.strokeStyle='#1b3150';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(450-120*(y/600),y);ctx.lineTo(450+120*(y/600),y);ctx.stroke();
  }
  // horizon glow
  const glow=ctx.createRadialGradient(450,110,5,450,110,330);
  glow.addColorStop(0, nitroTimer>0?'#facc1540':'#1b5d7850');
  glow.addColorStop(1,'#1b5d7800');
  ctx.fillStyle=glow;ctx.fillRect(100,0,700,350);

  // Objects
  for(const o of objects){
    const x=lanes[o.lane],y=o.y;
    if(o.type==='orb'){
      ctx.save();ctx.translate(x,y);ctx.rotate(elapsed*1.8);ctx.shadowBlur=22;ctx.shadowColor='#43f4e5';ctx.strokeStyle='#43f4e5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(14,0);ctx.lineTo(0,17);ctx.lineTo(-14,0);ctx.closePath();ctx.stroke();ctx.fillStyle='#bafff8';ctx.fillRect(-3,-3,6,6);ctx.restore();
    } else if(o.type==='shield'){
      ctx.save();ctx.translate(x,y);ctx.shadowBlur=18;ctx.shadowColor='#38bdf8';ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🛡️',0,0);ctx.restore();
    } else if(o.type==='nitro'){
      ctx.save();ctx.translate(x,y);ctx.shadowBlur=18;ctx.shadowColor='#facc15';ctx.fillStyle='#facc15';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⚡',0,0);ctx.restore();
    } else if(o.type==='magnet'){
      ctx.save();ctx.translate(x,y);ctx.shadowBlur=18;ctx.shadowColor='#a855f7';ctx.fillStyle='#a855f7';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🧲',0,0);ctx.restore();
    } else {
      ctx.save();ctx.translate(x,y);ctx.shadowBlur=18;ctx.shadowColor='#ff477e';ctx.fillStyle='#541c43';ctx.strokeStyle='#ff477e';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-48,-17,96,34,5);ctx.fill();ctx.stroke();ctx.fillStyle='#ff477e';ctx.fillRect(-40,-5,80,10);ctx.fillStyle='#ffd6e4';ctx.fillRect(-7,-3,14,6);ctx.restore();
    }
  }

  // Particles
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;

  // Courier hoverboard
  const x=lanes[player.lane],y=495+Math.sin(elapsed*8)*3;
  ctx.save();ctx.translate(x,y);
  ctx.shadowBlur=nitroTimer>0?35:25;
  ctx.shadowColor=nitroTimer>0?'#facc15':'#43f4e5';
  ctx.fillStyle=nitroTimer>0?'#facc15':'#43f4e5';
  ctx.beginPath();ctx.ellipse(0,23,39,7,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#152d48';
  ctx.strokeStyle=nitroTimer>0?'#facc15':'#75fff3';
  ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-42);ctx.lineTo(22,-8);ctx.lineTo(15,17);ctx.lineTo(-15,17);ctx.lineTo(-22,-8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#f5fbff';ctx.beginPath();ctx.arc(0,-24,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=nitroTimer>0?'#facc15':'#43f4e5';ctx.fillRect(-5,-26,10,4);

  // Shield bubble
  if(shield){
    ctx.strokeStyle='#38bdf8';
    ctx.shadowColor='#38bdf8';
    ctx.shadowBlur=20;
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,-12,42,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();

  // Edge labels
  ctx.fillStyle='#45617e';ctx.font='10px monospace';ctx.fillText('NORTH DISTRICT',24,28);ctx.textAlign='right';ctx.fillText('GRID SPEED '+Math.floor(speed),876,28);ctx.textAlign='left';
  ctx.restore();
}
function loop(now){if(state!=='playing')return;const dt=Math.min(.035,(now-last)/1000);last=now;update(dt);draw();if(state==='playing')rafId=requestAnimationFrame(loop);}
mainBtn.addEventListener('click',start);pauseBtn.addEventListener('click',pause);restartBtn.addEventListener('click',()=>{if(state==='playing'||state==='paused'){start();}else{reset();state='ready';$('overTag').textContent='READY, COURIER?';$('overTitle').innerHTML='THE GRID<br><em>IS YOURS.</em>';$('overText').textContent='Switch between three lanes. Collect cyan energy orbs, power up with Shields & Nitro, and dodge security gates!';mainBtn.innerHTML='START RUN <b>↗</b>';overlay.classList.remove('hidden');$('pauseTag').hidden=true;pauseBtn.disabled=true;draw();}});
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').innerHTML='♫ <span>'+(sound?'ON':'OFF')+'</span>';if(sound)beep();});
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','ArrowUp','ArrowDown','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);if((e.key===' '||e.key.toLowerCase()==='p'||e.key==='Escape')&&(state==='playing'||state==='paused'))pause();if(e.key==='Enter'&&(state==='ready'||state==='over'))start();});
let sx=0,sy=0;canvas.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else{const r=canvas.getBoundingClientRect();move(e.clientX<r.left+r.width/2?-1:1);}});
window.addEventListener('resize',resize);resize();draw();
})();
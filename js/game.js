import { THREE, scene, camera, renderer, controls, raycaster, mouse } from './three-setup.js';
import { dom } from './dom.js';
import { LANG, T } from './i18n.js';
import { SECRET_BIN, SECRET2_BIN, fromBin } from './secrets.js';
import { ri, pick, shuffle, easeOutBack, easeInOut } from './utils.js';
import { progress, save, exportCode, importCode } from './progress.js';
import { levelConfig, PHRASES } from './levelconfig.js';
import { initAppleAssets, createApple, getAppleMat, orchard, clearOrchard, fitOrchard, buildOrchard } from './apple.js';
import { evalChain, makeMain, makeMissing, makeFind, makeTexture } from './rounds.js';
import AudioFX from './AudioManager.js';

addEventListener('pointerdown',()=>AudioFX.unlock());
addEventListener('keydown',()=>AudioFX.unlock());

const MAXLVL=20;
let currentLevel=1,cfg=null,blocks=[],blanks=[],anims=[],particles=[];
let curRound=null,selected=[],roundIndex=0,totalRounds=0;
let score=0,combo=0,wrongCount=0,penalty=0,hintsLeft=3,hintsUsed=0,startTime=0,playing=false;
let paused=false,pauseStart=0;
let codeUsedRespect=false,codeUsedHumble=false,verifyUses=3,verifyTimer=0;
let cubeGroup=null,apple=null,shadowCatcher=null,dot=null,dotBlock=null,dotActive=false;
let camAnim=null,celebToken=0;
const keys={};
const clock=new THREE.Clock();
const sph=new THREE.Spherical();

function pauseGame(){ if(playing&&!paused){paused=true;pauseStart=performance.now();} }
function resumeGame(){ if(paused){startTime+=performance.now()-pauseStart;paused=false;} }

function clearLevel(){
    celebToken++;paused=false;
    if(cubeGroup){scene.remove(cubeGroup);cubeGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
    if(apple){scene.remove(apple);apple=null;}
    if(shadowCatcher){scene.remove(shadowCatcher);shadowCatcher=null;}
    if(dot){scene.remove(dot);dot=null;}
    clearOrchard();
    cubeGroup=null;blocks=[];blanks=[];anims=[];particles=[];selected=[];camAnim=null;
}
function buildLevel(lv){
    clearLevel();
    currentLevel=lv;cfg=levelConfig(lv);
    roundIndex=0;totalRounds=cfg.R;score=0;combo=0;wrongCount=0;penalty=0;
    hintsLeft=3+(progress.records||0);hintsUsed=0;
    codeUsedRespect=false;codeUsedHumble=false;verifyUses=3;
    playing=true;startTime=performance.now();dotActive=false;
    dom.hud.classList.remove('dim');
    dom.hintBtn.classList.remove('off');dom.hintCount.textContent=hintsLeft;
    dom.codeBtn.classList.remove('off');dom.codeBtn.textContent=T[LANG].code;
    dom.verifyBtn.classList.remove('off');dom.verifyBtn.textContent=T[LANG].verify;dom.verifyCount.textContent=verifyUses;
    dom.verifyPanel.classList.remove('show');
    dom.codeStack.style.display=lv>=15?'flex':'none';
    dom.verifyStack.style.display=lv>=15?'flex':'none';
    dom.advStack.style.display=lv>=18?'flex':'none';
    dom.hudLevel.textContent='LEVEL '+lv;dom.progressFill.style.width='0%';updateScore();
    cubeGroup=new THREE.Group();scene.add(cubeGroup);
    const pos=[];
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)
        if(!(x===0&&y===0&&z===0))pos.push([x,y,z]);
    shuffle(pos);
    const sp=1.3;
    for(let i=0;i<pos.length;i++){
        const p=new THREE.Vector3(pos[i][0]*sp,pos[i][1]*sp,pos[i][2]*sp);
        if(i<cfg.B){
            const num=ri(cfg.vmin,cfg.vmax);
            const tex=makeTexture(num);
            const mats=[];for(let k=0;k<6;k++)mats.push(new THREE.MeshStandardMaterial({map:tex,roughness:.3,metalness:.15}));
            const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mats);
            m.position.copy(p);m.userData={num,consumed:false,base:p.clone()};
            cubeGroup.add(m);blocks.push(m);
        } else {
            const m=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),
                new THREE.MeshStandardMaterial({color:0x8888aa,transparent:true,opacity:.07}));
            m.position.copy(p);cubeGroup.add(m);blanks.push(m);
        }
    }
    dot=new THREE.Mesh(new THREE.SphereGeometry(.13,16,16),new THREE.MeshBasicMaterial({color:0xff2222}));
    scene.add(dot);dot.visible=false;
    startRound();
    if(curRound&&curRound.picked.length){dotBlock=curRound.picked[0];dotActive=true;dot.visible=true;}
    AudioFX.levelStart();
}

function available(){return blocks.filter(b=>!b.userData.consumed);}
function startRound(){
    dom.verifyPanel.classList.remove('show');
    const avail=available();
    if(roundIndex>=totalRounds||avail.length<2){finish();return;}
    let type=pick(cfg.mix),round=null;
    if(type==='FIND')round=makeFind(avail);
    if(!round&&type==='MISSING'&&avail.length>=2)round=makeMissing(avail);
    if(!round){
        let opsCount=Math.max(1,Math.min(ri(cfg.opsRange[0],cfg.opsRange[1]),avail.length-1));
        round=makeMain(avail,opsCount,cfg.opsSet);
    }
    curRound=round;selected=[];updateEq();
}

function updateEq(){
    const r=curRound;if(!r){dom.hudEq.textContent='';updateCalc();return;}
    const s=selected.map(b=>b.userData.num);
    const f=i=>s[i]!==undefined?s[i]:'?';
    let txt='';
    if(r.type==='MAIN'){
        for(let i=0;i<r.k;i++){txt+=f(i);if(i<r.ops.length)txt+=' '+r.ops[i]+' ';}
        txt+=' = '+r.target;
    }
    else if(r.type==='MISSING')txt=`${r.given} ${r.op} ${f(0)} = ${r.target}`;
    else if(r.type==='FIND')txt=`${r.givenA} ${r.op} ${r.givenB} = ${f(0)}`;
    dom.hudEq.textContent=txt;
    updateCalc();
}
function updateCalc(){
    if(curRound&&curRound.type==='MAIN'&&curRound.k>=3&&selected.length>=2){
        const vals=selected.map(b=>b.userData.num);
        let expr=String(vals[0]),v=vals[0],broken=false;
        for(let i=1;i<vals.length;i++){
            const op=curRound.ops[i-1];
            expr+=' '+op+' '+vals[i];
            if(op==='+')v+=vals[i];else if(op==='-')v-=vals[i];else if(op==='×')v*=vals[i];
            else{ if(vals[i]===0){broken=true;break;} v=v/vals[i]; }
        }
        dom.calcVal.textContent=expr+' = '+(broken?'?':(Number.isInteger(v)?v:+v.toFixed(2)));
        dom.hudCalc.classList.add('show');
    } else dom.hudCalc.classList.remove('show');
}
function evalRound(vals){
    const r=curRound;
    if(r.type==='MAIN'){const res=evalChain(vals,r.ops);return res.ok&&res.v===r.target;}
    if(r.type==='MISSING'||r.type==='FIND')return vals[0]===r.needed;
    return false;
}
function setGlow(b,on,color){
    b.material.forEach(m=>{m.emissive=new THREE.Color(on?(color||0xffd700):0x000000);m.emissiveIntensity=on?0.55:0;});
}

renderer.domElement.addEventListener('click',e=>{
    if(!playing||paused)return;
    mouse.x=(e.clientX/innerWidth)*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(blocks.filter(b=>!b.userData.consumed));
    if(!hit.length)return;
    const mesh=hit[0].object;
    if(dotActive&&mesh===dotBlock){dotActive=false;dot.visible=false;}
    const idx=selected.indexOf(mesh);
    if(idx>=0){selected.splice(idx,1);setGlow(mesh,false,0x00f5d4);AudioFX.blockDeselect();updateEq();return;}
    selected.push(mesh);setGlow(mesh,true,0x00f5d4);AudioFX.blockSelect();updateEq();
    if(selected.length===curRound.k){
        if(evalRound(selected.map(b=>b.userData.num)))roundSuccess();else roundFail();
    }
});
function roundSuccess(){
    const k=curRound.k;
    score+=100*k+combo*25;combo++;
    selected.forEach(b=>{b.userData.consumed=true;setGlow(b,false);
        anims.push({mesh:b,start:performance.now(),from:b.position.clone(),to:b.position.clone().multiplyScalar(.08)});});
    selected=[];roundIndex++;
    dom.progressFill.style.width=(roundIndex/totalRounds*100)+'%';
    updateScore();updateCalc();flashEq('good');AudioFX.roundSuccess();
    if(roundIndex===1){dotActive=false;if(dot)dot.visible=false;}
    if(roundIndex>=totalRounds){setTimeout(finish,600);}else setTimeout(startRound,380);
}
function roundFail(){
    wrongCount++;combo=0;penalty+=3;
    selected.forEach(b=>{setGlow(b,false);shake(b);});
    selected=[];updateEq();flashEq('bad');AudioFX.roundFail();
}
function flashEq(cls){dom.hudEq.classList.add(cls);setTimeout(()=>dom.hudEq.classList.remove(cls),400);}
function shake(b){
    const bx=b.position.x,st=performance.now();
    const anim=()=>{const e=performance.now()-st;
        if(e<320){b.position.x=bx+Math.sin(e*.08)*.06;requestAnimationFrame(anim);}else b.position.x=bx;};
    anim();
}
function updateScore(){dom.hudScore.textContent=score;}
function timePopup(text){
    const el=document.createElement('div');el.className='time-pop';el.textContent=text;
    document.body.appendChild(el);setTimeout(()=>el.remove(),1100);
}

dom.hintBtn.addEventListener('click',()=>{
    if(!playing||paused||hintsLeft<=0||!curRound)return;
    AudioFX.button();
    hintsLeft--;hintsUsed++;penalty+=10;
    dom.hintCount.textContent=hintsLeft;
    if(hintsLeft===0)dom.hintBtn.classList.add('off');
    timePopup('+10s');AudioFX.hint();
    const t=curRound.picked.find(b=>!b.userData.consumed)||curRound.picked[0];
    if(t){setGlow(t,true);setTimeout(()=>{if(!t.userData.consumed)setGlow(t,false);},1000);}
});

dom.verifyBtn.addEventListener('click',()=>{
    if(!playing||paused||verifyUses<=0||currentLevel<15||!curRound)return;
    if(selected.length===0)return;
    verifyUses--;dom.verifyCount.textContent=verifyUses;
    if(verifyUses===0)dom.verifyBtn.classList.add('off');
    AudioFX.button();
    const goodVals=curRound.picked.map(p=>p.userData.num);
    dom.verifyPanel.innerHTML='';
    selected.forEach(b=>{
        const ok=goodVals.includes(b.userData.num);
        const item=document.createElement('div');item.className='vitem';
        item.innerHTML='<div class="vnum">'+b.userData.num+'</div><div class="mark '+(ok?'tick':'cross')+'"></div>';
        dom.verifyPanel.appendChild(item);
    });
    dom.verifyPanel.classList.add('show');
    clearTimeout(verifyTimer);
    verifyTimer=setTimeout(()=>dom.verifyPanel.classList.remove('show'),2000);
});

dom.codeBtn.addEventListener('click',()=>{
    if(!playing||paused||(codeUsedRespect&&codeUsedHumble)||currentLevel<15)return;
    AudioFX.button();
    dom.codeTitle.textContent=T[LANG].enter;
    dom.codeOk.textContent=T[LANG].ok;dom.codeRetry.textContent=T[LANG].retry;dom.codeExit.textContent=T[LANG].exit;
    dom.codeMsg.textContent='';dom.codeRetry.style.display='none';dom.codeInput.value='';
    pauseGame();
    dom.codeModal.classList.add('active');
    setTimeout(()=>dom.codeInput.focus(),60);
});
function closeCode(){ dom.codeModal.classList.remove('active'); resumeGame(); }
dom.codeOk.addEventListener('click',()=>{
    const val=dom.codeInput.value.trim().toLowerCase();
    if(val===fromBin(SECRET_BIN)){
        if(codeUsedRespect){dom.codeMsg.textContent=T[LANG].used;dom.codeRetry.style.display='inline-block';return;}
        codeUsedRespect=true;
        hintsLeft+=3;dom.hintCount.textContent=hintsLeft;
        if(hintsLeft>0)dom.hintBtn.classList.remove('off');
        timePopup(T[LANG].plus3);AudioFX.record();
    } else if(val===fromBin(SECRET2_BIN)){
        if(codeUsedHumble){dom.codeMsg.textContent=T[LANG].used;dom.codeRetry.style.display='inline-block';return;}
        codeUsedHumble=true;
        verifyUses=3;dom.verifyCount.textContent=3;dom.verifyBtn.classList.remove('off');
        timePopup(T[LANG].plusV);AudioFX.record();
    } else {
        dom.codeMsg.textContent=T[LANG].wrong;dom.codeRetry.style.display='inline-block';
        AudioFX.roundFail();return;
    }
    if(codeUsedRespect&&codeUsedHumble)dom.codeBtn.classList.add('off');
    closeCode();
});
dom.codeRetry.addEventListener('click',()=>{
    dom.codeMsg.textContent='';dom.codeInput.value='';dom.codeRetry.style.display='none';
    dom.codeInput.focus();AudioFX.button();
});
dom.codeExit.addEventListener('click',()=>{AudioFX.button();closeCode();});

dom.advBtn.addEventListener('click',()=>{
    if(!playing||paused||currentLevel<18)return;
    AudioFX.button();pauseGame();
    if(hintsLeft<2){
        dom.advMsg.textContent=T[LANG].need2(hintsLeft);
        dom.advYes.style.display='none';dom.advNo.textContent=T[LANG].ok;
    } else {
        dom.advMsg.textContent=T[LANG].confirm;
        dom.advYes.style.display='inline-block';
        dom.advYes.textContent=T[LANG].yes;dom.advNo.textContent=T[LANG].no;
    }
    dom.advModal.classList.add('active');
});
function closeAdv(){ dom.advModal.classList.remove('active'); resumeGame(); }
dom.advYes.addEventListener('click',()=>{
    if(hintsLeft<2){closeAdv();return;}
    hintsLeft-=2;hintsUsed++;
    dom.hintCount.textContent=hintsLeft;
    if(hintsLeft===0)dom.hintBtn.classList.add('off');
    AudioFX.hint();
    const targets=curRound?curRound.picked.filter(b=>!b.userData.consumed):[];
    targets.forEach(b=>setGlow(b,true));
    setTimeout(()=>{targets.forEach(b=>{if(!b.userData.consumed)setGlow(b,false);});},3000);
    closeAdv();
});
dom.advNo.addEventListener('click',()=>{AudioFX.button();closeAdv();});

function finish(){
    if(!playing)return;
    playing=false;if(dot)dot.visible=false;
    dom.hud.classList.add('dim');
    controls.enabled=false;controls.autoRotate=false;
    const elapsed=(performance.now()-startTime)/1000,total=elapsed+penalty,par=cfg.par;
    const timeBonus=Math.max(0,Math.round((par*2-total)*10));
    const perfect=wrongCount===0?500:0,noHint=hintsUsed===0?300:0;
    const finalScore=score+timeBonus+perfect+noHint;
    let stars=1;
    if(wrongCount===0&&total<=par*1.2)stars=3;
    else if(wrongCount<=1&&total<=par*2)stars=2;
    const prevBest=progress.bestTime[currentLevel];
    const beatRecord=prevBest!==undefined&&total<prevBest;
    if(beatRecord)progress.records=(progress.records||0)+1;
    progress.wins=(progress.wins||0)+1;
    progress.unlocked=Math.min(MAXLVL,Math.max(progress.unlocked,currentLevel+1));
    progress.stars[currentLevel]=Math.max(progress.stars[currentLevel]||0,stars);
    if(!prevBest||total<prevBest)progress.bestTime[currentLevel]=+total.toFixed(1);
    progress.bestScore[currentLevel]=Math.max(progress.bestScore[currentLevel]||0,finalScore);
    save();
    camAnim={t0:performance.now(),from:camera.position.clone(),
        top:new THREE.Vector3(0,9.5,0.6),side:new THREE.Vector3(0,0.5,8)};
    spawnBurst();AudioFX.victory();
    if(cubeGroup)cubeGroup.visible=false;
    const tk=celebToken;
    setTimeout(()=>{if(tk===celebToken)spawnApple();},1250);
    setTimeout(()=>{if(tk===celebToken)showResult(stars,finalScore,total,timeBonus,perfect,noHint,beatRecord);},4550);
}
function spawnBurst(){
    const count=150,geo=new THREE.BufferGeometry(),pos=new Float32Array(count*3),vel=[];
    for(let i=0;i<count;i++){
        pos[i*3]=0;pos[i*3+1]=0;pos[i*3+2]=0;
        const d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
        vel.push(d.multiplyScalar(3+Math.random()*4));
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:0xffd700,size:.15,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
    const pts=new THREE.Points(geo,mat);scene.add(pts);
    particles.push({pts,vel,age:0,life:1.25});
}
function spawnApple(){
    const g=createApple();
    const glow=new THREE.PointLight(0xffd700,5,12,2);g.add(glow);
    const sGeo=new THREE.BufferGeometry(),sPos=new Float32Array(60*3);
    for(let i=0;i<60;i++){
        const d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
        const r=1.7+Math.random()*.6;
        sPos[i*3]=d.x*r;sPos[i*3+1]=d.y*r;sPos[i*3+2]=d.z*r;
    }
    sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
    const sparkles=new THREE.Points(sGeo,new THREE.PointsMaterial({color:0xfff2b0,size:.09,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(sparkles);
    g.scale.setScalar(0.001);
    g.userData={spawn:performance.now(),glow,sparkles};
    scene.add(g);apple=g;
    AudioFX.appleSpin();
    shadowCatcher=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.ShadowMaterial({opacity:.35}));
    shadowCatcher.rotation.x=-Math.PI/2;shadowCatcher.position.y=-2.1;shadowCatcher.receiveShadow=true;
    scene.add(shadowCatcher);
}

function showResult(stars,fs,total,tb,pf,nh,rec){
    dom.screenResult.classList.add('active');
    const sc=dom.screenResult.querySelector('#result-stars');sc.innerHTML='';
    for(let i=0;i<3;i++){const s=document.createElement('div');s.className='bigstar'+(i<stars?' on':'');
        s.style.animationDelay=(i*.25)+'s';sc.appendChild(s);}
    dom.screenResult.querySelector('#result-stats').innerHTML='Score: '+fs+'<br>Time: '+total.toFixed(1)+'s &nbsp;(time bonus +'+tb+')'+
        (pf?'<br>Perfect +'+pf:'')+(nh?' &nbsp; No hint +'+nh:'')+
        (rec?'<br><span class="rec-line">NEW RECORD! +1 bonus hint earned</span>':'');
    if(rec)setTimeout(()=>AudioFX.record(),400);
    const ph=dom.screenResult.querySelector('#result-phrases');ph.innerHTML='';
    PHRASES.forEach((p,i)=>{const d=document.createElement('div');d.className='phrase';d.textContent=p;
        ph.appendChild(d);setTimeout(()=>d.classList.add('show'),i*110);});
    dom.btnNext.style.display=currentLevel<MAXLVL?'inline-block':'none';
}
dom.btnNext.addEventListener('click',()=>{AudioFX.button();dom.screenResult.classList.remove('active');startLevel(currentLevel+1);});
dom.btnMenu.addEventListener('click',()=>{AudioFX.button();dom.screenResult.classList.remove('active');clearLevel();dom.hud.classList.remove('active');showSelect();});
dom.hudBack.addEventListener('click',()=>{AudioFX.button();playing=false;clearLevel();dom.hud.classList.remove('active');showSelect();});

dom.btnExport.addEventListener('click',()=>{AudioFX.button();prompt(T[LANG].saveDone,exportCode());});
dom.btnImport.addEventListener('click',()=>{
    AudioFX.button();
    const code=prompt(T[LANG].load,'');
    if(code===null||code==='')return;
    if(importCode(code)){timePopup(T[LANG].loadOk);showSelect();}
    else timePopup(T[LANG].loadBad);
});

function menuCamera(){
    const portrait=innerHeight>innerWidth;
    camera.position.set(portrait?5.2:6.2,portrait?2.6:3.2,portrait?9.4:8.2);
    camera.lookAt(0,0,0);
}
function showSelect(){
    controls.enabled=true;controls.autoRotate=false;camAnim=null;
    controls.target.set(0,0,0);
    menuCamera();
    dom.screenSelect.classList.add('active');
    dom.btnExport.textContent=T[LANG].save;dom.btnImport.textContent=T[LANG].load;
    dom.levelPath.innerHTML='';
    for(let lv=1;lv<=MAXLVL;lv++){
        const locked=lv>progress.unlocked;
        const nd=document.createElement('div');nd.className='node'+(locked?' locked':'');
        const st=progress.stars[lv]||0;
        let dotsHtml='';for(let i=0;i<3;i++)dotsHtml+='<div class="sdot'+(i<st?' on':'')+'"></div>';
        const bt=progress.bestTime[lv]?progress.bestTime[lv]+'s':'';
        nd.innerHTML='<div class="num">'+lv+'</div><div class="stars">'+dotsHtml+'</div><div class="bt">'+bt+'</div>'+
            (locked?'<div class="lockicon"></div>':'');
        if(!locked)nd.addEventListener('click',()=>{AudioFX.button();dom.screenSelect.classList.remove('active');startLevel(lv);});
        dom.levelPath.appendChild(nd);
    }
    try{buildOrchard();}catch(err){console.warn('orchard skipped:',err);}
}
function startLevel(lv){
    dom.hud.classList.add('active');dom.screenSelect.classList.remove('active');dom.screenResult.classList.remove('active');
    controls.enabled=true;controls.autoRotate=true;
    controls.target.set(0,0,0);
    camera.position.set(7,5,7);camera.lookAt(0,0,0);
    buildLevel(lv);
}

addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    keys[e.code]=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function applyKeys(dt){
    if(!playing||paused)return;
    let dT=0,dP=0;
    if(keys['ArrowLeft']||keys['KeyA'])dT+=1;
    if(keys['ArrowRight']||keys['KeyD'])dT-=1;
    if(keys['ArrowUp']||keys['KeyW'])dP-=1;
    if(keys['ArrowDown']||keys['KeyS'])dP+=1;
    if(dT||dP){
        controls.autoRotate=false;
        sph.setFromVector3(camera.position);
        sph.theta+=dT*2.2*dt;
        sph.phi=Math.min(Math.PI-0.15,Math.max(0.15,sph.phi+dP*1.8*dt));
        camera.position.setFromSpherical(sph);
        camera.lookAt(0,0,0);
    }
}

function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(),0.05),now=performance.now();
    applyKeys(dt);
    controls.update();
    if(playing&&!paused)dom.hudTime.textContent=((now-startTime)/1000+penalty).toFixed(1)+'s';
    anims=anims.filter(a=>{
        const t=Math.min((now-a.start)/1000,1),e=1-Math.pow(1-t,3);
        a.mesh.position.lerpVectors(a.from,a.to,e);
        a.mesh.scale.setScalar(1-e*.8);
        a.mesh.material.forEach(m=>{m.transparent=true;m.opacity=1-e;});
        if(t>=1){cubeGroup.remove(a.mesh);return false;}
        return true;
    });
    if(cubeGroup&&playing){const t=now*.001;
        blocks.forEach((b,i)=>{if(!b.userData.consumed)b.position.y=b.userData.base.y+Math.sin(t+i*.4)*.03;});}
    if(dot&&dotActive&&dotBlock&&!dotBlock.userData.consumed){
        const out=dotBlock.position.clone().normalize().multiplyScalar(.72);
        dot.position.lerp(dotBlock.position.clone().add(out),.2);
        dot.scale.setScalar(1+.25*Math.sin(now*.006));
    } else if(dot)dot.visible=false;
    if(orchard)orchard.rotation.y+=dt*0.25;
    particles=particles.filter(p=>{
        p.age+=dt;
        const split=p.life*0.45;
        const dirMul=p.age<split?1:-1.15;
        const arr=p.pts.geometry.attributes.position.array;
        for(let i=0;i<p.vel.length;i++){
            arr[i*3]+=p.vel[i].x*dt*dirMul;arr[i*3+1]+=p.vel[i].y*dt*dirMul;arr[i*3+2]+=p.vel[i].z*dt*dirMul;
        }
        p.pts.geometry.attributes.position.needsUpdate=true;
        p.pts.material.opacity=p.age<split?1:Math.max(0,1-(p.age-split)/(p.life-split));
        if(p.age>=p.life){scene.remove(p.pts);return false;}
        return true;
    });
    if(camAnim){
        const el=(now-camAnim.t0)/1000;
        if(el<1.0)camera.position.lerpVectors(camAnim.from,camAnim.top,easeInOut(el));
        else if(el<2.6)camera.position.lerpVectors(camAnim.top,camAnim.side,easeInOut((el-1.0)/1.6));
        camera.lookAt(0,0,0);
    }
    if(apple){
        const t=(now-apple.userData.spawn)/1000;
        apple.scale.setScalar(Math.max(.001,easeOutBack(Math.min(1,t/.6))));
        apple.rotation.y=-6*Math.PI*easeInOut(Math.min(1,t/3));
        apple.userData.glow.intensity=5*(1+Math.sin(t*8)*.4);
        const am=getAppleMat();if(am)am.emissiveIntensity=.9+.25*Math.sin(t*8);
        apple.userData.sparkles.material.opacity=.55+.4*Math.sin(t*6);
    }
    renderer.render(scene,camera);
}
addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    if(dom.screenSelect.classList.contains('active')){menuCamera();fitOrchard();}
});

export function init(){
    dom.loading.style.display='none';
    loop();
    showSelect();
}

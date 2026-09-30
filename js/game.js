import { THREE, scene, camera, renderer, controls, raycaster, mouse } from './three-setup.js';
import { dom } from './dom.js';
import { addGoldenApples } from './economy.js';

import { LANG, T, getLang, normalText } from './i18n.js';
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
let score=0,combo=0,wrongCount=0,penalty=0,hintsLeft=3,hintsUsed=0,startTime=0,playing=false,failedLevel=false;
let paused=false,pauseStart=0;
let codeUsedRespect=false,codeUsedHumble=false,verifyUses=3,verifyTimer=0;
let cubeGroup=null,apple=null,shadowCatcher=null,dot=null,dotBlock=null,dotActive=false;
let warningBlock=null,warningPulse=0,warningTextureState=null;
let camAnim=null,focusAnim=null,celebToken=0;
let persistentHintBlocks=new Set();
let lastPlayerActionAt=performance.now();
let idleRotate=false;
let autoRotateRemaining=0;
let arrowRotateDir=0;
const AUTO_ROTATE_SPEED=0.20;
const AUTO_ROTATE_CIRCLE=Math.PI*2;
const keys={};
const clock=new THREE.Clock();
const sph=new THREE.Spherical();

function pauseGame(){ if(playing&&!paused){paused=true;pauseStart=performance.now();} }
function resumeGame(){ if(paused){startTime+=performance.now()-pauseStart;paused=false;} }

function clearLevel(){
    celebToken++;paused=false;
    if(dom.hintWrap)dom.hintWrap.classList.remove('open');
    if(cubeGroup){scene.remove(cubeGroup);cubeGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
    if(apple){scene.remove(apple);apple=null;}
    if(shadowCatcher){scene.remove(shadowCatcher);shadowCatcher=null;}
    if(dot){scene.remove(dot);dot=null;}
    warningBlock=null;warningPulse=0;warningTextureState=null;
    clearOrchard();
    cubeGroup=null;blocks=[];blanks=[];anims=[];particles=[];selected=[];camAnim=null;focusAnim=null;persistentHintBlocks.clear();
}
function buildLevel(lv){
    clearLevel();
    lastPlayerActionAt=performance.now();
    idleRotate=false;
    autoRotateRemaining=0;
    arrowRotateDir=0;
    currentLevel=lv;cfg=levelConfig(lv);
    roundIndex=0;totalRounds=cfg.R;score=0;combo=0;wrongCount=0;penalty=0;
    hintsLeft=3+(progress.records||0);hintsUsed=0;
    codeUsedRespect=false;codeUsedHumble=false;verifyUses=3;
    playing=true;startTime=performance.now();dotActive=false;
    dom.hud.classList.remove('dim');
    dom.hintBtn.classList.remove('off');dom.hintCount.textContent=hintsLeft;
    dom.codeBtn.classList.remove('off');dom.codeBtn.textContent=normalText('code');
    dom.verifyBtn.classList.remove('off');dom.verifyBtn.textContent=normalText('verify');dom.verifyCount.textContent=verifyUses;
    dom.verifyPanel.classList.remove('show');
    dom.codeStack.style.display=lv>=15?'flex':'none';
    dom.verifyStack.style.display=lv>=15?'flex':'none';
    dom.advStack.style.display=lv>=18?'flex':'none';
    dom.hudLevel.textContent=getLang()==='zh'?`${normalText('level')}${lv}${normalText('levelSuffix')}`:`${normalText('level')} ${lv}`;
    dom.hintBtn.textContent=normalText('hint');
    dom.codeBtn.textContent=normalText('code');
    dom.verifyBtn.textContent=normalText('verify');
    dom.advBtn.querySelector('.in2').textContent=normalText('hintX2');
    dom.hudBack.textContent=normalText('home');
    if(dom.hudHearts){const h=Number(localStorage.getItem('mcHearts') ?? 10);const hv=document.getElementById('hud-hearts-value');if(hv)hv.textContent='('+h+')';else dom.hudHearts.textContent='('+h+')';}
    dom.assistBtn.textContent=normalText('assist');
    dom.assistClose.setAttribute('aria-label',normalText('closeAssist'));
    dom.assistClose.title=normalText('closeAssist');
    dom.hintTitle.textContent=normalText('assist');
    updateScore();
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
            const tex=makeTexture(num,'#00f5d4');
            const warningTex=makeTexture(num,'#ff2038');
            const mats=[];for(let k=0;k<6;k++)mats.push(new THREE.MeshStandardMaterial({map:tex,roughness:.3,metalness:.15}));
            const geom=new THREE.BoxGeometry(1,1,1);
            const m=new THREE.Mesh(geom,mats);
            m.position.copy(p);
            // The warning border is part of the cube face texture itself. No extra
            // floating/overlaid border is attached to the rotating cube.
            m.userData={num,consumed:false,base:p.clone(),baseTexture:tex,warningTexture:warningTex,warningRed:false};
            cubeGroup.add(m);blocks.push(m);
        } else {
            const m=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),
                new THREE.MeshStandardMaterial({color:0x8888aa,transparent:true,opacity:.07}));
            m.position.copy(p);cubeGroup.add(m);blanks.push(m);
        }
    }
    dot=null;dotBlock=null;dotActive=false;warningBlock=null;warningPulse=0;warningTextureState=null;
    startRound();
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
    curRound=round;selected=[];persistentHintBlocks.clear();warningBlock=null;warningPulse=0;updateEq();updateWarningTarget();
    lastPlayerActionAt=performance.now();
    idleRotate=false;
    autoRotateRemaining=0;
}

function fitHudEquation(){
    const el=dom.hudEq;
    if(!el)return;
    // Prefer one line. Only reduce the large question font when the full equation
    // cannot fit inside its responsive 25–50vw question area.
    el.style.whiteSpace='nowrap';
    el.style.fontSize='';
    const maxPx=Math.max(44,Math.min(86,window.innerWidth*0.11));
    let size=maxPx;
    el.style.fontSize=size+'px';
    const available=Math.max(80,el.clientWidth-36);
    while(el.scrollWidth>available && size>30){
        size-=1;
        el.style.fontSize=size+'px';
    }
    // Extremely long equations may still need two lines; never clip them.
    if(el.scrollWidth>available){
        el.style.whiteSpace='normal';
        el.style.overflowWrap='anywhere';
    }
}

window.addEventListener('resize',()=>{ if(playing) fitHudEquation(); });

function notePlayerAction(){
    lastPlayerActionAt=performance.now();
    idleRotate=false;
    autoRotateRemaining=0;
    if(focusAnim){focusAnim=null;controls.enabled=true;}
}

function rotateCameraHorizontal(direction,dt,speed=2.2){
    sph.setFromVector3(camera.position);
    sph.theta += direction*speed*dt;
    sph.phi=Math.PI/2;
    camera.position.setFromSpherical(sph);
    camera.lookAt(0,0,0);
}

function focusCameraOnBlock(block,duration=900){
    if(!block||!playing)return;
    sph.setFromVector3(camera.position);
    const targetTheta=Math.atan2(block.position.z,block.position.x);
    let delta=targetTheta-sph.theta;
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    focusAnim={t0:performance.now(),duration,theta0:sph.theta,theta1:sph.theta+delta,radius:sph.radius};
    controls.enabled=false;
}


function positionNormalHints(){
    const wrap=document.getElementById('hint-wrap'), eq=document.getElementById('hud-eq');
    if(!wrap||!eq)return;
    const r=eq.getBoundingClientRect();
    const desired=r.bottom+18;
    const minTop=96;
    const maxTop=Math.max(minTop,window.innerHeight-wrap.offsetHeight-28);
    wrap.style.top=Math.min(desired,maxTop)+'px';
}
window.addEventListener('resize',()=>requestAnimationFrame(positionNormalHints));

function updateEq(){
    const r=curRound;if(!r){dom.hudEq.textContent='';dom.hudEq.style.fontSize='';dom.hudEq.style.whiteSpace='nowrap';updateCalc();return;}
    const s=selected.map(b=>b.userData.num);
    const qm=getLang()==='en'?'?':'？';
    const f=i=>s[i]!==undefined?s[i]:qm;
    let txt='';
    if(r.type==='MAIN'){
        for(let i=0;i<r.k;i++){txt+=f(i);if(i<r.ops.length)txt+=' '+r.ops[i]+' ';}
        txt+=' = '+r.target;
    }
    else if(r.type==='MISSING')txt=`${r.given} ${r.op} ${f(0)} = ${r.target}`;
    else if(r.type==='FIND')txt=`${r.givenA} ${r.op} ${r.givenB} = ${f(0)}`;
    dom.hudEq.textContent=txt;
    fitHudEquation();
    positionNormalHints();
    updateCalc();
}
function updateWarningTarget(){
    if(warningBlock)setWarningTexture(warningBlock,false);
    warningBlock=null;
    if(!curRound||curRound.k<3)return;
    const remaining=curRound.picked.filter(b=>!b.userData.consumed);
    if(remaining.length>=3)warningBlock=remaining[0];
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
function forEachMaterial(mesh,fn){
    if(!mesh||!mesh.material)return;
    const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    list.forEach(m=>{if(m)fn(m);});
}
function setGlow(b,on,color){
    forEachMaterial(b,m=>{
        if('emissive' in m)m.emissive=new THREE.Color(on?(color||0xffd700):0x000000);
        if('emissiveIntensity' in m)m.emissiveIntensity=on?0.55:0;
    });
}
function setWarningTexture(b,red){
    if(!b||!b.userData)return;
    if(b.userData.warningRed===red)return;
    b.userData.warningRed=red;
    const tex=red?b.userData.warningTexture:b.userData.baseTexture;
    forEachMaterial(b,m=>{if(m.map!==tex){m.map=tex;m.needsUpdate=true;}});
}

renderer.domElement.addEventListener('click',e=>{
    if(!playing||paused)return;
    mouse.x=(e.clientX/innerWidth)*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(blocks.filter(b=>!b.userData.consumed));
    if(!hit.length)return;
    const mesh=hit[0].object;
    notePlayerAction();
    const idx=selected.indexOf(mesh);
    if(idx>=0){selected.splice(idx,1);if(!persistentHintBlocks.has(mesh))setGlow(mesh,false,0x00f5d4);else setGlow(mesh,true,0xffd54a);AudioFX.blockDeselect();updateEq();return;}
    selected.push(mesh);setGlow(mesh,true,0x00f5d4);AudioFX.blockSelect();updateEq();updateWarningTarget();
    if(selected.length===curRound.k){
        if(evalRound(selected.map(b=>b.userData.num)))roundSuccess();else roundFail();
    }
});
function showNormalCorrect(solvedSelection){
    const overlay=document.getElementById('normal-correct-overlay');
    const equation=document.getElementById('normal-completed-equation');
    const label=document.getElementById('normal-correct-label');
    if(!overlay||!equation||!label)return;

    // Build the completed equation from the exact numbers the player just selected.
    // Do not use r.picked here: that is the internally generated solution order,
    // which can differ from the player's actual selection order.
    const r=curRound;
    if(!r)return;
    const chosen=Array.isArray(solvedSelection)?solvedSelection:[];
    let text='';
    if(r.type==='MAIN'){
        const vals=chosen.map(b=>b.userData.num);
        for(let i=0;i<vals.length;i++){
            text+=vals[i];
            if(i<r.ops.length)text+=' '+r.ops[i]+' ';
        }
        text+=' = '+r.target;
    }else if(r.type==='MISSING'){
        const pickedValue=chosen[0]?.userData?.num ?? r.needed;
        text=`${r.given} ${r.op} ${pickedValue} = ${r.target}`;
    }else if(r.type==='FIND'){
        const pickedValue=chosen[0]?.userData?.num ?? r.needed;
        text=`${r.givenA} ${r.op} ${r.givenB} = ${pickedValue}`;
    }
    equation.textContent=text;
    label.textContent=normalText('correct');
    overlay.classList.remove('show','fade');
    void overlay.offsetWidth;
    overlay.classList.add('show');
}

function hideNormalCorrect(){
    const overlay=document.getElementById('normal-correct-overlay');
    if(!overlay)return;
    overlay.classList.add('fade');
    setTimeout(()=>overlay.classList.remove('show','fade'),420);
}

function roundSuccess(){
    // Preserve the player's exact selection/order before selected[] is cleared.
    const solvedSelection=[...selected];
    const k=curRound.k;
    score+=100*k+combo*25;combo++;
    selected.forEach(b=>{b.userData.consumed=true;setGlow(b,false);persistentHintBlocks.delete(b);
        anims.push({mesh:b,start:performance.now(),from:b.position.clone(),to:b.position.clone().multiplyScalar(.08)});});
    selected=[];roundIndex++;
    updateScore();updateCalc();flashEq('good');AudioFX.roundSuccess();
    updateWarningTarget();

    // Give the player a large, high-contrast confirmation before continuing.
    showNormalCorrect(solvedSelection);
    if(roundIndex>=totalRounds){
        setTimeout(()=>{hideNormalCorrect();setTimeout(finish,420);},2000);
    }else{
        setTimeout(()=>{hideNormalCorrect();setTimeout(startRound,420);},2000);
    }
}
function roundFail(){
    wrongCount++;combo=0;penalty+=3;
    if(wrongCount>=3){ setTimeout(failLevel,450); return; }
    selected.forEach(b=>{if(!persistentHintBlocks.has(b))setGlow(b,false);else setGlow(b,true,0xffd54a);shake(b);});
    selected=[];updateEq();updateWarningTarget();flashEq('bad');AudioFX.roundFail();
}
function flashEq(cls){dom.hudEq.classList.add(cls);setTimeout(()=>dom.hudEq.classList.remove(cls),400);}
function shake(b){
    const bx=b.position.x,st=performance.now();
    const anim=()=>{const e=performance.now()-st;
        if(e<320){b.position.x=bx+Math.sin(e*.08)*.06;requestAnimationFrame(anim);}else b.position.x=bx;};
    anim();
}
function updateScore(){const v=document.getElementById('hud-score-value');if(v)v.textContent=score;else dom.hudScore.textContent=score;}
function timePopup(text){
    const el=document.createElement('div');el.className='time-pop';el.textContent=text;
    document.body.appendChild(el);setTimeout(()=>el.remove(),1100);
}

function showHintTarget(blocksToShow, persistent=false){
    const targets=(blocksToShow||[]).filter(Boolean);
    if(!targets.length)return;
    if(persistent)targets.forEach(b=>persistentHintBlocks.add(b));
    targets.forEach(b=>setGlow(b,true,0xffd54a));
    focusCameraOnBlock(targets[0]);
    if(!persistent){
        setTimeout(()=>targets.forEach(b=>{if(!b.userData.consumed)setGlow(b,false);}),2200);
    }
}

dom.assistBtn.addEventListener('click',()=>{
    if(!playing||paused)return;
    AudioFX.button();
    if(dom.hintWrap.classList.contains('open')){ dom.hintWrap.classList.remove('open'); return; }
    dom.hintWrap.classList.add('open');
    dom.hintTitle.textContent=normalText('assist');
    requestAnimationFrame(positionNormalHints);
});
dom.assistClose.addEventListener('click',()=>{AudioFX.button();dom.hintWrap.classList.remove('open');});

dom.hintBtn.addEventListener('click',()=>{
    if(!playing||paused||hintsLeft<=0||!curRound)return;
    AudioFX.button();
    hintsLeft--;hintsUsed++;penalty+=10;
    dom.hintCount.textContent=hintsLeft;
    if(hintsLeft===0)dom.hintBtn.classList.add('off');
    timePopup('+10s');AudioFX.hint();
    const t=curRound.picked.find(b=>!b.userData.consumed)||curRound.picked[0];
    showHintTarget(t?[t]:[],false);
    dom.hintWrap.classList.remove('open');
});

dom.verifyBtn.addEventListener('click',()=>{
    dom.hintWrap.classList.remove('open');
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
    dom.hintWrap.classList.remove('open');
    if(!playing||paused||(codeUsedRespect&&codeUsedHumble)||currentLevel<15)return;
    AudioFX.button();
    dom.codeTitle.textContent=normalText('enter');
    dom.codeOk.textContent=normalText('ok');dom.codeRetry.textContent=normalText('retry');dom.codeExit.textContent=normalText('exit');
    dom.codeMsg.textContent='';dom.codeRetry.style.display='none';dom.codeInput.value='';
    pauseGame();
    dom.codeModal.classList.add('active');
    setTimeout(()=>dom.codeInput.focus(),60);
});
function closeCode(){ dom.codeModal.classList.remove('active'); resumeGame(); }
dom.codeOk.addEventListener('click',()=>{
    const val=dom.codeInput.value.trim().toLowerCase();
    if(val===fromBin(SECRET_BIN)){
        if(codeUsedRespect){dom.codeMsg.textContent=normalText('used');dom.codeRetry.style.display='inline-block';return;}
        codeUsedRespect=true;
        hintsLeft+=3;dom.hintCount.textContent=hintsLeft;
        if(hintsLeft>0)dom.hintBtn.classList.remove('off');
        timePopup(normalText('plus3'));AudioFX.record();
    } else if(val===fromBin(SECRET2_BIN)){
        if(codeUsedHumble){dom.codeMsg.textContent=normalText('used');dom.codeRetry.style.display='inline-block';return;}
        codeUsedHumble=true;
        verifyUses=3;dom.verifyCount.textContent=3;dom.verifyBtn.classList.remove('off');
        timePopup(normalText('plusV'));AudioFX.record();
    } else {
        dom.codeMsg.textContent=normalText('wrong');dom.codeRetry.style.display='inline-block';
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
    dom.hintWrap.classList.remove('open');
    if(!playing||paused||currentLevel<18)return;
    AudioFX.button();pauseGame();
    if(hintsLeft<2){
        dom.advMsg.textContent=normalText('need2',hintsLeft);
        dom.advYes.style.display='none';dom.advNo.textContent=normalText('ok');
    } else {
        dom.advMsg.textContent=normalText('confirm');
        dom.advYes.style.display='inline-block';
        dom.advYes.textContent=normalText('yes');dom.advNo.textContent=normalText('no');
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
    showHintTarget(targets,true);
    dom.hintWrap.classList.remove('open');
    closeAdv();
});
dom.advNo.addEventListener('click',()=>{AudioFX.button();closeAdv();});

function finish(){
    if(!playing)return;
    playing=false;warningBlock=null;if(dot)dot.visible=false;
    dom.hud.classList.add('dim');
    controls.enabled=false;controls.autoRotate=false;
    const elapsed=(performance.now()-startTime)/1000,total=elapsed+penalty,par=cfg.par;
    const timeBonus=Math.max(0,Math.round((par*2-total)*10));
    const perfect=wrongCount===0?500:0,noHint=hintsUsed===0?300:0;
    const finalScore=score+timeBonus+perfect+noHint;
    try{localStorage.setItem('mcScore',String(Number(localStorage.getItem('mcScore')||0)+finalScore));}catch(e){}
    let stars=1;
    if(wrongCount===0&&total<=par*1.2)stars=3;
    else if(wrongCount<=1&&total<=par*2)stars=2;
    const prevBest=progress.bestTime[currentLevel];
    const beatRecord=prevBest!==undefined&&total<prevBest;
    if(beatRecord)progress.records=(progress.records||0)+1;
    progress.wins=(progress.wins||0)+1;
    addGoldenApples(1);
    try{const key='mcPhase2RecordsV1';const r=JSON.parse(localStorage.getItem(key)||'{\"speed\":{},\"brain\":{},\"normal\":{levels:0,stars:0,score:0}}');r.normal=r.normal||{levels:0,stars:0,score:0};r.normal.levels=(r.normal.levels||0)+1;r.normal.stars=(r.normal.stars||0)+stars;r.normal.score=Math.max(r.normal.score||0,finalScore);localStorage.setItem(key,JSON.stringify(r));window.dispatchEvent(new Event('mathcube-record-updated'));}catch(e){}
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


function failLevel(){
    if(!playing)return;
    playing=false;if(dot)dot.visible=false;controls.enabled=false;controls.autoRotate=false;
    failedLevel=true;dom.hud.classList.remove('active');
    dom.screenResult.classList.remove('victory-result');
    dom.screenResult.classList.add('active');
    dom.screenResult.querySelector('#result-title').textContent=normalText('levelFailed');
    dom.screenResult.querySelector('#result-level').textContent='';
    dom.screenResult.querySelector('#result-bonus').textContent='';
    dom.screenResult.querySelector('#result-stars').innerHTML='';
    dom.screenResult.querySelector('#result-stats').innerHTML=normalText('failedStats');
    dom.screenResult.querySelector('#result-phrases').innerHTML='';
    dom.btnNext.style.display='inline-block';dom.btnNext.textContent=normalText('restartLevel');dom.btnMenu.textContent=normalText('home');
}

function showResult(stars,fs,total,tb,pf,nh,rec){
    failedLevel=false;
    dom.screenResult.classList.add('active','victory-result');
    dom.screenResult.querySelector('#result-title').textContent=normalText('levelCleared');
    const card=dom.screenResult.querySelector('#result-card');
    card.classList.remove('victory-enter');
    void card.offsetWidth;
    card.classList.add('victory-enter');

    const levelEl=dom.screenResult.querySelector('#result-level');
    const scoreEl=dom.screenResult.querySelector('#result-score-value');
    const timeEl=dom.screenResult.querySelector('#result-time-value');
    const bonusEl=dom.screenResult.querySelector('#result-bonus');
    levelEl.textContent=getLang()==='zh'?`${normalText('level')}${currentLevel}${normalText('levelSuffix')}`:`${normalText('level')} ${currentLevel}`;
    scoreEl.textContent='0';
    timeEl.textContent=`0.0${normalText('seconds')}`;
    bonusEl.textContent='';

    const sc=dom.screenResult.querySelector('#result-stars');sc.innerHTML='';
    for(let i=0;i<3;i++){
        const star=document.createElement('div');
        star.className='bigstar'+(i<stars?' on':'');
        star.style.animationDelay=(0.35+i*.22)+'s';
        sc.appendChild(star);
    }

    // Count the score and time up after the main victory moment.
    setTimeout(()=>animateNumber(scoreEl,fs,650),650);
    setTimeout(()=>animateTime(timeEl,total,650),700);

    const bonus=[];
    if(pf)bonus.push(normalText('perfect')+' +'+pf);
    if(nh)bonus.push(normalText('noHint')+' +'+nh);
    if(rec)bonus.push(normalText('newRecord'));
    bonusEl.textContent=bonus.join('  ·  ');
    if(rec)setTimeout(()=>AudioFX.record(),850);

    const shortPhrases={
        zh:['太棒了！','做得好！','漂亮！','又完成一關！','數學小高手！','繼續挑戰！','你做到了！','精彩！'],
        en:['Great job!','Well done!','Excellent!','Another one cleared!','Math star!','Keep going!','You did it!','Fantastic!'],
        ja:['すごい！','よくできました！','素晴らしい！','また1レベルクリア！','数学の達人！','この調子！','できました！','最高です！'],
        ko:['대단해요!','잘했어요!','훌륭해요!','또 한 레벨 완료!','수학 고수예요!','계속 도전하세요!','해냈어요!','최고예요!']
    };
    const pool=shortPhrases[getLang()]||shortPhrases.en;
    const ph=dom.screenResult.querySelector('#result-phrases');
    ph.innerHTML='';
    const d=document.createElement('div');
    d.className='phrase';
    d.textContent=pool[Math.floor(Math.random()*pool.length)];
    ph.appendChild(d);
    setTimeout(()=>d.classList.add('show'),900);

    dom.btnNext.style.display=currentLevel<MAXLVL?'inline-block':'none';
}
function animateNumber(el,target,duration){
    const start=performance.now();
    function tick(now){
        const p=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-p,3);
        el.textContent=Math.round(target*eased).toLocaleString();
        if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
function animateTime(el,target,duration){
    const start=performance.now();
    function tick(now){
        const p=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-p,3);
        el.textContent=(target*eased).toFixed(1)+normalText('seconds');
        if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
dom.btnNext.addEventListener('click',()=>{AudioFX.button();if(failedLevel){const h=Number(localStorage.getItem('mcHearts') ?? 10);if(h<=0){window.dispatchEvent(new Event('mathcube-home'));return;}localStorage.setItem('mcHearts',String(h-1));const hv=document.getElementById('hud-hearts-value');if(hv)hv.textContent='('+(h-1)+')';else if(dom.hudHearts)dom.hudHearts.textContent='('+(h-1)+')';dom.screenResult.classList.remove('active');startLevel(currentLevel);failedLevel=false;return;}dom.screenResult.classList.remove('active');startLevel(currentLevel+1);});
dom.btnMenu.addEventListener('click',()=>{AudioFX.button();dom.screenResult.classList.remove('active');clearLevel();dom.hud.classList.remove('active');dom.btnNext.textContent=normalText('next');dom.btnMenu.textContent=normalText('levels');window.dispatchEvent(new Event('mathcube-home'));});
dom.hudBack.addEventListener('click',()=>{AudioFX.button();playing=false;clearLevel();dom.hud.classList.remove('active');window.dispatchEvent(new Event('mathcube-home'));});

dom.btnExport.addEventListener('click',()=>{AudioFX.button();prompt(normalText('saveDone'),exportCode());});
dom.btnImport.addEventListener('click',()=>{
    AudioFX.button();
    const code=prompt(normalText('load'),'');
    if(code===null||code==='')return;
    if(importCode(code)){timePopup(normalText('loadOk'));showSelect();}
    else timePopup(normalText('loadBad'));
});

function menuCamera(){
    const portrait=innerHeight>innerWidth;
    camera.position.set(portrait?5.2:6.2,portrait?2.6:3.2,portrait?9.4:8.2);
    camera.lookAt(0,0,0);
}

function applyNormalLanguage(){
    const zh=getLang()==='zh';
    const set=(id,key)=>{const el=document.getElementById(id);if(el)el.textContent=normalText(key);};
    set('hud-back','home'); set('hud-hint','hint'); set('code-btn','code'); set('verify-btn','verify'); set('hud-heart-label','points'); set('hud-score-label','score'); const calcCap=document.querySelector('#hud-calc .cap'); if(calcCap)calcCap.textContent=normalText('calculator');
    const adv=document.querySelector('#adv-btn .in2'); if(adv)adv.textContent=normalText('hintX2');
    const gt=document.getElementById('game-title'); if(gt)gt.textContent=normalText('gameTitle');
    const gs=document.getElementById('game-sub'); if(gs)gs.textContent=normalText('gameSub');
    const apples=document.querySelector('#apple-badge .lbl'); if(apples)apples.textContent=normalText('goldenApples');
    const ex=document.getElementById('btn-export'); if(ex)ex.textContent=normalText('save');
    const im=document.getElementById('btn-import'); if(im)im.textContent=normalText('load');
    const ok=document.getElementById('code-ok'); if(ok)ok.textContent=normalText('ok');
    const retry=document.getElementById('code-retry'); if(retry)retry.textContent=normalText('retry');
    const exit=document.getElementById('code-exit'); if(exit)exit.textContent=normalText('exit');
    const yes=document.getElementById('adv-yes'); if(yes)yes.textContent=normalText('yes');
    const no=document.getElementById('adv-no'); if(no)no.textContent=normalText('no');
    const rl=document.getElementById('result-level'); if(rl && currentLevel) rl.textContent=zh?`${normalText('level')}${currentLevel}${normalText('levelSuffix')}`:`${normalText('level')} ${currentLevel}`;
    const rt=document.querySelector('.result-score-stat .result-stat-label'); if(rt)rt.textContent=normalText('score');
    const rtime=document.querySelector('.result-time-stat .result-stat-label'); if(rtime)rtime.textContent=normalText('time');
    const next=document.getElementById('btn-next'); if(next && !failedLevel)next.textContent=normalText('next');
    const menu=document.getElementById('btn-menu'); if(menu)menu.textContent=normalText('levels');
}
window.addEventListener('mathcube-language-changed',()=>{applyNormalLanguage(); if(playing) buildLevel(currentLevel);});

export function showSelect(){
    applyNormalLanguage();
    controls.enabled=true;controls.autoRotate=false;camAnim=null;
    controls.target.set(0,0,0);
    menuCamera();
    dom.screenSelect.classList.add('active');
    dom.btnExport.textContent=normalText('save');dom.btnImport.textContent=normalText('load');
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
    dom.hud.classList.add('active');
    if(dom.hudHearts){const h=Math.min(10,Math.max(0,Number(localStorage.getItem('mcHearts') ?? 10)));const hv=document.getElementById('hud-hearts-value');if(hv)hv.textContent='('+h+')';else dom.hudHearts.textContent='('+h+')';}
    dom.screenSelect.classList.remove('active');dom.screenResult.classList.remove('active');
    controls.enabled=true;controls.autoRotate=false;
    controls.target.set(0,0,0);
    camera.position.set(7,0,7);camera.lookAt(0,0,0);
    buildLevel(lv);
}

addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    keys[e.code]=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function applyKeys(dt){
    if(!playing||paused)return;
    let dT=0;
    if(keys['ArrowLeft']||keys['KeyA'])dT+=1;
    if(keys['ArrowRight']||keys['KeyD'])dT-=1;
    if(dT){
        notePlayerAction();
        controls.autoRotate=false;
        rotateCameraHorizontal(dT,dt,2.2);
        return;
    }
    if(arrowRotateDir){
        controls.autoRotate=false;
        rotateCameraHorizontal(arrowRotateDir,dt,2.35);
        return;
    }
    const now=performance.now();
    if(autoRotateRemaining>0){
        idleRotate=true;
        const step=Math.min(autoRotateRemaining,AUTO_ROTATE_SPEED*dt);
        rotateCameraHorizontal(-1,step/AUTO_ROTATE_SPEED,AUTO_ROTATE_SPEED);
        autoRotateRemaining-=step;
        if(autoRotateRemaining<=0.0001){
            autoRotateRemaining=0;
            idleRotate=false;
            // One full circle is complete. Start a fresh 3-second idle period.
            lastPlayerActionAt=now;
        }
    }else if(now-lastPlayerActionAt>=3000){
        idleRotate=true;
        autoRotateRemaining=AUTO_ROTATE_CIRCLE;
    }
}

const leftRotateBtn=document.getElementById('cube-rotate-left');
const rightRotateBtn=document.getElementById('cube-rotate-right');
function bindRotateButton(btn,direction){
    if(!btn)return;
    const stop=()=>{ if(arrowRotateDir===direction)arrowRotateDir=0; };
    btn.addEventListener('pointerdown',e=>{
        e.preventDefault();
        if(!playing||paused)return;
        notePlayerAction();
        arrowRotateDir=direction;
        btn.setPointerCapture?.(e.pointerId);
    });
    btn.addEventListener('pointerup',stop);
    btn.addEventListener('pointercancel',stop);
    btn.addEventListener('lostpointercapture',stop);
    btn.addEventListener('pointerleave',e=>{ if(e.buttons===0)stop(); });
}
bindRotateButton(leftRotateBtn,1);
bindRotateButton(rightRotateBtn,-1);
renderer.domElement.addEventListener('pointerdown',()=>{
    if(playing&&!paused)notePlayerAction();
},{passive:true});

function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(),0.05),now=performance.now();
    applyKeys(dt);
    controls.update();
    if(playing&&!paused)dom.hudTime.textContent=((now-startTime)/1000+penalty).toFixed(1)+normalText('seconds');
    anims=anims.filter(a=>{
        const t=Math.min((now-a.start)/1000,1),e=1-Math.pow(1-t,3);
        a.mesh.position.lerpVectors(a.from,a.to,e);
        a.mesh.scale.setScalar(1-e*.8);
        forEachMaterial(a.mesh,m=>{m.transparent=true;m.opacity=1-e;});
        if(t>=1){cubeGroup.remove(a.mesh);return false;}
        return true;
    });
    if(cubeGroup&&playing){const t=now*.001;
        blocks.forEach((b,i)=>{if(!b.userData.consumed)b.position.y=b.userData.base.y+Math.sin(t+i*.4)*.03;});}
    if(playing&&warningBlock&&!warningBlock.userData.consumed){
        // Flash the cube's own face border. The border is baked into its texture,
        // so it rotates exactly with the cube and never becomes a floating overlay.
        const pulse=.5+.5*Math.sin(now*.006);
        setWarningTexture(warningBlock,pulse>.42);
    } else if(warningBlock){
        setWarningTexture(warningBlock,false);
    }
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
    if(focusAnim){
        const p=Math.min(1,(now-focusAnim.t0)/focusAnim.duration);
        const e=easeInOut(p);
        sph.setFromVector3(camera.position);
        sph.theta=focusAnim.theta0+(focusAnim.theta1-focusAnim.theta0)*e;
        sph.phi=Math.PI/2;
        sph.radius=focusAnim.radius;
        camera.position.setFromSpherical(sph);
        camera.lookAt(0,0,0);
        if(p>=1){focusAnim=null;controls.enabled=true;}
    }
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
    window.dispatchEvent(new Event('mathcube-home'));
}

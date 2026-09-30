import { cloudReady, v10CreatePlayer, v10GetPlayer, v10SaveSlot } from './supabase.js';

const PLAYER_KEY='mcV10Player';
const SLOT_KEY='mcV10Slot';
const SLOT_COUNT=5;
const STATE_KEYS=['mcPhase2RecordsV1','mcPhase2AchievementsV1','mcPhase2InventoryV1','mcPhase2EquippedV1','mcPhase2ChallengeV1','mcGoldenApples','mcScore','mcHearts','mathCubeProgress','mathCubeProgressBackup'];
const clone=x=>JSON.parse(JSON.stringify(x));
const read=(k,fallback=null)=>{try{const v=localStorage.getItem(k);return v===null?fallback:JSON.parse(v);}catch{return fallback;}};
const raw=(k,fallback=null)=>localStorage.getItem(k)??fallback;
const write=(k,v)=>{try{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));}catch{}};

let player=null;
let slots=[];
let activeSlot=1;
let busy=false;
let saveQueue=Promise.resolve();

function makeId(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];
  return `MC-${s}`;
}
function getLocalPlayer(){return read(PLAYER_KEY,null);}
function getActiveSlot(){return Number(localStorage.getItem(SLOT_KEY)||1)||1;}
function setLocalPlayer(p){write(PLAYER_KEY,p);}
function blankState(){return {'mcPhase2RecordsV1':JSON.stringify({speed:{bestScore:0,bestCombo:0,accuracy:0,fastest:0,average:0,questions:0,games:0},brain:{bestScore:0,bestCombo:0,accuracy:0,highestLevel:0,highestDifficulty:0,questions:0,games:0},normal:{levels:0,stars:0,score:0}}),'mcPhase2AchievementsV1':'{}','mcPhase2InventoryV1':'[]','mcPhase2EquippedV1':'','mcPhase2ChallengeV1':'{}','mcGoldenApples':'0','mcScore':'0','mcHearts':'10','mathCubeProgress':'{}','mathCubeProgressBackup':'{}'};}
function localState(){const state={};for(const k of STATE_KEYS){const v=raw(k,null);if(v!==null)state[k]=v;}return state;}
function applyState(state){if(!state||typeof state!=='object')return;for(const k of STATE_KEYS){if(Object.prototype.hasOwnProperty.call(state,k))write(k,state[k]);}}
function defaultSlot(n){return {slot_no:n,slot_name:`Slot ${n}`,revision:0,state:{}};}
function ensureSlots(rows=[]){const map=new Map((rows||[]).map(x=>[Number(x.slot_no),x]));return Array.from({length:SLOT_COUNT},(_,i)=>map.get(i+1)||defaultSlot(i+1));}
function localSlots(){const p=getLocalPlayer();return p?.slots&&Array.isArray(p.slots)?ensureSlots(p.slots):ensureSlots([]);}
function hasLocalGameData(){return STATE_KEYS.some(k=>localStorage.getItem(k)!==null);}
function setStatus(text){const e=document.getElementById('mc-cloud-status');if(e)e.textContent=text;}
function dispatchLoaded(){window.dispatchEvent(new CustomEvent('mathcube-player-loaded',{detail:{playerId:player?.player_id||'',slot:activeSlot}}));}

async function cloudGet(id){if(!cloudReady())return null;return await v10GetPlayer(id);}
async function cloudCreate(id,state){if(!cloudReady())return null;return await v10CreatePlayer(id,localStorage.mcLang||'en',state);}

async function createNewPlayer(){
  const id=makeId();
  const p={player_id:id,display_name:'Player',language:localStorage.mcLang||'en',created_at:new Date().toISOString()};
  const initialState={};
  if(cloudReady()){
    try{const cloud=await cloudCreate(id,initialState);if(cloud?.player_id)p.created_at=cloud.created_at||p.created_at;}
    catch(e){console.warn('v10 create player failed',e);}
  }
  player=p;activeSlot=1;slots=ensureSlots([]);slots[0].state=initialState;slots[0].revision=0;
  setLocalPlayer({...p,slots});localStorage.setItem(SLOT_KEY,'1');
  if(initialState && Object.keys(initialState).length) applyState(initialState);
  renderSlots();show('slots');
  dispatchLoaded();
}

async function continuePlayer(id){
  const wanted=(id||'').trim().toUpperCase();
  if(!/^MC-[A-Z0-9]{6}$/.test(wanted)){showError('Enter a valid Player ID.');return;}
  busy=true;showError('');setStatus('SYNCING');
  try{
    let cloud=await cloudGet(wanted);
    if(!cloud){
      const lp=getLocalPlayer();
      if(lp?.player_id===wanted)cloud={player_id:wanted,slots:lp.slots||[]};
    }
    if(!cloud){showError('Player ID not found.');setStatus(cloudReady()?'LOCAL':'LOCAL');return;}
    player={player_id:wanted,display_name:cloud.display_name||'Player',language:cloud.language||localStorage.mcLang||'en',created_at:cloud.created_at||new Date().toISOString()};
    slots=ensureSlots(cloud.slots||[]);
    activeSlot=getActiveSlot(); if(!slots[activeSlot-1])activeSlot=1;
    setLocalPlayer({...player,slots});
    renderSlots();show('slots');
    setStatus(cloudReady()?'CONNECTED':'LOCAL');
  }catch(e){console.warn('v10 player load failed',e);showError('Cloud connection failed. Try again or use the local player.');setStatus('FAILED');}
  finally{busy=false;}
}

async function selectSlot(n){
  if(busy)return; busy=true;showError('');
  const target=slots[n-1]||defaultSlot(n);
  try{
    let state=target.state||{};
    if(!state||Object.keys(state).length===0){
      if(n===1 && hasLocalGameData() && player?.player_id===getLocalPlayer()?.player_id) state=localState();
      else state=blankState();
    }
    applyState(state);
    activeSlot=n;localStorage.setItem(SLOT_KEY,String(n));
    target.state=state;target.slot_no=n;target.revision=Number(target.revision||0);
    slots[n-1]=target;
    setLocalPlayer({...player,slots});
    dispatchLoaded();
    show('game');
    setStatus(cloudReady()?'CONNECTED':'LOCAL');
    if(cloudReady())await saveActiveSlot();
  }catch(e){console.warn('v10 slot select failed',e);showError('Could not open this save slot.');}
  finally{busy=false;}
}

async function saveActiveSlot(){
  if(!player?.player_id||!activeSlot)return false;
  const idx=activeSlot-1;const current=slots[idx]||defaultSlot(activeSlot);
  const state=localState();const nextRev=Number(current.revision||0)+1;
  try{
    if(cloudReady()){
      const result=await v10SaveSlot(player.player_id,activeSlot,current.slot_name||`Slot ${activeSlot}`,state,nextRev);
      if(result?.accepted===false){
        const fresh=await cloudGet(player.player_id);if(fresh){slots=ensureSlots(fresh.slots);const latest=slots[idx];if(Number(latest.revision||0)>=Number(current.revision||0)){applyState(latest.state||{});return false;}}
      }else if(result?.revision!==undefined)current.revision=Number(result.revision);
    }
    current.state=state;slots[idx]=current;setLocalPlayer({...player,slots});
    setStatus(cloudReady()?'CONNECTED':'LOCAL');return true;
  }catch(e){console.warn('v10 save slot failed',e);setStatus('FAILED');return false;}
}

function show(view){const screen=document.getElementById('mc-player-screen');if(screen)screen.classList.toggle('is-hidden',view==='game');document.querySelectorAll('#mc-player-screen .mc-player-view').forEach(e=>e.hidden=true);const el=document.querySelector(`#mc-player-screen [data-player-view="${view}"]`);if(el)el.hidden=false;}
function showError(msg){const e=document.getElementById('mc-player-error');if(e)e.textContent=msg||'';}
function renderSlots(){
  const slotId=document.getElementById('mc-player-slot-id');if(slotId)slotId.textContent=player?.player_id||'';
  const wrap=document.getElementById('mc-player-slots');if(!wrap)return;
  wrap.innerHTML=slots.map(s=>{const state=s.state||{};let records={};try{records=JSON.parse(state.mcPhase2RecordsV1||'{}')}catch{}const speed=records.speed?.bestScore||0,brain=records.brain?.bestScore||0;const used=Object.keys(state).length>0||Number(s.revision)>0;const L=(localStorage.mcLang||'en').toLowerCase();const T=L.startsWith('zh-hant')?['空白','已有紀錄','分數']:L.startsWith('zh')?['空白','已有记录','分数']:L.startsWith('ja')?['空き','保存済み','スコア']:L.startsWith('ko')?['비어 있음','저장됨','점수']:['EMPTY','SAVED DATA','SCORE'];return `<button class="mc-save-slot ${used?'has-data':''} ${Number(s.slot_no)===activeSlot?'active':''}" data-slot="${s.slot_no}"><strong>${s.slot_name||`Slot ${s.slot_no}`}</strong><span>${used?`${T[2]} ${Math.max(speed,brain).toLocaleString()}`:T[0]}</span><small>${used?T[1]: (T[0]==='EMPTY'?'NEW SAVE':'新存檔')}</small></button>`;}).join('');
  wrap.querySelectorAll('[data-slot]').forEach(b=>b.addEventListener('click',()=>selectSlot(Number(b.dataset.slot))));
}

export function getPlayerIdentity(){return {playerId:player?.player_id||getLocalPlayer()?.player_id||'',slot:activeSlot};}
async function migrateLegacyPlayer(){
  const existing=getLocalPlayer();
  if(existing?.player_id)return existing;
  if(!hasLocalGameData())return null;
  const id=makeId();const state=localState();
  const p={player_id:id,display_name:'Player',language:localStorage.mcLang||'en',created_at:new Date().toISOString(),slots:ensureSlots([{slot_no:1,slot_name:'Slot 1',revision:0,state}])};
  if(cloudReady()){try{await cloudCreate(id,state);}catch(e){console.warn('v10 legacy migration cloud create failed',e);}}
  setLocalPlayer(p);localStorage.setItem(SLOT_KEY,'1');return p;
}

function localizePlayerUI(){
  const l=(localStorage.mcLang||navigator.language||'en').toLowerCase();
  const k=l.startsWith('zh-hant')||l.includes('hk')||l.includes('tw')?'zh-Hant':l.startsWith('zh')?'zh-Hans':l.startsWith('ja')?'ja':l.startsWith('ko')?'ko':'en';
  const T={en:{title:'PLAYER',sub:'Continue your game or start a new player.',this:'THIS BROWSER',continue:'CONTINUE',new:'NEW PLAYER',or:'OR',id:'PLAYER ID',copy:'COPY',back:'BACK',empty:'EMPTY',saved:'SAVED DATA',score:'SCORE',newSave:'NEW SAVE'},'zh-Hant':{title:'玩家',sub:'繼續遊戲或建立新玩家。',this:'此瀏覽器',continue:'繼續',new:'新玩家',or:'或',id:'玩家 ID',copy:'複製',back:'返回',empty:'空白',saved:'已有紀錄',score:'分數',newSave:'新存檔'},'zh-Hans':{title:'玩家',sub:'继续游戏或建立新玩家。',this:'此浏览器',continue:'继续',new:'新玩家',or:'或',id:'玩家 ID',copy:'复制',back:'返回',empty:'空白',saved:'已有记录',score:'分数',newSave:'新存档'},ja:{title:'プレイヤー',sub:'ゲームを続けるか、新しいプレイヤーを作成します。',this:'このブラウザ',continue:'続ける',new:'新規プレイヤー',or:'または',id:'プレイヤー ID',copy:'コピー',back:'戻る',empty:'空き',saved:'保存済み',score:'スコア',newSave:'新規セーブ'},ko:{title:'플레이어',sub:'게임을 계속하거나 새 플레이어를 시작하세요.',this:'이 브라우저',continue:'계속',new:'새 플레이어',or:'또는',id:'플레이어 ID',copy:'복사',back:'뒤로',empty:'비어 있음',saved:'저장됨',score:'점수',newSave:'새 저장'}}[k];
  const set=(sel,key)=>{const e=document.querySelector(sel);if(e)e.textContent=T[key];};
  set('#mc-player-screen .mc-player-title','title');set('#mc-player-screen .mc-player-subtitle','sub');set('#mc-player-local-card span','this');set('#mc-player-local-continue','continue');set('#mc-player-new','new');set('.mc-player-divider span','or');set('#mc-player-screen .mc-player-label','id');set('#mc-player-continue','continue');set('.mc-player-slot-head span','id');set('#mc-player-copy','copy');set('#mc-player-slots-back','back');
}

export async function initPlayerSystem(){
  const screen=document.getElementById('mc-player-screen');if(!screen)return;
  localizePlayerUI();
  const migrated=await migrateLegacyPlayer();
  const local=migrated||getLocalPlayer();slots=localSlots();activeSlot=getActiveSlot();
  document.getElementById('mc-player-new')?.addEventListener('click',createNewPlayer);
  document.getElementById('mc-player-continue')?.addEventListener('click',()=>continuePlayer(document.getElementById('mc-player-id')?.value));
  document.getElementById('mc-player-local-continue')?.addEventListener('click',()=>{const p=getLocalPlayer();if(p)continuePlayer(p.player_id);});
  document.getElementById('mc-player-slots-back')?.addEventListener('click',()=>show('start'));
  document.getElementById('mc-player-copy')?.addEventListener('click',async()=>{if(player?.player_id)try{await navigator.clipboard.writeText(player.player_id);}catch{}});
  const localCard=document.getElementById('mc-player-local-card');if(localCard)localCard.hidden=!local;
  const localId=document.getElementById('mc-player-local-id');if(localId)localId.textContent=local?.player_id||'';
  const slotId=document.getElementById('mc-player-slot-id');if(slotId)slotId.textContent=local?.player_id||'';
  show('start');
  const queueSave=()=>{saveQueue=saveQueue.then(()=>saveActiveSlot()).catch(e=>{console.warn('v10 queued save failed',e);});return saveQueue;};
  window.addEventListener('mathcube-record-updated',queueSave);
  window.addEventListener('mathcube-save-request',queueSave);
  window.mathCubeV10Save=queueSave;
  window.mathCubeV10Player=()=>getPlayerIdentity();
  if(local)document.getElementById('mc-player-id').value=local.player_id;
}

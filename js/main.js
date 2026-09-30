import { init, showSelect } from './game.js';
import { cloudReady } from './supabase.js';
import { getGoldenApples, addGoldenApples, setGoldenApples, spendGoldenApples, getPoints, setPoints, getScore, addScore } from './economy.js';
import { initPlayerSystem, getPlayerIdentity } from './player.js';

window.addEventListener('error',e=>{
  const d=document.getElementById('loading');
  if(d){d.style.display='flex';d.textContent='ERROR: '+e.message;}
});

const I18N={
 en:{points:'POINTS',gameTitle:'MATH CUBE',menu:'MENU',score:'SCORE',tagline:'Think fast. Choose smart.',classic:'CLASSIC',normalMode:'NORMAL MODE',normalDesc:'Explore the 3D Math Cube.',challenge:'TRAINING',speedMode:'SPEED TRAINING',speedDesc:'Fast answers. Strong accuracy. Keep the combo.',brainMode:'BRAIN TRAINING',brainDesc:'Think deeper. Difficulty rises.',pointsShop:'GOLDEN APPLE SHOP',language:'LANGUAGE',question:'QUESTION',whichCorrect:'Which equation is correct?',primary:'PRIMARY',highSchool:'HIGH SCHOOL',audience:'AUDIENCE',runOver:'RUN OVER',restart:'RESTART',home:'HOME',hint:'HINT',askPrimary:'ASK PRIMARY STUDENT',askSecondary:'ASK SECONDARY STUDENT',askAudience:'ASK AUDIENCE',buy:'BUY',currentApples:'CURRENT GOLDEN APPLES',newApples:'NEW GOLDEN APPLES',purchaseComplete:'PURCHASE COMPLETE',notEnoughApples:'NOT ENOUGH GOLDEN APPLES',close:'CLOSE',cost:'COST',remaining:'REMAINING',chance:'CHANCE',seconds:'s',starter:'STARTER',primaryLevel:'PRIMARY',primaryAdvanced:'PRIMARY ADVANCED',secondaryLevel:'SECONDARY',secondaryAdvanced:'SECONDARY ADVANCED',areaOf:'Area of',rectangle:'rectangle',volume:'Volume',triangle:'Triangle',solveFor:'Solve for',twoRemoved:'Two incorrect choices have been removed.',mistake:'mistake',mistakes:'mistakes',totalScore:'TOTAL SCORE',endGame:'END GAME',combo:'COMBO',grade:'GRADE',time:'TIME',accuracy:'ACCURACY',best:'BEST',bestCombo:'BEST COMBO',fastest:'FASTEST',average:'AVERAGE',level:'LEVEL',goldenApples:'GOLDEN APPLES',cloud:'CLOUD',connected:'CONNECTED',local:'LOCAL',syncing:'SYNCING',syncFailed:'OFFLINE SAVE',sessionSaved:'SESSION SAVED',speedResult:'SPEED TRAINING',brainResult:'BRAIN TRAINING',applesEarned:'APPLES EARNED',modeSpeed:'SPEED',modeBrain:'BRAIN',questionTime:'ANSWER TIME',notConfigured:'SUPABASE NOT CONFIGURED',records:'MY RECORDS',questions:'QUESTIONS',continueGame:'CONTINUE',spendPoint:'SPEND 1 POINT',notNow:'NOT NOW',continueQuestion:'Spend 1 point to continue?',achievements:'ACHIEVEMENTS',collection:'COLLECTION',challenges:'CHALLENGES',unlocked:'UNLOCKED',locked:'LOCKED',daily:'DAILY CHALLENGE',weekly:'WEEKLY CHALLENGE',progress:'PROGRESS',reward:'REWARD',owned:'OWNED',equip:'EQUIP',equipped:'EQUIPPED',easy:'EASY',medium:'MEDIUM',hard:'HARD',selectLevel:'SELECT LEVEL',questions20:'20 QUESTIONS',questions40:'40 QUESTIONS',questions60:'60 QUESTIONS',excellent:'EXCELLENT',nice:'NICE',good:'GOOD',miss:'MISS',sProgress:'S',levelSpeed:'SPEED LEVEL',levelBrain:'BRAIN LEVEL'},
 'zh-Hant':{points:'點數',gameTitle:'數學魔方',menu:'選單',score:'分數',tagline:'快速思考，聰明選擇。',classic:'經典',normalMode:'普通模式',normalDesc:'探索 3D 數學魔方。',challenge:'訓練',speedMode:'速度訓練',speedDesc:'快速作答，保持準確，維持連擊。',brainMode:'腦力訓練',brainDesc:'深入思考，難度逐步提升。',pointsShop:'金蘋果商店',language:'語言',question:'題目',whichCorrect:'哪條算式是正確的？',primary:'小學生',highSchool:'中學生',audience:'觀眾',runOver:'本次結束',restart:'重新開始',home:'首頁',hint:'提示',askPrimary:'問小學生',askSecondary:'問中學生',askAudience:'問觀眾',buy:'購買',currentApples:'目前金蘋果',newApples:'購買後金蘋果',purchaseComplete:'購買成功',notEnoughApples:'金蘋果不足',close:'關閉',cost:'價格',remaining:'剩餘',chance:'次數',seconds:'秒',starter:'入門',primaryLevel:'小學',primaryAdvanced:'小學進階',secondaryLevel:'中學',secondaryAdvanced:'中學進階',areaOf:'面積',rectangle:'長方形',volume:'體積',triangle:'三角形',solveFor:'求',twoRemoved:'已移除兩個錯誤答案。',mistake:'次錯誤',mistakes:'次錯誤',totalScore:'總分',endGame:'結束遊戲',combo:'連擊',grade:'等級',time:'時間',accuracy:'準確率',best:'最佳',bestCombo:'最佳連擊',fastest:'最快',average:'平均',level:'等級',goldenApples:'金蘋果',cloud:'雲端',connected:'已連線',local:'本機',syncing:'同步中',syncFailed:'離線儲存',sessionSaved:'已儲存紀錄',speedResult:'速度訓練',brainResult:'腦力訓練',applesEarned:'獲得金蘋果',modeSpeed:'速度',modeBrain:'腦力',questionTime:'答題時間',notConfigured:'尚未設定 Supabase',records:'我的紀錄',questions:'題數',continueGame:'繼續遊戲',spendPoint:'花費 1 點繼續',notNow:'暫不繼續',continueQuestion:'是否花費 1 點繼續遊戲？',achievements:'成就',collection:'收藏',challenges:'挑戰',unlocked:'已解鎖',locked:'未解鎖',daily:'每日挑戰',weekly:'每週挑戰',progress:'進度',reward:'獎勵',owned:'已擁有',equip:'裝備',equipped:'已裝備',easy:'簡單',medium:'中等',hard:'困難',selectLevel:'選擇難度',questions20:'20 題',questions40:'40 題',questions60:'60 題',excellent:'Excellent',nice:'Nice',good:'Good',miss:'Miss',sProgress:'S',levelSpeed:'速度等級',levelBrain:'腦力等級'},
 'zh-Hans':{points:'点数',gameTitle:'数学魔方',menu:'菜单',score:'分数',tagline:'快速思考，聪明选择。',classic:'经典',normalMode:'普通模式',normalDesc:'探索 3D 数学魔方。',challenge:'训练',speedMode:'速度训练',speedDesc:'快速作答，保持准确，维持连击。',brainMode:'脑力训练',brainDesc:'深入思考，难度逐步提升。',pointsShop:'金苹果商店',language:'语言',question:'题目',whichCorrect:'哪条算式是正确的？',primary:'小学生',highSchool:'中学生',audience:'观众',runOver:'本次结束',restart:'重新开始',home:'首页',hint:'提示',askPrimary:'问小学生',askSecondary:'问中学生',askAudience:'问观众',buy:'购买',currentApples:'目前金苹果',newApples:'购买后金苹果',purchaseComplete:'购买成功',notEnoughApples:'金苹果不足',close:'关闭',cost:'价格',remaining:'剩余',chance:'次数',seconds:'秒',starter:'入门',primaryLevel:'小学',primaryAdvanced:'小学进阶',secondaryLevel:'小学进阶',secondaryAdvanced:'中学进阶',areaOf:'面积',rectangle:'长方形',volume:'体积',triangle:'三角形',solveFor:'求',twoRemoved:'已移除两个错误答案。',mistake:'次错误',mistakes:'次错误',totalScore:'总分',endGame:'结束游戏',combo:'连击',grade:'等级',time:'时间',accuracy:'准确率',best:'最佳',bestCombo:'最佳連擊',fastest:'最快',average:'平均',level:'等级',goldenApples:'金苹果',cloud:'云端',connected:'已连接',local:'本机',syncing:'同步中',syncFailed:'离线保存',sessionSaved:'已保存记录',speedResult:'速度训练',brainResult:'脑力训练',applesEarned:'获得金苹果',modeSpeed:'速度',modeBrain:'脑力',questionTime:'答题时间',notConfigured:'尚未设置 Supabase',records:'我的记录',questions:'题数',continueGame:'继续游戏',spendPoint:'花费 1 点继续',notNow:'暂不继续',continueQuestion:'是否花费 1 点继续游戏？',achievements:'成就',collection:'收藏',challenges:'挑战',unlocked:'已解锁',locked:'未解锁',daily:'每日挑战',weekly:'每周挑战',progress:'进度',reward:'奖励',owned:'已拥有',equip:'装备',equipped:'已装备',easy:'简单',medium:'中等',hard:'困难',selectLevel:'选择难度',questions20:'20 题',questions40:'40 题',questions60:'60 题',excellent:'Excellent',nice:'Nice',good:'Good',miss:'Miss',sProgress:'S',levelSpeed:'速度等级',levelBrain:'脑力等级'},
 ja:{points:'ポイント',gameTitle:'数学キューブ',menu:'メニュー',score:'スコア',tagline:'すばやく考えて、正しく選ぼう。',classic:'クラシック',normalMode:'ノーマルモード',normalDesc:'3D数学キューブに挑戦。',challenge:'トレーニング',speedMode:'スピードトレーニング',speedDesc:'速く正確に答えて、コンボを伸ばそう。',brainMode:'ブレイントレーニング',brainDesc:'深く考えて、難易度を上げよう。',pointsShop:'ゴールデンアップルショップ',language:'言語',question:'問題',whichCorrect:'正しい式はどれ？',primary:'小学生',highSchool:'中学生',audience:'観客',runOver:'終了',restart:'もう一度',home:'ホーム',hint:'ヒント',askPrimary:'小学生に聞く',askSecondary:'中学生に聞く',askAudience:'観客に聞く',buy:'購入',currentApples:'現在のゴールデンアップル',newApples:'購入後のゴールデンアップル',purchaseComplete:'購入完了',notEnoughApples:'ゴールデンアップル不足',close:'閉じる',cost:'価格',remaining:'残り',chance:'回',seconds:'秒',starter:'初級',primaryLevel:'小学生',primaryAdvanced:'小学生・発展',secondaryLevel:'中学生',secondaryAdvanced:'中学生・発展',areaOf:'面積',rectangle:'長方形',volume:'体積',triangle:'三角形',solveFor:'求める',twoRemoved:'不正解の選択肢を2つ削除しました。',mistake:'ミス',mistakes:'ミス',totalScore:'合計スコア',endGame:'ゲーム終了',combo:'コンボ',grade:'ランク',time:'時間',accuracy:'正確さ',best:'ベスト',bestCombo:'ベストコンボ',fastest:'最速',average:'平均',level:'レベル',goldenApples:'ゴールデンアップル',cloud:'クラウド',connected:'接続済み',local:'ローカル',syncing:'同期中',syncFailed:'オフライン保存',sessionSaved:'記録を保存しました',speedResult:'スピードトレーニング',brainResult:'ブレイントレーニング',applesEarned:'獲得アップル',modeSpeed:'スピード',modeBrain:'ブレイン',questionTime:'回答時間',notConfigured:'Supabase未設定',records:'マイ記録',questions:'問題数',continueGame:'1ポイントで続ける',spendPoint:'1ポイント使って続ける',notNow:'今回はやめる',continueQuestion:'1ポイント使って続けますか？',achievements:'実績',collection:'コレクション',challenges:'チャレンジ',unlocked:'解除済み',locked:'未解除',daily:'デイリーチャレンジ',weekly:'ウィークリーチャレンジ',progress:'進行',reward:'報酬',owned:'所持',equip:'装備',equipped:'装備中',easy:'初級',medium:'中級',hard:'上級',selectLevel:'レベルを選択',questions20:'20問',questions40:'40問',questions60:'60問',excellent:'Excellent',nice:'Nice',good:'Good',miss:'Miss',sProgress:'S',levelSpeed:'スピードレベル',levelBrain:'ブレインレベル'},
 ko:{points:'포인트',gameTitle:'수학 큐브',menu:'메뉴',score:'점수',tagline:'빠르게 생각하고 정확하게 선택하세요.',classic:'클래식',normalMode:'일반 모드',normalDesc:'3D 수학 큐브를 탐험하세요.',challenge:'트레이닝',speedMode:'스피드 트레이닝',speedDesc:'빠르고 정확하게 답하며 콤보를 유지하세요.',brainMode:'브레인 트레이닝',brainDesc:'깊게 생각하며 난이도를 높이세요.',pointsShop:'골든 애플 상점',language:'언어',question:'문제',whichCorrect:'올바른 식은 무엇일까요?',primary:'초등학생',highSchool:'중학생',audience:'관객',runOver:'게임 종료',restart:'다시 시작',home:'홈',hint:'힌트',askPrimary:'초등학생에게 묻기',askSecondary:'중학생에게 묻기',askAudience:'관객에게 묻기',buy:'구매',currentApples:'현재 골든 애플',newApples:'구매 후 골든 애플',purchaseComplete:'구매 완료',notEnoughApples:'골든 애플이 부족합니다',close:'닫기',cost:'가격',remaining:'남음',chance:'회',seconds:'초',starter:'입문',primaryLevel:'초등',primaryAdvanced:'초등 심화',secondaryLevel:'중등',secondaryAdvanced:'중등 심화',areaOf:'넓이',rectangle:'직사각형',volume:'부피',triangle:'삼각형',solveFor:'구하기',twoRemoved:'틀린 선택지 2개를 제거했습니다.',mistake:'회 실수',mistakes:'회 실수',totalScore:'총점',endGame:'게임 종료',combo:'콤보',grade:'등급',time:'시간',accuracy:'정확도',best:'최고',bestCombo:'최고 콤보',fastest:'최고 속도',average:'평균',level:'레벨',goldenApples:'골든 애플',cloud:'클라우드',connected:'연결됨',local:'로컬',syncing:'동기화 중',syncFailed:'오프라인 저장',sessionSaved:'기록 저장됨',speedResult:'스피드 트레이닝',brainResult:'브레인 트레이닝',applesEarned:'획득 애플',modeSpeed:'스피드',modeBrain:'브레인',questionTime:'답변 시간',notConfigured:'Supabase 미설정',records:'내 기록',questions:'문제 수',continueGame:'계속하기',spendPoint:'포인트 1개 사용',notNow:'나중에',continueQuestion:'포인트 1개를 사용하여 계속할까요?',achievements:'업적',collection:'컬렉션',challenges:'도전',unlocked:'해금됨',locked:'잠김',daily:'일일 도전',weekly:'주간 도전',progress:'진행',reward:'보상',owned:'보유',equip:'장착',equipped:'장착됨',easy:'쉬움',medium:'보통',hard:'어려움',selectLevel:'레벨 선택',questions20:'20문제',questions40:'40문제',questions60:'60문제',excellent:'EXCELLENT',nice:'NICE',good:'GOOD',miss:'MISS',sProgress:'S',levelSpeed:'스피드 레벨',levelBrain:'브레인 레벨'}
};

const $=id=>document.getElementById(id);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
if(localStorage.mcPointsV2Initialized!=='1'){localStorage.mcHearts='10';localStorage.mcPointsV2Initialized='1';}else if(localStorage.mcHearts===null || Number(localStorage.mcHearts)<0)localStorage.mcHearts='10';
if(localStorage.mcScore===null)localStorage.mcScore='0';
if(localStorage.mcGoldenApples===null)localStorage.mcGoldenApples=String(Number(localStorage.mathCubeProgress?0:0));
let lang=localStorage.mcLang||detectLanguage();
function detectLanguage(){const n=(navigator.language||'en').toLowerCase();if(n.startsWith('zh-hant')||n.includes('hk')||n.includes('tw'))return'zh-Hant';if(n.startsWith('zh'))return'zh-Hans';if(n.startsWith('ja'))return'ja';if(n.startsWith('ko'))return'ko';return'en'}
function t(k){return I18N[lang]?.[k]||I18N.en[k]||k}
function applyLanguage(){document.documentElement.lang=lang;document.querySelectorAll('[data-mc-i18n]').forEach(e=>e.textContent=t(e.dataset.mcI18n));}
function initHomeResponsive(){
  const home=$('mc-home');
  if(!home)return;
  const root=document.documentElement;
  let raf=0;
  const update=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const w=Math.max(1,root.clientWidth||window.innerWidth);
      const h=Math.max(1,root.clientHeight||window.innerHeight);
      const portrait=w<h;
      const narrow=portrait&&w<=650;
      /* One shared scale keeps every homepage cell and its typography proportional. */
      const available=Math.max(260,w-20);
      const scale=narrow?Math.max(.72,Math.min(1,available/390)):1;
      home.style.setProperty('--mc-home-scale',scale.toFixed(3));
      home.dataset.layout=narrow?'narrow-portrait':portrait?'portrait':'landscape';
    });
  };
  const ro=new ResizeObserver(update);
  ro.observe(home);
  window.addEventListener('resize',update,{passive:true});
  window.addEventListener('orientationchange',update,{passive:true});
  update();
}
function updateGlobalCellScale(){
  const root=document.documentElement;
  const vv=window.visualViewport;
  const w=Math.max(1,Math.round(vv?.width||window.innerWidth));
  const h=Math.max(1,Math.round(vv?.height||window.innerHeight));
  const landscape=w>h;
  const baseW=landscape?844:430;
  const baseH=landscape?390:844;
  const raw=Math.min(w/baseW,h/baseH);
  const scale=Math.max(.72,Math.min(1,raw));
  root.style.setProperty('--mc-ui-scale',scale.toFixed(3));
}
updateGlobalCellScale();
window.addEventListener('resize',updateGlobalCellScale,{passive:true});
window.visualViewport?.addEventListener('resize',updateGlobalCellScale,{passive:true});

function setCloudStatus(state){const el=$('mc-cloud-status');if(!el)return;el.dataset.state=state;el.textContent=t(state==='connected'?'connected':state==='syncing'?'syncing':state==='failed'?'syncFailed':'local');}
function refreshPlayerBadge(){const p=getPlayerIdentity();const el=$('mc-player-home-id');if(el)el.textContent=p.playerId?`PLAYER ${p.playerId} · SLOT ${p.slot}`:'';const sid=$('mc-player-slot-id');if(sid)sid.textContent=p.playerId||'';}
window.addEventListener('mathcube-player-loaded',()=>{refreshPlayerBadge();updateWallet();try{refreshPhase2UI();}catch{} });
function bootCloud(){setCloudStatus(cloudReady()?'connected':'local');}
function showHome(){clearInterval(run?.timer);if(run)run.ending=true;document.querySelectorAll('.mc-screen').forEach(e=>e.classList.remove('mc-active'));document.querySelectorAll('.mc-modal').forEach(e=>e.classList.remove('mc-open'));$('mc-home').classList.add('mc-active');$('screen-select').classList.remove('active');$('screen-result').classList.remove('active');$('hud').classList.remove('active');updateWallet();}
function showTraining(mode){
  document.querySelectorAll('.mc-screen').forEach(e=>e.classList.remove('mc-active'));
  $('mc-training-level-screen').classList.add('mc-active');
  $('mc-level-mode').textContent=mode==='speed'?t('speedMode'):t('brainMode');
  document.querySelectorAll('#mc-training-level-screen .mc-level-btn').forEach(b=>{b.dataset.mode=mode;});
}
function updateWallet(){const p=getPoints(),a=getGoldenApples();$('mc-score').textContent=getScore().toLocaleString();$('mc-points').textContent='('+p+')';$('mc-apples').textContent=a.toLocaleString();const normalApple=$('apple-count');if(normalApple)normalApple.textContent=a;}

window.addEventListener('mathcube-home',showHome);
$('mc-normal').addEventListener('click',()=>{$('mc-home').classList.remove('mc-active');showSelect();});
$('normal-select-home')?.addEventListener('click',showHome);
$('normal-result-home')?.addEventListener('click',showHome);
$('mc-speed-btn').addEventListener('click',()=>showTraining('speed'));
$('mc-brain-btn').addEventListener('click',()=>showTraining('brain'));
$('mc-endless-back').addEventListener('click',showHome);
$('mc-language').addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); $('mc-language-modal').classList.add('mc-open'); });
$('mc-settings').addEventListener('click',()=>$('mc-menu-modal').classList.add('mc-open'));
$('mc-menu-close').addEventListener('click',()=>$('mc-menu-modal').classList.remove('mc-open'));
$('mc-language-close').addEventListener('click',()=>$('mc-language-modal').classList.remove('mc-open'));
$('mc-records').addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); openRecords(); });
$('mc-records-close').addEventListener('click',()=>$('mc-records-modal').classList.remove('mc-open'));
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;localStorage.mcLang=lang;applyLanguage();window.dispatchEvent(new Event('mathcube-save-request'));setCloudStatus(cloudReady()?'syncing':'local');$('mc-language-modal').classList.remove('mc-open');}));
$('mc-shop').addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); refreshShop();$('mc-shop-modal').classList.add('mc-open')});
$('mc-shop-close').addEventListener('click',()=>$('mc-shop-modal').classList.remove('mc-open'));
$('mc-purchase-close').addEventListener('click',()=>$('mc-purchase-modal').classList.remove('mc-open'));$('mc-purchase-ok').addEventListener('click',()=>$('mc-purchase-modal').classList.remove('mc-open'));
function formatRecordSeconds(value){const n=Number(value||0);return n>0?`${n.toFixed(1)}s`:'—';}
function setRecordValue(id,value){const el=$(id);if(el)el.textContent=value;}
function renderRecords(data){
  const speed=data?.speed||null,brain=data?.brain||null,profile=data?.profile||null;
  const local=p2Records();
  setRecordValue('mc-rec-normal-score',Number(local.normal?.score||0).toLocaleString());
  setRecordValue('mc-rec-normal-levels',Number(local.normal?.levels||0));
  setRecordValue('mc-rec-normal-stars',Number(local.normal?.stars||0));
  setRecordValue('mc-records-player',profile?.display_name||'PLAYER');
  setRecordValue('mc-rec-speed-score',Number(speed?.best_score||0).toLocaleString());
  setRecordValue('mc-rec-speed-combo',Number(speed?.best_combo||0));
  setRecordValue('mc-rec-speed-accuracy',`${Math.round(Number(speed?.best_accuracy||0)*100)}%`);
  setRecordValue('mc-rec-speed-fastest',formatRecordSeconds(speed?.fastest_answer));
  setRecordValue('mc-rec-speed-average',formatRecordSeconds(speed?.average_answer_time));
  setRecordValue('mc-rec-speed-questions',Number(speed?.questions_completed||0).toLocaleString());
  setRecordValue('mc-rec-brain-score',Number(brain?.best_score||0).toLocaleString());
  setRecordValue('mc-rec-brain-combo',Number(brain?.best_combo||0));
  setRecordValue('mc-rec-brain-accuracy',`${Math.round(Number(brain?.best_accuracy||0)*100)}%`);
  setRecordValue('mc-rec-brain-level',Number(brain?.highest_level||0));
  setRecordValue('mc-rec-brain-difficulty',Number(brain?.highest_difficulty||0));
  setRecordValue('mc-rec-brain-questions',Number(brain?.questions_completed||0).toLocaleString());
  setRecordValue('mc-rec-apples',Number(profile?.golden_apples??getGoldenApples()).toLocaleString());
  const cloud=$('mc-record-cloud'); if(cloud){cloud.textContent=cloudReady()?t('connected'):t('local');cloud.dataset.state=cloudReady()?'connected':'local';}
}
async function openRecords(){
  $('mc-records-modal').classList.add('mc-open');
  renderRecords({speed:null,brain:null,profile:{display_name:getPlayerIdentity().playerId||'PLAYER',golden_apples:getGoldenApples()}});
  setCloudStatus(cloudReady()?'connected':'local');
}
function refreshShop(){const a=getGoldenApples();$('mc-shop-apples').textContent=a.toLocaleString();document.querySelectorAll('.mc-shop-item').forEach(b=>{b.disabled=a<Number(b.dataset.cost);});}
function showPurchaseResult(title,current,next,detail){$('mc-purchase-title').textContent=title;$('mc-purchase-current').textContent=current;$('mc-purchase-new').textContent=next;$('mc-purchase-detail').textContent=detail;$('mc-purchase-modal').classList.add('mc-open');}
document.querySelectorAll('.mc-shop-item').forEach(b=>b.addEventListener('click',async()=>{const cost=Number(b.dataset.cost),item=b.dataset.item||'item',itemId=b.dataset.itemId||'';const current=getGoldenApples();if(current<cost){showPurchaseResult(t('notEnoughApples'),current,current,`${t('cost')}: ${cost}`);return;}const inv=p2Inventory();if(inv.includes(itemId)){showPurchaseResult(t('purchaseComplete'),current,current,item);return;}const next=spendGoldenApples(cost);inv.push(itemId);p2Write(P2_INV,[...new Set(inv)]);showPurchaseResult(t('purchaseComplete'),current,next,`${item} · ${t('cost')}: ${cost}`);refreshShop();updateWallet();renderCollection();window.dispatchEvent(new Event('mathcube-save-request'));}));

let run={mode:'speed',level:'easy',totalQuestions:20,q:1,score:0,mistakes:0,time:12,timer:null,current:null,hints:{fifty:2,primary:2,high:2,audience:2},hintPercentages:null,combo:0,bestCombo:0,elapsed:0,startedAt:0,ending:false,correct:0,totalAnswered:0,answerTimes:[],highestDifficulty:1,appleReward:0,aQualified:false,aCombo:0};
function modeLabel(){return run.mode==='speed'?t('speedMode'):t('brainMode')}
function makeQuestion(){
  const q=run.q;
  const caps=run.mode==='speed'?{easy:3,medium:5,hard:7}:{easy:4,medium:7,hard:10};
  const cap=caps[run.level]||caps.easy;
  const d=run.mode==='speed'?Math.min(cap,1+Math.floor((q-1)/Math.max(1,Math.ceil(run.totalQuestions/3)))):Math.min(cap,1+Math.floor((q-1)/Math.max(1,Math.ceil(run.totalQuestions/10))));
  let ans=0, display='', choicePrefix='';
  const op=(a,b,s)=>({ans:a,display:`${a} ${s} = ?`,make:v=>`${a} ${s} = ${v}`});
  const types=[];
  types.push(()=>{const a=rnd(12+d*3,45+d*5),b=rnd(3,18+d*2);const x=op(a,b,'+');ans=x.ans+b;display=x.display;choicePrefix='';return v=>`${a} + ${b} = ${v}`;});
  types.push(()=>{const a=rnd(35+d*8,110+d*12),b=rnd(5,Math.min(a-1,35+d*4));ans=a-b;display=`${a} − ${b} = ?`;return v=>`${a} − ${b} = ${v}`;});
  types.push(()=>{const a=rnd(3,8+d),b=rnd(3,9+d);ans=a*b;display=`${a} × ${b} = ?`;return v=>`${a} × ${b} = ${v}`;});
  types.push(()=>{const b=rnd(3,10+d),x=rnd(3,12+d);ans=x;const a=b*x;display=`${a} ÷ ${b} = ?`;return v=>`${a} ÷ ${b} = ${v}`;});
  if(d>=2)types.push(()=>{const a=rnd(3,10),b=rnd(2,9),c=rnd(2,8);ans=a+b*c;display=`${a} + ${b} × ${c} = ?`;return v=>`${a} + ${b} × ${c} = ${v}`;});
  if(d>=3)types.push(()=>{const a=rnd(2,8),b=rnd(2,8),c=rnd(2,7);ans=(a+b)*c;display=`(${a} + ${b}) × ${c} = ?`;return v=>`(${a} + ${b}) × ${c} = ${v}`;});
  if(d>=4)types.push(()=>{const x=rnd(3,12),k=rnd(2,9);ans=x;display=`${k}x = ${k*x}  →  x = ?`;return v=>`${k}x = ${k*x}  →  x = ${v}`;});
  if(d>=5)types.push(()=>{const p=[10,20,25,50][rnd(0,3)],n=rnd(2,10)*10;ans=n*p/100;display=`${p}% × ${n} = ?`;return v=>`${p}% × ${n} = ${v}`;});
  if(d>=6)types.push(()=>{const a=rnd(3,9),b=rnd(3,9);ans=a*a+b;display=`${a}² + ${b} = ?`;return v=>`${a}² + ${b} = ${v}`;});
  if(d>=7)types.push(()=>{const x=rnd(3,9),k=rnd(2,8);ans=x;display=`x + ${k} = ${x+k}  →  x = ?`;return v=>`x + ${k} = ${x+k}  →  x = ${v}`;});
  if(d>=8)types.push(()=>{const a=rnd(4,12),b=rnd(2,6),c=rnd(2,5);ans=a*b-c;display=`${a} × ${b} − ${c} = ?`;return v=>`${a} × ${b} − ${c} = ${v}`;});
  if(d>=9)types.push(()=>{const a=rnd(2,9),b=rnd(2,9),c=rnd(2,5);ans=a*(b+c);display=`${a} × (${b} + ${c}) = ?`;return v=>`${a} × (${b} + ${c}) = ${v}`;});
  const makeChoice=types[rnd(0,types.length-1)]();
  const spread=Math.max(2,Math.round(Math.abs(ans)*(.08+(run.mode==='speed'?.04:.10))));
  const values=new Set([ans]);for(const delta of [-spread,-Math.ceil(spread/2),Math.ceil(spread/2),spread])values.add(ans+delta);while(values.size<4)values.add(ans+rnd(-Math.max(4,spread*2),Math.max(4,spread*2)));
  const choices=[...values].slice(0,4).sort(()=>Math.random()-.5);
  const low=ans-Math.max(2,Math.ceil(Math.abs(ans)*.18)),high=ans+Math.max(2,Math.ceil(Math.abs(ans)*.18));
  run.highestDifficulty=Math.max(run.highestDifficulty,d);
  return{display,ans,choices,choiceText:choices.map(makeChoice),low,high,difficulty:d};
}
function startTraining(mode,level='easy'){
  clearInterval(run.timer);
  $('mc-result').classList.remove('mc-open');
  const totals={easy:20,medium:40,hard:60};
  run={mode,level,totalQuestions:totals[level]||20,q:1,score:0,mistakes:0,time:mode==='speed'?12:25,timer:null,current:null,hints:{fifty:2,primary:2,high:2,audience:2},hintPercentages:null,combo:0,bestCombo:0,elapsed:0,startedAt:performance.now(),ending:false,correct:0,totalAnswered:0,answerTimes:[],highestDifficulty:1,appleReward:0,aQualified:false,aCombo:0,endingReason:''};
  $('mc-endless-screen').classList.add('mc-active');
  $('mc-mode-name').textContent=modeLabel();
  $('mc-qno').textContent='1 / '+run.totalQuestions;
  $('mc-run-time').textContent='0.0s';
  updateTrainingWallet();updateComboUI();renderQuestion();
}
function updateTrainingWallet(){$('mc-run-points').textContent='('+getPoints()+')';$('mc-run-apples').textContent=getGoldenApples().toLocaleString();$('mc-run-score').textContent=run.score.toLocaleString();}
function renderQuestion(){
  if(run.ending)return;
  run.current=makeQuestion();
  $('mc-qno').textContent=run.q+' / '+run.totalQuestions;
  $('mc-difficulty').textContent=run.mode==='speed'?t('primaryLevel'):run.current.difficulty<=2?t('starter'):run.current.difficulty<=4?t('primaryLevel'):run.current.difficulty<=6?t('primaryAdvanced'):run.current.difficulty<=8?t('secondaryLevel'):t('secondaryAdvanced');
  $('mc-equation').textContent=run.current.display;
  clearHintPercentages();
  $('mc-answers').innerHTML=run.current.choiceText.map((txt,i)=>`<button class="mc-answer" data-value="${run.current.choices[i]}"><span class="mc-answer-label">${'ABCD'[i]}</span><span class="mc-answer-text">${txt}</span><span class="mc-answer-percent" aria-hidden="true"></span></button>`).join('');
  document.querySelectorAll('.mc-answer').forEach(b=>b.addEventListener('click',()=>choose(b)));
  updateHintCounts();startTimer();
}
function startTimer(){
  clearInterval(run.timer);
  const levelTime=run.mode==='speed'?{easy:12,medium:10,hard:8}[run.level]||12:{easy:25,medium:22,hard:19}[run.level]||25;
  run.time=levelTime;
  const started=performance.now();$('mc-time-fill').style.width='100%';
  run.timer=setInterval(()=>{
    const elapsed=(performance.now()-started)/1000;run.elapsed=(performance.now()-run.startedAt)/1000;$('mc-run-time').textContent=run.elapsed.toFixed(1)+'s';
    const left=run.time-elapsed;$('mc-time-left').textContent=Math.max(0,left).toFixed(1);$('mc-time-fill').style.width=Math.max(0,left/run.time*100)+'%';
    if(left<=0){clearInterval(run.timer);wrong(true);}
  },100);
}
/* v8 Arcade Combo FX — Canvas particle burst + shockwave on every correct answer. */
const comboFX={
 canvas:null,ctx:null,raf:0,last:0,active:false,dpr:1,w:1,h:1,particles:[],rings:[],waves:[],beatUntil:0,beatLevel:0,resizeObs:null,
 tier(n){return n>=100?'extreme':n>=50?'ultra':n>=20?'hot':n>=10?'fire':n>=5?'warm':'normal';},
 colors:['#ffd54a','#ff9b3d','#fff7d1','#ff526d'],
 init(){this.canvas=$('mc-combo-fx-canvas');if(!this.canvas)return;this.ctx=this.canvas.getContext('2d',{alpha:true});if(!this.ctx)return;const r=()=>this.resize();addEventListener('resize',r,{passive:true});if(window.visualViewport)visualViewport.addEventListener('resize',r,{passive:true});if('ResizeObserver'in window){this.resizeObs=new ResizeObserver(r);this.resizeObs.observe($('mc-combo-station'));}r();},
 resize(){if(!this.canvas||!this.ctx)return;const r=this.canvas.getBoundingClientRect();this.dpr=Math.min(2.5,Math.max(1,devicePixelRatio||1));this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.canvas.width=Math.max(1,Math.round(this.w*this.dpr));this.canvas.height=Math.max(1,Math.round(this.h*this.dpr));this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);},
 wake(){if(this.active)return;this.active=true;this.last=performance.now();this.raf=requestAnimationFrame(t=>this.loop(t));},
 beat(combo,pulse){if(!this.ctx)return;const now=performance.now();this.beatLevel=Math.max(this.beatLevel,pulse?1:.55);this.beatUntil=now+(pulse?360:180);this.waves.push({life:pulse?.55:.34,maxLife:pulse?.55:.34,amp:pulse?(18+Math.min(32,combo*.18)):10+Math.min(20,combo*.12),phase:Math.random()*Math.PI*2,speed:3.5+Math.min(4,combo*.03)});this.wake();},
 hit(kind,combo){if(!this.ctx)return;this.resize();const strength=kind==='excellent'?1.45:kind==='nice'?1.12:.86,count=Math.round((kind==='excellent'?34:kind==='nice'?25:18)*strength),cx=this.w*.5,cy=this.h*.42,tier=this.tier(combo);for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=(130+Math.random()*250)*strength*(tier==='extreme'?1.2:tier==='ultra'?1.1:1);this.particles.push({x:cx+(Math.random()-.5)*12,y:cy+(Math.random()-.5)*8,vx:Math.cos(a)*s,vy:Math.sin(a)*s-55,g:170+Math.random()*190,drag:.86+Math.random()*.08,life:.48+Math.random()*.28,max:.76,r:1.5+Math.random()*4.2,a:.82+Math.random()*.18,shape:Math.random()<.25?'star':Math.random()<.25?'spark':'dot',color:this.colors[(Math.random()*this.colors.length)|0],rot:Math.random()*6.28});}this.rings.push({x:cx,y:cy,r:6,max:kind==='excellent'?84:kind==='nice'?68:54,life:.44,maxLife:.44,line:kind==='excellent'?4:kind==='nice'?3:2.4});if([10,50,100].includes(combo))this.milestone(combo,cx,cy);this.wake();},
 milestone(combo,cx,cy){const max=combo===100?132:combo===50?104:78;this.rings.push({x:cx,y:cy,r:8,max,life:.65,maxLife:.65,line:combo===100?6:combo===50?5:4});const n=combo===100?64:combo===50?48:34;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,s=220+Math.random()*170;this.particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:120,drag:.88,life:.58+Math.random()*.22,max:.8,r:2+Math.random()*4.5,a:1,shape:i%3?'star':'spark',color:this.colors[i%4],rot:a});}},
 loop(now){const dt=Math.min(.032,Math.max(.001,(now-this.last)/1000));this.last=now;const c=this.ctx;c.clearRect(0,0,this.w,this.h);c.save();c.globalCompositeOperation='lighter';let alive=false;for(const p of this.particles){p.life-=dt;if(p.life<=0)continue;alive=true;p.vx*=Math.pow(p.drag,dt*60);p.vy=p.vy*Math.pow(p.drag,dt*60)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r*=Math.pow(.93,dt*60);c.globalAlpha=Math.max(0,p.life/p.max)*p.a;c.fillStyle=p.color;if(p.shape==='dot'){c.beginPath();c.arc(p.x,p.y,Math.max(.6,p.r),0,Math.PI*2);c.fill();}else{c.save();c.translate(p.x,p.y);c.rotate(p.rot);if(p.shape==='spark'){c.strokeStyle=p.color;c.lineWidth=Math.max(1,p.r*.6);c.beginPath();c.moveTo(-p.r*2,0);c.lineTo(p.r*2,0);c.moveTo(0,-p.r*2);c.lineTo(0,p.r*2);c.stroke();}else{c.beginPath();for(let k=0;k<8;k++){const rr=k%2?p.r*.38:p.r,aa=k*Math.PI/4;c.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);}c.closePath();c.fill();}c.restore();}}this.particles=this.particles.filter(p=>p.life>0);for(const q of this.rings){q.life-=dt;if(q.life<=0)continue;alive=true;q.r+=(q.max-q.r)*Math.min(1,dt/.09);c.globalAlpha=Math.max(0,q.life/q.maxLife)*.9;c.strokeStyle='#ffd54a';c.lineWidth=q.line;c.beginPath();c.arc(q.x,q.y,q.r,0,Math.PI*2);c.stroke();}this.rings=this.rings.filter(q=>q.life>0);const beatNow=performance.now();if(this.beatUntil>beatNow)this.beatLevel=Math.max(this.beatLevel*.94,.18);else this.beatLevel*=.82;if(this.waves.length){alive=true;for(const w of this.waves){w.life-=dt;if(w.life<=0)continue;const prog=1-w.life/w.maxLife,alpha=Math.max(0,w.life/w.maxLife);c.globalAlpha=alpha*.52;c.strokeStyle='#70efff';c.lineWidth=1.4+this.beatLevel*2.2;c.beginPath();const base=this.h*.56;for(let x=0;x<=this.w;x+=8){const y=base+Math.sin(x*.045+w.phase+prog*w.speed)*.9*w.amp*this.beatLevel;if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}this.waves=this.waves.filter(w=>w.life>0);}if(this.beatLevel>.08){alive=true;c.globalAlpha=Math.min(.26,this.beatLevel*.22);c.strokeStyle='#ffd54a';c.lineWidth=1.2+this.beatLevel*2;c.beginPath();c.arc(this.w*.5,this.h*.42,18+this.beatLevel*28,0,Math.PI*2);c.stroke();}c.restore();if(alive)this.raf=requestAnimationFrame(t=>this.loop(t));else{this.active=false;this.raf=0;}},
 clear(){this.particles.length=0;this.rings.length=0;this.waves.length=0;this.beatLevel=0;this.beatUntil=0;if(this.ctx)this.ctx.clearRect(0,0,this.w,this.h);}
};
function comboFXFeedback(kind,combo){if(!comboFX.ctx)return;if(kind==='x'||kind==='miss'){comboFX.particles.length=Math.floor(comboFX.particles.length*.18);return;}comboFX.hit(kind,combo);}
function feedback(kind){
 const el=$('mc-answer-feedback');if(el){el.textContent=kind==='x'?'X':t(kind);el.dataset.type=kind;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(feedback._timer);feedback._timer=setTimeout(()=>el.classList.remove('show'),1050);}
 comboFXFeedback(kind,run.combo||0);
}
function clearSProgress(){run.aCombo=0;}
function updateGradeProgress(){
  const base=baseGradeForRun();
  const progress=Math.min(8,run.aCombo||0);
  const el=$('mc-s-progress');if(el)el.textContent=`${progress}/8`;
  if(run.aQualified)return run.aCombo>=8?'S':'A';
  return base;
}
function choose(b){
  if(run.ending)return;
  clearInterval(run.timer);clearHintPercentages();document.querySelectorAll('.mc-answer').forEach(x=>x.disabled=true);
  const answerTime=Math.max(.01,run.time-Number($('mc-time-left').textContent));run.totalAnswered++;run.answerTimes.push(answerTime);
  if(Number(b.dataset.value)===run.current.ans){
    b.classList.add('correct');run.correct++;
    const speedFactor=run.mode==='speed'?Math.max(.35,1-answerTime/Math.max(1,run.time)):1;
    const difficultyFactor=run.mode==='brain'?1+Math.min(2,run.current.difficulty*.12):1;
    const gain=Math.round((100+run.current.difficulty*20)*speedFactor*difficultyFactor);run.combo++;run.bestCombo=Math.max(run.bestCombo,run.combo);run.score+=gain+Math.min(300,run.combo*15);run.appleReward+=run.combo%10===0?1:0;
    if(run.aQualified)run.aCombo++; else if(baseGradeForRun()==='A'){run.aQualified=true;run.aCombo=1;}
    feedback(answerTime<=run.time*.25?'excellent':answerTime<=run.time*.55?'nice':'good');updateComboUI(true);updateTrainingWallet();
    if(run.q>=run.totalQuestions){setTimeout(()=>endRun('complete'),420);}else{run.q++;setTimeout(renderQuestion,320);}
  }else{b.classList.add('wrong');feedback('x');wrong(false);}
}
function wrong(timeout=false){
  if(run.ending)return;
  clearHintPercentages();run.totalAnswered++;run.answerTimes.push(run.time);run.mistakes++;run.combo=0;clearSProgress();updateComboUI();
  if(timeout)feedback('miss');
  document.querySelectorAll('.mc-answer').forEach(b=>{if(Number(b.dataset.value)===run.current.ans)b.classList.add('correct');});
  setTimeout(()=>{if(run.mistakes>=3)endRun(timeout?'timeout':'failed');else{run.q++;renderQuestion();}},650);
}
function baseGradeForRun(){
  const acc=run.totalAnswered?run.correct/run.totalAnswered:0;
  if(run.mode==='speed'){
    const avg=run.answerTimes.length?run.answerTimes.reduce((a,b)=>a+b,0)/run.answerTimes.length:99;
    const points=(acc*60)+Math.max(0,30-avg*6)+Math.min(10,run.bestCombo/3);
    return points>=80?'A':points>=70?'B':points>=58?'C':points>=45?'D':'E';
  }
  const points=(acc*65)+Math.min(25,run.highestDifficulty*2)+Math.min(10,run.bestCombo/2);
  return points>=80?'A':points>=70?'B':points>=58?'C':points>=45?'D':'E';
}
function gradeForRun(){return updateGradeProgress();}
function updateComboUI(pulse=false){
  const count=Math.max(0,run.combo||0),station=$('mc-combo-station'),fill=$('mc-combo-fill'),countEl=$('mc-combo-count');
  if(!station||!fill||!countEl)return;
  countEl.textContent=count;$('mc-combo-grade').textContent=gradeForRun();fill.style.width=Math.min(100,(count/20)*100)+'%';
  const tier=count>=100?'extreme':count>=50?'ultra':count>=20?'hot':count>=10?'fire':count>=5?'warm':'normal';
  station.className='mc-combo-station combo-'+(count>=20?'blue-intense':count>=12?'blue':count>=8?'red':count>=5?'orange':count>=3?'yellow':'none');station.dataset.comboTier=tier;station.dataset.combo=String(count);station.classList.toggle('combo-active',count>0);
  if(pulse){station.classList.remove('combo-pulse');countEl.classList.remove('mc-combo-pop');void station.offsetWidth;station.classList.add('combo-pulse');countEl.classList.add('mc-combo-pop');}
  $('mc-combo-fire').setAttribute('data-combo',count);if(comboFX&&comboFX.beat)comboFX.beat(count,pulse);
}
function clearHintPercentages(){run.hintPercentages=null;document.querySelectorAll('.mc-answer-percent').forEach(el=>{el.textContent='';el.classList.remove('visible');});}
function showHintPercentages(weights){
  const total=weights.reduce((a,b)=>a+b,0)||1;run.hintPercentages=run.current.choices.map((v,i)=>Math.round(weights[i]/total*100));
  document.querySelectorAll('.mc-answer').forEach((b,i)=>{const el=b.querySelector('.mc-answer-percent');if(el){el.textContent=`${run.hintPercentages[i]}%`;el.classList.add('visible');}});
}
function updateHintCounts(){
  Object.entries(run.hints).forEach(([k,v])=>{const id={fifty:'mc-fifty',primary:'mc-primary',high:'mc-high',audience:'mc-audience'}[k];if($(id)){const n=$(id).querySelector('strong');const label=$(id).querySelector('small');if(n)n.textContent=v;if(label)label.textContent=t('chance');$(id).parentElement.disabled=v<=0;}});
}
function openHint(type){
  if(!run.hints[type]||run.ending)return;
  run.hints[type]--;updateHintCounts();clearHintPercentages();document.querySelectorAll('.mc-answer').forEach(b=>b.classList.remove('removed','hint-suggestion'));
  if(type==='fifty'){
    [...document.querySelectorAll('.mc-answer')].filter(b=>Number(b.dataset.value)!==run.current.ans).sort(()=>Math.random()-.5).slice(0,2).forEach(b=>b.classList.add('removed'));
  } else if(type==='primary'||type==='high'){
    const reliability=type==='primary'?Math.max(.35,.94-run.q*.006):Math.max(.55,.97-run.q*.003);const correct=Math.random()<reliability;const answer=correct?run.current.ans:run.current.choices.filter(x=>x!==run.current.ans)[rnd(0,2)];const target=[...document.querySelectorAll('.mc-answer')].find(b=>Number(b.dataset.value)===answer);if(target)target.classList.add('hint-suggestion');
  } else if(type==='audience'){
    const weights=run.current.choices.map(()=>Math.random()*30+5);weights[run.current.choices.indexOf(run.current.ans)]+=Math.random()*25;showHintPercentages(weights);
  }
}
function endRun(reason='complete'){
  if(run.ending)return;
  clearInterval(run.timer);run.ending=true;run.endingReason=reason;clearHintPercentages();
  if(reason==='failed'||reason==='timeout'){
    const pts=getPoints();
    if(pts>0){$('mc-continue-text').textContent=t('continueQuestion');$('mc-continue-points').textContent=`${t('points')} (${pts})`;$('mc-brain-continue-modal').classList.add('mc-open');return;}
  }
  finishRun();
}
function finishRun(){
  const total=run.elapsed;const acc=run.totalAnswered?run.correct/run.totalAnswered:0;const grade=gradeForRun();
  run.appleReward+=run.correct>0?1:0;if(run.appleReward)addGoldenApples(run.appleReward);
  $('mc-result-mode').textContent=modeLabel();$('mc-result-title').textContent=modeLabel();$('mc-result-score').textContent=run.score.toLocaleString();$('mc-result-combo').textContent=run.bestCombo;$('mc-result-accuracy').textContent=Math.round(acc*100)+'%';$('mc-result-grade').textContent=grade;$('mc-result-time').textContent=total.toFixed(1)+'s';$('mc-result-apples').textContent='+'+run.appleReward;$('mc-result-detail').textContent=`${run.correct}/${run.totalAnswered} · ${run.level.toUpperCase()} · ${run.totalQuestions}Q`;
  recordLocalTraining();updateTrainingWallet();$('mc-result').classList.add('mc-open');
}

// Training controls: level selection, hints, end/continue.
document.querySelectorAll('#mc-training-level-screen .mc-level-btn').forEach(b=>b.addEventListener('click',()=>startTraining(b.dataset.mode||'speed',b.dataset.level||'easy')));
$('mc-level-home')?.addEventListener('click',showHome);
document.querySelectorAll('#mc-endless-screen .mc-hint').forEach(b=>b.addEventListener('click',()=>openHint(b.dataset.hint)));
$('mc-end-game')?.addEventListener('click',()=>endRun('manual'));
$('mc-continue-close')?.addEventListener('click',()=>{ $('mc-brain-continue-modal').classList.remove('mc-open');run.ending=false;finishRun(); });
$('mc-continue-no')?.addEventListener('click',()=>{ $('mc-brain-continue-modal').classList.remove('mc-open');finishRun(); });
$('mc-continue-yes')?.addEventListener('click',()=>{const p=getPoints();if(p<1){$('mc-brain-continue-modal').classList.remove('mc-open');finishRun();return;}setPoints(p-1);$('mc-brain-continue-modal').classList.remove('mc-open');run.ending=false;run.mistakes=0;updateTrainingWallet();renderQuestion();});
$('mc-restart').addEventListener('click',()=>{$('mc-result').classList.remove('mc-open');startTraining(run.mode,run.level)});
$('mc-result-home').addEventListener('click',()=>{$('mc-result').classList.remove('mc-open');showHome()});

// ===== Phase 2 progression layer =====
const P2_RECORDS='mcPhase2RecordsV1', P2_ACH='mcPhase2AchievementsV1', P2_INV='mcPhase2InventoryV1', P2_EQ='mcPhase2EquippedV1';
const p2Default={speed:{bestScore:0,bestCombo:0,accuracy:0,fastest:0,average:0,questions:0,games:0},brain:{bestScore:0,bestCombo:0,accuracy:0,highestLevel:0,highestDifficulty:0,questions:0,games:0},normal:{levels:0,stars:0,score:0}};
function p2Read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x&&typeof x==='object'?x:d;}catch{return d;}}
function p2Write(k,v){localStorage.setItem(k,JSON.stringify(v));}
function p2Records(){return p2Read(P2_RECORDS,JSON.parse(JSON.stringify(p2Default)));}
function p2SaveRecords(v){p2Write(P2_RECORDS,v);}
const ACHS=[
 {id:'first-normal',title:'First Level',desc:'Clear your first Normal level.',reward:1,target:1,get:v=>v.normalLevels},
 {id:'normal-5',title:'Normal Explorer',desc:'Clear 5 Normal levels.',reward:2,target:5,get:v=>v.normalLevels},
 {id:'normal-10',title:'Normal Veteran',desc:'Clear 10 Normal levels.',reward:3,target:10,get:v=>v.normalLevels},
 {id:'normal-25',title:'Cube Master',desc:'Clear 25 Normal levels.',reward:5,target:25,get:v=>v.normalLevels},
 {id:'speed-combo-10',title:'Combo 10',desc:'Reach a 10 combo in Speed Training.',reward:2,target:10,get:v=>v.speedCombo},
 {id:'speed-combo-25',title:'Combo 25',desc:'Reach a 25 combo in Speed Training.',reward:4,target:25,get:v=>v.speedCombo},
 {id:'speed-combo-50',title:'Combo 50',desc:'Reach a 50 combo in Speed Training.',reward:6,target:50,get:v=>v.speedCombo},
 {id:'brain-diff-5',title:'Deep Thinker',desc:'Reach Brain difficulty 5.',reward:2,target:5,get:v=>v.brainDifficulty},
 {id:'brain-10',title:'Brain Level 10',desc:'Reach Brain difficulty 10.',reward:3,target:10,get:v=>v.brainDifficulty},
 {id:'brain-diff-20',title:'Brain Expert',desc:'Reach Brain difficulty 20.',reward:6,target:20,get:v=>v.brainDifficulty},
 {id:'accuracy-90',title:'Sharp Mind',desc:'Finish a training run with 90% accuracy.',reward:2,target:90,get:v=>v.accuracy*100},
 {id:'accuracy-95',title:'Precision',desc:'Finish a training run with 95% accuracy.',reward:4,target:95,get:v=>v.accuracy*100},
 {id:'questions-100',title:'Century',desc:'Answer 100 training questions.',reward:3,target:100,get:v=>v.questions},
 {id:'questions-500',title:'Question Hunter',desc:'Answer 500 training questions.',reward:5,target:500,get:v=>v.questions},
 {id:'questions-1000',title:'Thousand Answers',desc:'Answer 1,000 training questions.',reward:8,target:1000,get:v=>v.questions},
 {id:'speed-games-5',title:'Speed Regular',desc:'Complete 5 Speed Training runs.',reward:2,target:5,get:v=>v.speedGames},
 {id:'speed-games-10',title:'Speed Specialist',desc:'Complete 10 Speed Training runs.',reward:4,target:10,get:v=>v.speedGames},
 {id:'brain-games-5',title:'Brain Regular',desc:'Complete 5 Brain Training runs.',reward:2,target:5,get:v=>v.brainGames},
 {id:'brain-games-10',title:'Brain Specialist',desc:'Complete 10 Brain Training runs.',reward:4,target:10,get:v=>v.brainGames},
 {id:'speed-score-5000',title:'Speed 5K',desc:'Reach a Speed Training best score of 5,000.',reward:3,target:5000,get:v=>v.speedScore},
 {id:'speed-score-10000',title:'Speed 10K',desc:'Reach a Speed Training best score of 10,000.',reward:6,target:10000,get:v=>v.speedScore},
 {id:'brain-score-5000',title:'Brain 5K',desc:'Reach a Brain Training best score of 5,000.',reward:3,target:5000,get:v=>v.brainScore},
 {id:'brain-score-10000',title:'Brain 10K',desc:'Reach a Brain Training best score of 10,000.',reward:6,target:10000,get:v=>v.brainScore},
 {id:'apples-10',title:'Golden Collector',desc:'Hold 10 Golden Apples.',reward:3,target:10,get:v=>v.apples},
 {id:'apples-50',title:'Golden Hoard',desc:'Hold 50 Golden Apples.',reward:6,target:50,get:v=>v.apples},
 {id:'apples-100',title:'Golden Vault',desc:'Hold 100 Golden Apples.',reward:10,target:100,get:v=>v.apples},
 {id:'speed-fast-3',title:'Three Second Strike',desc:'Record a fastest Speed answer of 3 seconds or less.',reward:4,target:3,get:v=>v.speedFastest,reverse:true},
 {id:'speed-avg-5',title:'Rapid Rhythm',desc:'Bring Speed Training average answer time to 5 seconds or less.',reward:5,target:5,get:v=>v.speedAverage,reverse:true},
 {id:'brain-level-10',title:'Brain Level 10',desc:'Reach Brain level 10.',reward:4,target:10,get:v=>v.brainLevel},
 {id:'brain-level-20',title:'Brain Level 20',desc:'Reach Brain level 20.',reward:7,target:20,get:v=>v.brainLevel}
];
function achievementStatsLocal(){const r=p2Records();return {normalLevels:Number(r.normal?.levels||0),speedCombo:Number(r.speed?.bestCombo||0),brainDifficulty:Number(r.brain?.highestDifficulty||0),accuracy:Math.max(Number(r.speed?.accuracy||0),Number(r.brain?.accuracy||0)),questions:Number(r.speed?.questions||0)+Number(r.brain?.questions||0),speedGames:Number(r.speed?.games||0),brainGames:Number(r.brain?.games||0),speedScore:Number(r.speed?.bestScore||0),brainScore:Number(r.brain?.bestScore||0),apples:getGoldenApples(),speedFastest:Number(r.speed?.fastest||0),speedAverage:Number(r.speed?.average||0),brainLevel:Number(r.brain?.highestLevel||0)};}
function mergeAchievementStats(local,cloud){if(!cloud)return local;return {normalLevels:Math.max(local.normalLevels,Number(cloud.normal_levels||0)),speedCombo:Math.max(local.speedCombo,Number(cloud.speed_combo||0)),brainDifficulty:Math.max(local.brainDifficulty,Number(cloud.brain_difficulty||0)),accuracy:Math.max(local.accuracy,Number(cloud.accuracy||0)),questions:Math.max(local.questions,Number(cloud.questions||0)),speedGames:Math.max(local.speedGames,Number(cloud.speed_games||0)),brainGames:Math.max(local.brainGames,Number(cloud.brain_games||0)),speedScore:Math.max(local.speedScore,Number(cloud.speed_score||0)),brainScore:Math.max(local.brainScore,Number(cloud.brain_score||0)),apples:Math.max(local.apples,Number(cloud.apples||0)),speedFastest:local.speedFastest&&Number(cloud.speed_fastest)>0?Math.min(local.speedFastest,Number(cloud.speed_fastest)):Math.max(local.speedFastest,Number(cloud.speed_fastest||0)),speedAverage:local.speedAverage&&Number(cloud.speed_average)>0?Math.min(local.speedAverage,Number(cloud.speed_average)):Math.max(local.speedAverage,Number(cloud.speed_average||0)),brainLevel:Math.max(local.brainLevel,Number(cloud.brain_level||0))};}
function achievementUnlocked(x,v){const n=Number(x.get(v)||0);return x.reverse?(n>0&&n<=x.target):n>=x.target;}
function p2Achievements(){return p2Read(P2_ACH,{});}
function claimP2Achievements(stats=achievementStatsLocal()){const a=p2Achievements();let changed=false;for(const x of ACHS){if(!a[x.id]&&achievementUnlocked(x,stats)){a[x.id]={unlockedAt:new Date().toISOString()};addGoldenApples(x.reward);changed=true;}}if(changed){p2Write(P2_ACH,a);window.dispatchEvent(new Event('mathcube-save-request'));}return a;}
const ITEMS=[
 {id:'cyber_cube',name:'Cyber Cube',type:'cube_skin',cost:20},
 {id:'blue_flame',name:'Blue Flame',type:'flame_style',cost:30},
 {id:'space_bg',name:'Space Background',type:'background',cost:50},
 {id:'neon_score',name:'Neon Score',type:'score_effect',cost:40},
 {id:'future_avatar',name:'Future Avatar',type:'avatar',cost:35},
 {id:'pulse_sound',name:'Pulse Sound',type:'sound',cost:25}
];
function p2Inventory(){return p2Read(P2_INV,[]);}
function p2Equip(id){p2Write(P2_EQ,id);renderCollection();}
function renderCollection(){const el=$('mc-collection-grid');if(!el)return;const inv=new Set(p2Inventory());const equipped=localStorage.getItem(P2_EQ)||'';el.innerHTML=ITEMS.map(x=>`<article class="mc-collection-item ${inv.has(x.id)?'owned':''}"><div class="mc-collection-art">${x.type.replace('_',' ')}</div><strong>${x.name}</strong><span>${inv.has(x.id)?(equipped===x.id?t('equipped'):t('owned')):t('locked')}</span>${inv.has(x.id)?`<button class="mc-equip" data-id="${x.id}">${equipped===x.id?t('equipped'):t('equip')}</button>`:''}</article>`).join('');el.querySelectorAll('.mc-equip').forEach(b=>b.addEventListener('click',()=>p2Equip(b.dataset.id)));}
async function renderAchievements(){
  const el=$('mc-achievement-grid');if(!el)return;
  let stats=achievementStatsLocal();let a=claimP2Achievements(stats);
  el.innerHTML=ACHS.map(x=>{const raw=Math.max(0,Number(x.get(stats)||0));const pct=x.reverse?(raw>0?Math.min(100,Math.round((x.target/raw)*100)):0):Math.min(100,Math.round((raw/x.target)*100));const done=!!a[x.id]||achievementUnlocked(x,stats);const shown=x.reverse?(x.id==='speed-fast-3'?`${Number(stats.speedFastest||0).toFixed(1)}s / ≤3.0s`:`${Number(stats.speedAverage||0).toFixed(1)}s / ≤5.0s`):`${Math.min(x.target,Math.floor(raw)).toLocaleString()} / ${x.target.toLocaleString()}`;return `<article class="mc-achievement ${done?'unlocked':''}"><div class="mc-achievement-top"><div class="mc-achievement-mark">${done?'✓':'?'}</div><span class="mc-achievement-status">${done?t('unlocked'):pct+'%'}</span></div><strong>${x.title}</strong><span>${x.desc}</span><div class="mc-achievement-progress"><i style="width:${pct}%"></i></div><small>${shown}</small><b>+${x.reward} ${t('goldenApples')}</b></article>`;}).join('');updateWallet();
}
function renderChallenges(){const el=$('mc-challenge-grid');if(!el)return;const day=Math.floor(Date.now()/86400000),week=Math.floor(day/7);const ds=p2Read('mcPhase2ChallengeV1',{});const daily=ds.daily===day?ds.dailyProgress||0:0;const weekly=ds.week===week?ds.weeklyProgress||0:0;el.innerHTML=`<article><strong>${t('daily')}</strong><span>${daily}/20 ${t('questions')}</span><b>+1 ${t('goldenApples')}</b></article><article><strong>${t('weekly')}</strong><span>${weekly}/100 ${t('questions')}</span><b>+5 ${t('goldenApples')}</b></article>`;}
function recordLocalTraining(){const r=p2Records();const x=r[run.mode];const acc=run.totalAnswered?run.correct/run.totalAnswered:0;const avg=run.answerTimes.length?run.answerTimes.reduce((a,b)=>a+b,0)/run.answerTimes.length:0;const fast=run.answerTimes.length?Math.min(...run.answerTimes):0;x.bestScore=Math.max(x.bestScore,run.score);x.bestCombo=Math.max(x.bestCombo,run.bestCombo);x.accuracy=Math.max(x.accuracy,acc);x.questions+=run.correct;x.games++;x.fastest=x.fastest?Math.min(x.fastest,fast):fast;if(run.mode==='speed')x.average=x.average?((x.average*(x.games-1)+avg)/x.games):avg;else{x.highestLevel=Math.max(x.highestLevel,run.q);x.highestDifficulty=Math.max(x.highestDifficulty,run.highestDifficulty);}p2SaveRecords(r);const day=Math.floor(Date.now()/86400000),week=Math.floor(day/7);const ds=p2Read('mcPhase2ChallengeV1',{});if(ds.daily!==day)ds.daily=day,ds.dailyProgress=0;if(ds.week!==week)ds.week=week,ds.weeklyProgress=0;ds.dailyProgress+=run.correct;ds.weeklyProgress+=run.correct;p2Write('mcPhase2ChallengeV1',ds);claimP2Achievements();window.dispatchEvent(new Event('mathcube-record-updated'));}
function refreshPhase2UI(){claimP2Achievements();renderAchievements();renderCollection();renderChallenges();}
$('mc-achievements')?.addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); renderAchievements();$('mc-achievements-modal').classList.add('mc-open');});
$('mc-achievements-close')?.addEventListener('click',()=>$('mc-achievements-modal').classList.remove('mc-open'));
$('mc-collection')?.addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); renderCollection();$('mc-collection-modal').classList.add('mc-open');});
$('mc-collection-close')?.addEventListener('click',()=>$('mc-collection-modal').classList.remove('mc-open'));
$('mc-challenges')?.addEventListener('click',()=>{ $('mc-menu-modal').classList.remove('mc-open'); renderChallenges();$('mc-challenges-modal').classList.add('mc-open');});
$('mc-challenges-close')?.addEventListener('click',()=>$('mc-challenges-modal').classList.remove('mc-open'));
// Smart horizontal scroll: actual viewport owns overflow; auto-scroll only when content exceeds it.
function initSmartScroll(){document.querySelectorAll('.mc-smart-scroll').forEach(root=>{const vp=root.querySelector('.mc-smart-scroll-viewport');if(!vp)return;let dir=1,last=performance.now(),pauseUntil=performance.now()+900,raf=0;const refresh=()=>{root.classList.toggle('is-overflowing',vp.scrollWidth>vp.clientWidth+2);};const interact=()=>{pauseUntil=performance.now()+2200;};vp.addEventListener('touchstart',interact,{passive:true});vp.addEventListener('pointerdown',interact);vp.addEventListener('wheel',interact,{passive:true});vp.addEventListener('scroll',()=>{pauseUntil=performance.now()+500;},{passive:true});const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(root.classList.contains('is-overflowing')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&now>pauseUntil){vp.scrollLeft+=dir*18*dt;if(vp.scrollLeft>=vp.scrollWidth-vp.clientWidth-1){vp.scrollLeft=vp.scrollWidth-vp.clientWidth;dir=-1;pauseUntil=now+1000;}else if(vp.scrollLeft<=1){vp.scrollLeft=0;dir=1;pauseUntil=now+1000;}}raf=requestAnimationFrame(loop);};new ResizeObserver(refresh).observe(vp);refresh();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);});}

applyLanguage();
initHomeResponsive();
initPlayerSystem();
updateWallet();
bootCloud();
initSmartScroll();
refreshPhase2UI();
init();


comboFX.init();

const APPLE_KEY='mcGoldenApples';
const SCORE_KEY='mcScore';
const POINTS_KEY='mcPoints';
const LEGACY_POINTS_KEY='mcHearts';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
function readProgressWins(){
  try{const raw=localStorage.getItem('mathCubeProgress');if(!raw)return 0;const p=JSON.parse(raw);return Number(p?.wins)||0;}catch{return 0;}
}
if(localStorage.getItem(POINTS_KEY)===null){
  const legacy=localStorage.getItem(LEGACY_POINTS_KEY);
  localStorage.setItem(POINTS_KEY,legacy===null?'10':String(clamp(legacy,0,10)));
}
if(localStorage.getItem(SCORE_KEY)===null)localStorage.setItem(SCORE_KEY,'0');
if(localStorage.getItem(APPLE_KEY)===null)localStorage.setItem(APPLE_KEY,String(readProgressWins()));
export function setGoldenApples(value){const next=Math.max(0,Math.floor(Number(value)||0));localStorage.setItem(APPLE_KEY,String(next));return next;}
export function getGoldenApples(){return Math.max(0,Number(localStorage.getItem(APPLE_KEY)||0));}
export function addGoldenApples(amount){const next=getGoldenApples()+Math.max(0,Number(amount)||0);localStorage.setItem(APPLE_KEY,String(next));return next;}
export function spendGoldenApples(amount){const cost=Math.max(0,Number(amount)||0);const next=Math.max(0,getGoldenApples()-cost);localStorage.setItem(APPLE_KEY,String(next));return next;}
export function getPoints(){return clamp(localStorage.getItem(POINTS_KEY),0,10);}
export function setPoints(value){const next=clamp(value,0,10);localStorage.setItem(POINTS_KEY,String(next));return next;}
export function getScore(){return Math.max(0,Number(localStorage.getItem(SCORE_KEY)||0));}
export function addScore(amount){const next=getScore()+Math.max(0,Number(amount)||0);localStorage.setItem(SCORE_KEY,String(next));return next;}

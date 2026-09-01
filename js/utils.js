export const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function easeOutBack(x){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}
export function easeInOut(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;}

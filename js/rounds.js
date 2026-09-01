import * as THREE from 'three';
import { ri, pick, shuffle } from './utils.js';

export function evalChain(vals,ops){
    let v=vals[0];
    for(let i=0;i<ops.length;i++){
        const a=v,b=vals[i+1],op=ops[i];
        if(op==='+')v=a+b; else if(op==='-')v=a-b; else if(op==='×')v=a*b;
        else{ if(b===0)return{ok:false}; if(a%b!==0)return{ok:false}; v=a/b; }
    }
    return{ok:true,v};
}
export function makeMain(avail,opsCount,opsSet){
    const n=b=>b.userData.num;
    for(let attempt=0;attempt<70;attempt++){
        const sh=shuffle([...avail]).slice(0,opsCount+1);
        const ops=[];for(let i=0;i<opsCount;i++)ops.push(pick(opsSet));
        const r=evalChain(sh.map(n),ops);
        if(r.ok&&Number.isInteger(r.v)&&Math.abs(r.v)<=999)return{type:'MAIN',k:opsCount+1,ops,target:r.v,picked:sh};
    }
    const sh=shuffle([...avail]).slice(0,opsCount+1);
    return{type:'MAIN',k:opsCount+1,ops:Array(opsCount).fill('+'),target:sh.reduce((s,b)=>s+n(b),0),picked:sh};
}
export function makeMissing(avail){
    const sh=shuffle([...avail]);const a=sh[0],b=sh[1];
    const op=pick(['+','-']);const na=a.userData.num,nb=b.userData.num;
    return{type:'MISSING',k:1,given:na,op,target:op==='+'?na+nb:na-nb,needed:nb,picked:[b]};
}
export function makeFind(avail){
    const n=b=>b.userData.num;
    for(let t=0;t<30;t++){
        const a=pick(avail);const rest=avail.filter(x=>x!==a);if(!rest.length)break;
        const b=pick(rest);const na=n(a),nb=n(b);
        const cand=[['+',na+nb],['-',na-nb],['×',na*nb]];
        if(nb!==0&&na%nb===0)cand.push(['÷',na/nb]);
        shuffle(cand);
        for(const [op,T] of cand){
            if(!Number.isInteger(T)||Math.abs(T)>999)continue;
            const c=avail.find(x=>x!==a&&x!==b&&n(x)===T);
            if(c)return{type:'FIND',k:1,givenA:na,givenB:nb,op,target:T,needed:T,picked:[c]};
        }
    }
    return null;
}
export function makeTexture(num){
    const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,128,128);
    g.addColorStop(0,'#4361ee');
    g.addColorStop(1,'#3a0ca3');
    x.fillStyle=g;x.fillRect(0,0,128,128);
    x.strokeStyle='#00f5d4';x.lineWidth=5;x.strokeRect(8,8,112,112);
    const s=String(num);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';
    x.font='bold '+(s.length<=2?56:s.length===3?44:34)+'px sans-serif';
    x.fillText(s,64,66);
    return new THREE.CanvasTexture(c);
}

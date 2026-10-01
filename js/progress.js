const SKEY='mathCubeProgress';
const BKEY='mathCubeProgressBackup';
const DEFAULTS={version:2,unlocked:1,stars:{},bestTime:{},bestScore:{},records:0,wins:0};
export let progress={...DEFAULTS};
function parse(raw){
    if(!raw)return null;
    try{const o=JSON.parse(raw); if(o&&typeof o==='object')return Object.assign({},DEFAULTS,o);}catch(e){}
    return null;
}
(function load(){
    let o=null;
    try{o=parse(localStorage.getItem(SKEY));}catch(e){}
    if(!o){try{o=parse(localStorage.getItem(BKEY));}catch(e){}}
    if(o)progress=o;
})();
export function save(){
    try{const s=JSON.stringify(progress);
        localStorage.setItem(SKEY,s);
        localStorage.setItem(BKEY,s);}catch(e){}
}
export function exportCode(){
    try{return btoa(unescape(encodeURIComponent(JSON.stringify(progress))));}catch(e){return '';}
}
export function importCode(code){
    try{
        const o=parse(decodeURIComponent(escape(atob(code.trim()))));
        if(!o||typeof o.unlocked!=='number'||typeof o.wins!=='number')return false;
        progress=o;save();return true;
    }catch(e){return false;}
}

export function reload(){
    let o=null;
    try{o=parse(localStorage.getItem(SKEY));}catch(e){}
    if(!o){try{o=parse(localStorage.getItem(BKEY));}catch(e){}}
    if(o){
        for(const k of Object.keys(DEFAULTS)) delete progress[k];
        Object.assign(progress,o);
    }
    return progress;
}

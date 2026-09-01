import { init } from './game.js';

window.addEventListener('error',e=>{
    const d=document.getElementById('loading');
    if(d){d.style.display='flex';d.textContent='ERROR: '+e.message;}
});

init();

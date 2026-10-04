/* Sprint 8: unified, lightweight animation coordinator. */
const AnimationManager = {
  state:'idle',
  reduced: matchMedia('(prefers-reduced-motion: reduce)'),
  timers: new Set(),
  setState(state){this.state=state;document.documentElement.dataset.mcAnimationState=state;},
  init(){
    const refresh=()=>{ this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; };
    addEventListener('resize',refresh,{passive:true});
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('mc-reduced-motion',this.reduced);
  },
  later(fn,ms){ const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id);return id; },
  cancelAll(){for(const id of this.timers)clearTimeout(id);this.timers.clear();},
  pulse(el,cls='mc-anim-pulse'){
    if(!el)return;
    el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
    if(this.reduced)el.classList.add('mc-reduced-keep');
  },
  answer(button,correct){
    if(!button)return;
    button.classList.remove('mc-answer-enter','mc-answer-correct-pop','mc-answer-wrong-shake');
    void button.offsetWidth;
    button.classList.add(correct?'mc-answer-correct-pop':'mc-answer-wrong-shake');
  },
  feedback(kind){
    const el=document.getElementById('mc-answer-feedback');
    if(!el)return;
    el.dataset.type=kind;
    el.classList.remove('show','feedback-correct','feedback-wrong','feedback-gentle');
    void el.offsetWidth;
    el.classList.add('show',kind==='tryAgain'||kind==='miss'?'feedback-wrong':'feedback-correct');
    if(kind==='keepGoing')el.classList.add('feedback-gentle');
  },
  combo(station,count){
    if(!station)return;
    station.style.setProperty('--mc-combo-beat',Math.min(1,0.25+Number(count||0)*.025));
    this.pulse(station,'mc-combo-premium-beat');
  },
  milestone(el,major=false){
    if(!el)return;
    el.classList.toggle('major',major);
    el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  },
  result(card,pb=false){
    if(!card)return;
    card.classList.remove('mc-result-enter','mc-result-pb');void card.offsetWidth;
    card.classList.add('mc-result-enter');
    if(pb)this.later(()=>card.classList.add('mc-result-pb'),650);
  },
  reward(el){
    if(!el)return;
    el.classList.remove('mc-reward-fly');void el.offsetWidth;el.classList.add('mc-reward-fly');
  },
  cleanup(){this.cancelAll();}
};
export default AnimationManager;

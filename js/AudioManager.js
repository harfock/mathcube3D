// ============================================================
// AudioManager.js — v12
// Native Web Audio SFX engine. No external files/libraries.
// Speed Training = Hyper / Arcade. Brain Training = Calm / Focus.
// ============================================================
class AudioManager {
    constructor(){this.ctx=null;this.master=null;this.comp=null;this.enabled=true;this.profile='normal';this.lastBeat=0;this.resumePromise=null;}
    unlock(){
        try{
            const AC=window.AudioContext||window.webkitAudioContext;
            if(!AC)return false;
            if(!this.ctx){
                this.ctx=new AC();
                this.comp=this.ctx.createDynamicsCompressor();
                this.master=this.ctx.createGain();
                this.master.gain.value=.48;
                this.master.connect(this.comp);
                this.comp.connect(this.ctx.destination);
            }
            if(this.ctx.state==='suspended'&&typeof this.ctx.resume==='function'){
                try{
                    const p=this.ctx.resume();
                    if(p&&typeof p.then==='function'){this.resumePromise=p.catch(()=>{});}
                }catch(e){}
            }
            return this.ctx.state!=='closed';
        }catch(e){return false;}
    }
    ensure(){this.unlock();return this.enabled&&this.ctx?this.ctx:null;}
    setMuted(m){this.enabled=!m;} toggle(){this.enabled=!this.enabled;return this.enabled;}
    setProfile(mode){this.profile=mode==='brain'?'brain':mode==='speed'?'speed':'normal';}
    tone(o={}){const ctx=this.ensure();if(!ctx)return;try{const{freq=440,freqEnd=null,type='sine',gain=.12,attack=.005,hold=0,decay=.05,release=.1,delay=0}=o,t0=ctx.currentTime+delay,peak=t0+attack,decayT=peak+hold+decay,end=decayT+release,osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(1,freq),t0);if(freqEnd!=null)osc.frequency.exponentialRampToValueAtTime(Math.max(1,freqEnd),decayT);g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),peak);g.gain.setValueAtTime(Math.max(.0001,gain),peak+hold);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain*.5),decayT);g.gain.exponentialRampToValueAtTime(.0001,end);osc.connect(g);g.connect(this.master);osc.start(t0);osc.stop(end+.02);}catch(e){}}
    noise(o={}){const ctx=this.ensure();if(!ctx)return;try{const{gain=.12,attack=.01,release=.18,delay=0,filterType='lowpass',freqStart=1000,freqEnd=null,filterQ=1}=o,t0=ctx.currentTime+delay,dur=Math.max(.05,attack+release),len=Math.ceil(ctx.sampleRate*dur),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=ctx.createBufferSource();src.buffer=buf;const f=ctx.createBiquadFilter();f.type=filterType;f.Q.value=filterQ;f.frequency.setValueAtTime(Math.max(1,freqStart),t0);if(freqEnd!=null)f.frequency.exponentialRampToValueAtTime(Math.max(1,freqEnd),t0+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),t0+attack);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);src.connect(f);f.connect(g);g.connect(this.master);src.start(t0);src.stop(t0+dur+.02);}catch(e){}}

    button(){this.tone({freq:900,freqEnd:620,type:this.profile==='brain'?'sine':'square',gain:.035,attack:.002,decay:.018,release:.05});}
    blockSelect(){this.tone({freq:520,freqEnd:780,type:'square',gain:.06,attack:.002,decay:.03,release:.06});}
    blockDeselect(){this.tone({freq:420,freqEnd:290,type:'square',gain:.05,attack:.002,decay:.03,release:.06});}
    roundSuccess(){this.tone({freq:659,type:'triangle',gain:.12,attack:.004,decay:.04,release:.15});this.tone({freq:988,type:'triangle',gain:.12,attack:.004,decay:.05,release:.2,delay:.09});}
    roundFail(){this.tone({freq:220,freqEnd:105,type:'sawtooth',gain:.09,attack:.004,decay:.1,release:.15});}
    hint(){this.tone({freq:1318,type:'sine',gain:.1,attack:.004,decay:.05,release:.3});}
    levelStart(){this.tone({freq:392,type:'triangle',gain:.1,attack:.004,decay:.04,release:.15});this.tone({freq:523,type:'triangle',gain:.1,attack:.004,decay:.05,release:.2,delay:.1});}
    victory(){const seq=[523,659,784,1046];seq.forEach((f,i)=>this.tone({freq:f,type:'triangle',gain:.12,attack:.004,decay:.05,release:.2,delay:i*.11}));}
    record(){this.tone({freq:1568,type:'sine',gain:.1,attack:.004,decay:.04,release:.25});this.tone({freq:2093,type:'sine',gain:.1,attack:.004,decay:.05,release:.35,delay:.1});}

    // ---- v12 Endless-mode sound skin ----
    trainingStart(mode){this.setProfile(mode);if(mode==='speed'){this.tone({freq:330,type:'square',gain:.055,attack:.003,decay:.035,release:.08});this.tone({freq:660,type:'square',gain:.05,attack:.003,decay:.045,release:.1,delay:.06});}else{this.tone({freq:392,type:'sine',gain:.045,attack:.02,decay:.08,release:.28});this.tone({freq:587,type:'sine',gain:.035,attack:.02,decay:.08,release:.34,delay:.11});}}
    answer(mode,time=1,difficulty=1){this.setProfile(mode);if(mode==='speed'){const pitch=1+Math.max(0,Math.min(1,1-time/12))*.22;this.tone({freq:620*pitch,freqEnd:930*pitch,type:'square',gain:.075,attack:.002,decay:.025,release:.075});this.tone({freq:930*pitch,type:'triangle',gain:.045,attack:.002,decay:.025,release:.09,delay:.035});}else{const base=440+Math.min(5,difficulty)*24;this.tone({freq:base,type:'sine',gain:.055,attack:.018,decay:.06,release:.25});this.tone({freq:base*1.5,type:'sine',gain:.032,attack:.02,decay:.07,release:.32,delay:.08});}}
    miss(mode,timeout=false){this.setProfile(mode);if(mode==='speed'){this.tone({freq:260,freqEnd:110,type:'sawtooth',gain:.065,attack:.002,decay:.07,release:.12});if(timeout)this.noise({gain:.025,attack:.002,release:.1,filterType:'highpass',freqStart:900,freqEnd:400});}else{this.tone({freq:300,freqEnd:220,type:'sine',gain:.045,attack:.02,decay:.08,release:.28});}}
    comboBeat(mode,combo){this.setProfile(mode);const now=performance.now();if(now-this.lastBeat<55)return;this.lastBeat=now;if(mode==='speed'){const f=105+Math.min(95,combo*2.2);this.tone({freq:f,freqEnd:f*1.5,type:'square',gain:.045,attack:.002,decay:.018,release:.055});}else{const f=110+Math.min(70,combo*1.4);this.tone({freq:f,type:'sine',gain:.028,attack:.01,decay:.04,release:.18});}}
    comboTier(mode,tier){this.setProfile(mode);if(mode==='speed'){const notes={warm:523,fire:659,hot:784,ultra:988,extreme:1175};const f=notes[tier]||523;this.tone({freq:f,type:'square',gain:.07,attack:.003,decay:.04,release:.1});this.tone({freq:f*1.5,type:'triangle',gain:.055,attack:.003,decay:.05,release:.15,delay:.055});}else{const notes={warm:440,fire:523,hot:659,ultra:784,extreme:988};const f=notes[tier]||440;this.tone({freq:f,type:'sine',gain:.045,attack:.025,decay:.08,release:.28});this.tone({freq:f*1.25,type:'sine',gain:.025,attack:.025,decay:.08,release:.34,delay:.09});}}
    comboHeartbeat(mode,combo){this.setProfile(mode);const strength=Math.min(1.35,1+Math.log10(Math.max(1,combo))*.22);const low=mode==='speed'?78:68;this.tone({freq:low,freqEnd:Math.max(48,low*.72),type:'sine',gain:.105*strength,attack:.002,decay:.035,release:.085});this.tone({freq:low*1.22,freqEnd:Math.max(52,low*.82),type:'sine',gain:.075*strength,attack:.002,decay:.028,release:.075,delay:.095});}
    pressure(mode){this.setProfile(mode);if(mode==='speed'){this.tone({freq:880,type:'square',gain:.028,attack:.002,decay:.018,release:.045});}else{this.tone({freq:330,type:'sine',gain:.022,attack:.015,decay:.035,release:.12});}}
    difficultyUp(){this.setProfile('brain');this.tone({freq:392,type:'sine',gain:.04,attack:.02,decay:.07,release:.22});this.tone({freq:523,type:'sine',gain:.035,attack:.02,decay:.08,release:.28,delay:.09});this.tone({freq:659,type:'sine',gain:.028,attack:.02,decay:.09,release:.34,delay:.18});}
    trainingComplete(mode){this.setProfile(mode);if(mode==='speed'){const seq=[523,659,784,1046,1318];seq.forEach((f,i)=>this.tone({freq:f,type:i<3?'square':'triangle',gain:.075-i*.008,attack:.003,decay:.045,release:.16,delay:i*.085}));this.noise({gain:.035,attack:.01,release:.22,filterType:'highpass',freqStart:1400,freqEnd:2600,delay:.25});}else{const seq=[392,523,659,784];seq.forEach((f,i)=>this.tone({freq:f,type:'sine',gain:.045,attack:.025,decay:.08,release:.3,delay:i*.14}));}}
    appleSpin(){const ctx=this.ensure();if(!ctx)return;try{const t0=ctx.currentTime,dur=3,len=Math.ceil(ctx.sampleRate*dur),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=ctx.createBufferSource();src.buffer=buf;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.1;bp.frequency.setValueAtTime(350,t0);bp.frequency.exponentialRampToValueAtTime(2800,t0+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.07,t0+.35);g.gain.setValueAtTime(.07,t0+dur-.6);g.gain.linearRampToValueAtTime(.0001,t0+dur);src.connect(bp);bp.connect(g);g.connect(this.master);src.start(t0);src.stop(t0+dur);}catch(e){}const notes=[1046,1318,1568,2093,1568,2093];for(let i=0;i<notes.length;i++)this.tone({freq:notes[i],type:'sine',gain:.035,attack:.01,decay:.04,release:.5,delay:.15+i*.45});}
}
export const AudioFX=new AudioManager();
export default AudioFX;

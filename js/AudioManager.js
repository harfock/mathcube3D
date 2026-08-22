// ============================================================
// AudioManager.js
// Self-contained chiptune-style SFX engine using the native
// Web Audio API. No external files, no libraries.
// ============================================================

class AudioManager {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.comp = null;
        this.enabled = true;
    }

    // Create/resume the AudioContext. Must be triggered by a user gesture.
    unlock() {
        try {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.comp = this.ctx.createDynamicsCompressor();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.5;
                this.master.connect(this.comp);
                this.comp.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { /* audio unsupported; game still runs */ }
    }

    ensure() {
        this.unlock();
        return (this.enabled && this.ctx) ? this.ctx : null;
    }

    setMuted(m) { this.enabled = !m; }
    toggle() { this.enabled = !this.enabled; return this.enabled; }

    // ---- Low-level building blocks ----
    tone(o = {}) {
        const ctx = this.ensure(); if (!ctx) return;
        try {
            const { freq = 440, freqEnd = null, type = 'sine', gain = 0.15,
                    attack = 0.005, hold = 0, decay = 0.05, release = 0.1, delay = 0 } = o;
            const t0 = ctx.currentTime + delay;
            const peakT = t0 + attack;
            const decayT = peakT + hold + decay;
            const endT = decayT + release;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(1, freq), t0);
            if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), decayT);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), peakT);
            g.gain.setValueAtTime(Math.max(0.0001, gain), peakT + hold);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.5), decayT);
            g.gain.exponentialRampToValueAtTime(0.0001, endT);
            osc.connect(g); g.connect(this.master);
            osc.start(t0); osc.stop(endT + 0.02);
        } catch (e) {}
    }

    noise(o = {}) {
        const ctx = this.ensure(); if (!ctx) return;
        try {
            const { gain = 0.2, attack = 0.02, release = 0.3, delay = 0,
                    filterType = 'lowpass', freqStart = 1000, freqEnd = null, filterQ = 1 } = o;
            const t0 = ctx.currentTime + delay;
            const dur = Math.max(0.05, attack + release);
            const len = Math.ceil(ctx.sampleRate * dur);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = filterType;
            filter.Q.value = filterQ;
            filter.frequency.setValueAtTime(Math.max(1, freqStart), t0);
            if (freqEnd != null) filter.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            src.connect(filter); filter.connect(g); g.connect(this.master);
            src.start(t0); src.stop(t0 + dur + 0.02);
        } catch (e) {}
    }

    // ---- Named sound effects ----
    blockSelect() {
        this.tone({ freq: 520, freqEnd: 780, type: 'square', gain: 0.06, attack: 0.002, decay: 0.03, release: 0.06 });
    }
    blockDeselect() {
        this.tone({ freq: 420, freqEnd: 290, type: 'square', gain: 0.05, attack: 0.002, decay: 0.03, release: 0.06 });
    }
    button() {
        this.tone({ freq: 950, freqEnd: 620, type: 'square', gain: 0.05, attack: 0.002, decay: 0.02, release: 0.05 });
    }
    roundSuccess() {
        this.tone({ freq: 659, type: 'triangle', gain: 0.12, attack: 0.004, decay: 0.04, release: 0.15 });
        this.tone({ freq: 988, type: 'triangle', gain: 0.12, attack: 0.004, decay: 0.05, release: 0.2, delay: 0.09 });
    }
    roundFail() {
        this.tone({ freq: 220, freqEnd: 105, type: 'sawtooth', gain: 0.09, attack: 0.004, decay: 0.1, release: 0.15 });
    }
    hint() {
        this.tone({ freq: 1318, type: 'sine', gain: 0.1, attack: 0.004, decay: 0.05, release: 0.3 });
    }
    levelStart() {
        this.tone({ freq: 392, type: 'triangle', gain: 0.1, attack: 0.004, decay: 0.04, release: 0.15 });
        this.tone({ freq: 523, type: 'triangle', gain: 0.1, attack: 0.004, decay: 0.05, release: 0.2, delay: 0.1 });
    }
    victory() {
        const seq = [523, 659, 784, 1046];
        seq.forEach((f, i) => this.tone({ freq: f, type: 'triangle', gain: 0.12, attack: 0.004, decay: 0.05, release: 0.2, delay: i * 0.11 }));
    }
    record() {
        this.tone({ freq: 1568, type: 'sine', gain: 0.1, attack: 0.004, decay: 0.04, release: 0.25 });
        this.tone({ freq: 2093, type: 'sine', gain: 0.1, attack: 0.004, decay: 0.05, release: 0.35, delay: 0.1 });
    }

    // 3-second rotation whoosh + sparkle, matched to the apple spin duration.
    appleSpin() {
        const ctx = this.ensure(); if (!ctx) return;
        try {
            const t0 = ctx.currentTime;
            const dur = 3.0;
            const len = Math.ceil(ctx.sampleRate * dur);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.1;
            bp.frequency.setValueAtTime(350, t0);
            bp.frequency.exponentialRampToValueAtTime(2800, t0 + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.linearRampToValueAtTime(0.07, t0 + 0.35);
            g.gain.setValueAtTime(0.07, t0 + dur - 0.6);
            g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
            src.connect(bp); bp.connect(g); g.connect(this.master);
            src.start(t0); src.stop(t0 + dur);
        } catch (e) {}
        // sparkle arpeggio layered on top
        const notes = [1046, 1318, 1568, 2093, 1568, 2093];
        for (let i = 0; i < notes.length; i++) {
            this.tone({ freq: notes[i], type: 'sine', gain: 0.035, attack: 0.01, decay: 0.04, release: 0.5, delay: 0.15 + i * 0.45 });
        }
    }
}

export const AudioFX = new AudioManager();
export default AudioFX;

/**
 * Procedural audio engine (PLAN.md §9, Milestone 8). We ship **zero audio
 * files** — every effect is synthesized on the fly with the Web Audio API,
 * mirroring the "generated placeholder art" strategy (§6). One shared
 * `AudioContext` drives short blips for game events plus a simple looping
 * background tune, so real sound assets can be swapped in later behind the same
 * `play()` / `startMusic()` surface.
 *
 * Browsers start the context suspended until a user gesture, so we resume it on
 * the first pointer/key press. All scenes share one instance via `getAudio()`.
 */

/** Named one-shot effects, each a short recipe of one or more tones. */
export type SfxName =
    | 'jump'
    | 'coin'
    | 'stomp'
    | 'bump'
    | 'brick'
    | 'powerup'
    | 'powerdown'
    | 'oneup'
    | 'fireball'
    | 'pause'
    | 'flag'
    | 'clear'
    | 'die';

interface ToneOptions {
    /** Start frequency (Hz). */
    freq: number;
    /** Length in seconds. */
    duration: number;
    /** Oscillator waveform (default `square` for a chiptune feel). */
    type?: OscillatorType;
    /** Peak gain 0..1 (before the master gain). */
    volume?: number;
    /** Optional end frequency for a pitch glide. */
    ramp?: number;
    /** Start offset from "now" (seconds) — used to sequence arpeggios. */
    delay?: number;
}

/** Master output level; muting drops this to zero without stopping the loop. */
const MASTER_VOLUME = 0.3;
/** Milliseconds per music step (an eighth-note-ish pulse). */
const MUSIC_STEP_MS = 150;

export class AudioBus {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private muted = false;
    private musicOn = false;
    private musicStep = 0;
    private musicTimer: number | null = null;

    /**
     * A short, generic loop (deliberately NOT the copyrighted SMB theme) that
     * gives the level some life. `0` means a rest for that step.
     */
    private static readonly MUSIC: readonly number[] = [
        523, 0, 659, 0, 784, 0, 659, 0, 587, 0, 698, 0, 587, 0, 440, 0,
        523, 0, 659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 523, 0, 392, 0,
    ];

    constructor() {
        // Audio is gated behind a user gesture; resume on the first one.
        const unlock = () => this.resume();
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    /** Lazily create (or return) the shared context + master gain node. */
    private ensure(): AudioContext | null {
        if (this.ctx) {
            return this.ctx;
        }
        const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
            return null; // no Web Audio (e.g. very old browser) — run silently.
        }
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
        this.master.connect(this.ctx.destination);
        return this.ctx;
    }

    /** Resume a suspended context (called on the first user gesture). */
    resume(): void {
        const ctx = this.ensure();
        if (ctx && ctx.state === 'suspended') {
            void ctx.resume();
        }
    }

    get isMuted(): boolean {
        return this.muted;
    }

    setMuted(muted: boolean): void {
        this.muted = muted;
        if (this.master) {
            this.master.gain.value = muted ? 0 : MASTER_VOLUME;
        }
    }

    /** Flip mute and report the new state (for a HUD indicator). */
    toggleMute(): boolean {
        this.setMuted(!this.muted);
        return this.muted;
    }

    /** One oscillator blip through the master gain, with a small envelope. */
    private tone(o: ToneOptions): void {
        const ctx = this.ensure();
        if (!ctx || !this.master || this.muted) {
            return;
        }
        const t0 = ctx.currentTime + (o.delay ?? 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = o.type ?? 'square';
        osc.frequency.setValueAtTime(o.freq, t0);
        if (o.ramp) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.ramp), t0 + o.duration);
        }

        const vol = o.volume ?? 0.5;
        // Exponential ramps can't touch 0, so bracket the envelope with epsilons.
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);

        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t0);
        osc.stop(t0 + o.duration + 0.02);
    }

    /** Play a sequence of notes as a quick arpeggio (shared by several effects). */
    private arpeggio(freqs: number[], step: number, opts: Partial<ToneOptions> = {}): void {
        freqs.forEach((freq, i) =>
            this.tone({
                freq,
                duration: opts.duration ?? step * 1.1,
                type: opts.type ?? 'square',
                volume: opts.volume ?? 0.4,
                delay: i * step,
            }),
        );
    }

    /** Play a named effect. */
    play(name: SfxName): void {
        switch (name) {
            case 'jump':
                this.tone({ freq: 380, ramp: 720, duration: 0.18, volume: 0.4 });
                break;
            case 'coin':
                this.tone({ freq: 988, duration: 0.07, volume: 0.4 });
                this.tone({ freq: 1319, duration: 0.16, volume: 0.4, delay: 0.07 });
                break;
            case 'stomp':
                this.tone({ freq: 200, ramp: 90, duration: 0.12, type: 'triangle', volume: 0.5 });
                break;
            case 'bump':
                this.tone({ freq: 160, ramp: 100, duration: 0.08, volume: 0.35 });
                break;
            case 'brick':
                this.tone({ freq: 240, ramp: 70, duration: 0.16, type: 'sawtooth', volume: 0.4 });
                break;
            case 'powerup':
                this.arpeggio([523, 659, 784, 1047], 0.07);
                break;
            case 'powerdown':
                this.arpeggio([660, 440, 330], 0.08);
                break;
            case 'oneup':
                this.arpeggio([784, 1047, 1319, 1568], 0.09, { type: 'triangle' });
                break;
            case 'fireball':
                this.tone({ freq: 700, ramp: 260, duration: 0.1, type: 'sawtooth', volume: 0.3 });
                break;
            case 'pause':
                this.tone({ freq: 660, duration: 0.06, volume: 0.3 });
                break;
            case 'flag':
                this.arpeggio([392, 523, 659, 784, 1047], 0.1);
                break;
            case 'clear':
                this.arpeggio([523, 659, 784, 1047, 784, 1047, 1319], 0.16, { volume: 0.4 });
                break;
            case 'die':
                this.tone({ freq: 440, ramp: 110, duration: 0.7, type: 'triangle', volume: 0.5 });
                break;
        }
    }

    /** Begin the looping background tune (idempotent). */
    startMusic(): void {
        if (this.musicOn) {
            return;
        }
        if (!this.ensure()) {
            return;
        }
        this.musicOn = true;
        this.musicStep = 0;
        this.scheduleMusic();
    }

    /** Stop the loop (on pause, death, or leaving the level). */
    stopMusic(): void {
        this.musicOn = false;
        if (this.musicTimer !== null) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    /** Play the current step, then self-reschedule the next one. */
    private scheduleMusic(): void {
        if (!this.musicOn) {
            return;
        }
        const seq = AudioBus.MUSIC;
        const note = seq[this.musicStep % seq.length];
        if (note > 0) {
            this.tone({ freq: note, duration: 0.12, volume: 0.16 });
            // A soft bass note an octave down on the down-beats.
            if (this.musicStep % 4 === 0) {
                this.tone({ freq: note / 2, duration: 0.2, type: 'triangle', volume: 0.18 });
            }
        }
        this.musicStep++;
        this.musicTimer = window.setTimeout(() => this.scheduleMusic(), MUSIC_STEP_MS);
    }
}

let shared: AudioBus | null = null;

/** The process-wide audio engine; created on first use. */
export function getAudio(): AudioBus {
    if (!shared) {
        shared = new AudioBus();
    }
    return shared;
}

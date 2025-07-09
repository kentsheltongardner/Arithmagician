export const Footsteps = new Array();
export class StreamingAudio {
    constructor(url) {
        this._audio = new Audio(url);
    }
    play() {
        this._audio.play();
    }
    loop() {
        this._audio.loop = true;
        this._audio.play();
    }
}
// Loads from Web Audio API
export class BufferedAudio {
    constructor() {
        this._context = new AudioContext();
        this._buffer = null;
        this._source = null;
        this._gain = null;
    }
    async load(url) {
        const response = await fetch(url);
        const audioData = await response.arrayBuffer();
        this._context.decodeAudioData(audioData, (buffer) => {
            this._buffer = buffer;
            this._gain = this._context.createGain();
            this._gain.gain.value = 1.0;
        });
    }
    play() {
        this._source = this._context.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.connect(this._gain).connect(this._context.destination);
        this._source.start();
    }
    loop() {
        this._source = this._context.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.connect(this._gain).connect(this._context.destination);
        this._source.loop = true;
        this._source.start();
    }
    set volume(value) {
        this._gain.gain.value = value;
    }
    get volume() { return this._gain.gain.value; }
}
export class SoundSet {
    constructor() {
        this._sounds = new Array();
    }
    async load(url) {
        const sound = new BufferedAudio();
        await sound.load(url);
        this._sounds.push(sound);
    }
    playRandom() {
        const index = Math.floor(Math.random() * this._sounds.length);
        this._sounds[index].play();
    }
    set volume(value) {
        for (const sound of this._sounds) {
            sound.volume = value;
        }
    }
}

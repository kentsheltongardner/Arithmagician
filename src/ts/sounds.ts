export const Footsteps = new Array<HTMLAudioElement>()

export class StreamingAudio {
    private _audio: HTMLAudioElement
    constructor(url: string) {
        this._audio = new Audio(url)
    }
    public play() {
        this._audio.play()
    }
    public loop() {
        this._audio.loop = true
        this._audio.play()
    }
}
// Loads from Web Audio API
export class BufferedAudio {
    private _context: AudioContext
    private _buffer: AudioBuffer | null
    private _source: AudioBufferSourceNode | null
    private _gain: GainNode | null
  
    constructor() {
      this._context = new AudioContext()
      this._buffer = null
      this._source = null
      this._gain = null
    }

    public async load(url: string) {
        const response  = await fetch(url)
        const audioData = await response.arrayBuffer()
        this._context.decodeAudioData(audioData, (buffer) => {
            this._buffer = buffer
            this._gain = this._context.createGain()
            this._gain.gain.value = 1.0
        })
    }
    public play() {
        this._source = this._context.createBufferSource()
        this._source.buffer = this._buffer
        this._source.connect(this._gain!).connect(this._context.destination)
        this._source.start()
    }
    public loop() {
        this._source = this._context.createBufferSource()
        this._source.buffer = this._buffer
        this._source.connect(this._gain!).connect(this._context.destination)
        this._source.loop = true
        this._source.start()
    }
    public set volume(value: number) {
        this._gain!.gain.value = value
    }
    public get volume() { return this._gain!.gain.value }
}

export class SoundSet {
    private _sounds = new Array<BufferedAudio>()

    public async load(url: string) {
        const sound = new BufferedAudio()
        await sound.load(url)
        this._sounds.push(sound)
    }

    public playRandom() {
        const index = Math.floor(Math.random() * this._sounds.length)
        this._sounds[index].play()
    }

    public set volume(value: number) {
        for (const sound of this._sounds) {
            sound.volume = value
        }
    }
}

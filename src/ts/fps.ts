export default class FPSTracker {
    private _frame: number
    private _framesToCount: number
    private _startTime: number
    private _fps: number

    constructor(framesToCount: number) {
        this._frame = 0
        this._framesToCount = framesToCount
        this._startTime = 0
        this._fps = 0
    }

    public get fps() { return this._fps }

    public start() {
        this._frame = 0
        this._startTime = performance.now()
    }
    public tick() {
        this._frame++
        if (this._frame === this._framesToCount) {
            const time = performance.now()
            const elapsedTime = time - this._startTime
            this._fps = this._framesToCount / elapsedTime * 1000
            this._startTime = time
            this._frame = 0
        }
    }
}
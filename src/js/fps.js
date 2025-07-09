export default class FPSTracker {
    _frame;
    _framesToCount;
    _startTime;
    _fps;
    constructor(framesToCount) {
        this._frame = 0;
        this._framesToCount = framesToCount;
        this._startTime = 0;
        this._fps = 0;
    }
    get fps() { return this._fps; }
    start() {
        this._frame = 0;
        this._startTime = performance.now();
    }
    tick() {
        this._frame++;
        if (this._frame === this._framesToCount) {
            const time = performance.now();
            const elapsedTime = time - this._startTime;
            this._fps = this._framesToCount / elapsedTime * 1000;
            this._startTime = time;
            this._frame = 0;
        }
    }
}

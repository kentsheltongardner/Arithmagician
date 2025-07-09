import Rect from './rect.js';
export default class Size {
    _w;
    _h;
    constructor(w, h) {
        this._w = w;
        this._h = h;
    }
    get w() { return this._w; }
    get h() { return this._h; }
    set w(w) {
        if (w < 0)
            throw new Error('Width cannot be negative');
        this._w = w;
    }
    set h(h) {
        if (h < 0)
            throw new Error('Height cannot be negative');
        this._h = h;
    }
    equals(s) {
        return s._w === this._w && s._h === this._h;
    }
    toRect() {
        return new Rect(0, 0, this._w, this._h);
    }
}

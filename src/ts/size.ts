import Rect from './rect.js'

export default class Size {
    private _w: number
    private _h: number

    constructor(w: number, h: number) {
        this._w = w
        this._h = h
    }

    public get w(): number { return this._w }
    public get h(): number { return this._h }

    public set w(w: number) {
        if (w < 0) throw new Error('Width cannot be negative')
        this._w = w
    }
    public set h(h: number) {
        if (h < 0) throw new Error('Height cannot be negative')
        this._h = h
    }

    public equals(s: Size): boolean {
        return s._w === this._w && s._h === this._h
    }

    public toRect(): Rect {
        return new Rect(0, 0, this._w, this._h)
    }
}
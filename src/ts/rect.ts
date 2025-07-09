import Point from './point.js'
import Size from './size.js'

export default class Rect {
    public origin: Point
    public size: Size

    constructor(x: number, y: number, w: number, h: number) {
        this.origin = new Point(x, y)
        this.size = new Size(w, h)
    }

    public static fromOrigin(origin: Point, w: number, h: number): Rect {
        return new Rect(origin.x, origin.y, w, h)
    }
    public static fromSize(x: number, y: number, size: Size): Rect {
        return new Rect(x, y, size.w, size.h)
    }
    public static fromOriginAndSize(origin: Point, size: Size): Rect {
        return new Rect(origin.x, origin.y, size.w, size.h)
    }
    public static fromPoints(p1: Point, p2: Point): Rect {
        const x = Math.min(p1.x, p2.x)
        const y = Math.min(p1.y, p2.y)
        const w = Math.abs(p2.x - p1.x)
        const h = Math.abs(p2.y - p1.y)
        return new Rect(x, y, w, h)
    }
    public static fromRects(r1: Rect, r2: Rect): Rect {
        const left      = Math.min(r1.left, r2.left)
        const top       = Math.min(r1.top, r2.top)
        const right     = Math.max(r1.right, r2.right)
        const bottom    = Math.max(r1.bottom, r2.bottom)
        const w         = right - left
        const h         = bottom - top
        return new Rect(left, right, w, h)
    }

    public get x(): number { return this.origin.x }
    public get y(): number { return this.origin.y }
    public get w(): number { return this.size.w }
    public get h(): number { return this.size.h }

    public get left(): number       { return this.x }
    public get right(): number      { return this.x + this.w }
    public get top(): number        { return this.y }
    public get bottom(): number     { return this.y + this.h }
    public get centerX(): number    { return this.x + this.w / 2 }
    public get centerY(): number    { return this.y + this.h / 2 }
    public get center(): Point      { return new Point(this.centerX, this.centerY) }

    public set x(x: number) { this.origin.x = x }
    public set y(y: number) { this.origin.y = y }
    public set w(w: number) { this.size.w = w }
    public set h(h: number) { this.size.h = h }

    public equals(r: Rect): boolean {
        return this.origin.equals(r.origin) && this.size.equals(r.size)
    }
    public contains(p: Point): boolean {
        return  p.x >= this.x  
                && p.x < this.right
                && p.y >= this.y
                && p.y < this.bottom 
    }
    public overlaps(r: Rect): boolean {
        const rect = Rect.fromRects(this, r)
        return rect.w < this.w + r.w && rect.h < this.h + r.h
    }
}
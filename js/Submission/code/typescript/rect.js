import Point from './point.js';
import Size from './size.js';
export default class Rect {
    constructor(x, y, w, h) {
        this.origin = new Point(x, y);
        this.size = new Size(w, h);
    }
    static fromOrigin(origin, w, h) {
        return new Rect(origin.x, origin.y, w, h);
    }
    static fromSize(x, y, size) {
        return new Rect(x, y, size.w, size.h);
    }
    static fromOriginAndSize(origin, size) {
        return new Rect(origin.x, origin.y, size.w, size.h);
    }
    static fromPoints(p1, p2) {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        return new Rect(x, y, w, h);
    }
    static fromRects(r1, r2) {
        const left = Math.min(r1.left, r2.left);
        const top = Math.min(r1.top, r2.top);
        const right = Math.max(r1.right, r2.right);
        const bottom = Math.max(r1.bottom, r2.bottom);
        const w = right - left;
        const h = bottom - top;
        return new Rect(left, right, w, h);
    }
    get x() { return this.origin.x; }
    get y() { return this.origin.y; }
    get w() { return this.size.w; }
    get h() { return this.size.h; }
    get left() { return this.x; }
    get right() { return this.x + this.w; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }
    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }
    get center() { return new Point(this.centerX, this.centerY); }
    set x(x) { this.origin.x = x; }
    set y(y) { this.origin.y = y; }
    set w(w) { this.size.w = w; }
    set h(h) { this.size.h = h; }
    equals(r) {
        return this.origin.equals(r.origin) && this.size.equals(r.size);
    }
    contains(p) {
        return p.x >= this.x
            && p.x < this.right
            && p.y >= this.y
            && p.y < this.bottom;
    }
    overlaps(r) {
        const rect = Rect.fromRects(this, r);
        return rect.w < this.w + r.w && rect.h < this.h + r.h;
    }
}

import Vector from './vector.js';
export default class Point {
    static None = new Point(-1, -1);
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    differenceVector(that) {
        const dx = this.x - that.x;
        const dy = this.y - that.y;
        return new Vector(dx, dy);
    }
    addVector(v) {
        const x = this.x + v.dx;
        const y = this.y + v.dy;
        return new Point(x, y);
    }
    equals(that) {
        return that.x === this.x && that.y === this.y;
    }
    distance(that) {
        const dx = this.x - that.x;
        const dy = this.y - that.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    copy() {
        return new Point(this.x, this.y);
    }
}

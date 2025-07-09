import Vector from './vector.js'

export default class Point {
    public static None = new Point(-1, -1)

    public x: number
    public y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    public differenceVector(that: Point): Vector {
        const dx = this.x - that.x
        const dy = this.y - that.y
        return new Vector(dx, dy)
    }

    public addVector(v: Vector): Point {
        const x = this.x + v.dx
        const y = this.y + v.dy
        return new Point(x, y)
    }

    public equals(that: Point): boolean {
        return that.x === this.x && that.y === this.y
    }

    public distance(that: Point): number {
        const dx = this.x - that.x
        const dy = this.y - that.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    public copy() {
        return new Point(this.x, this.y)
    }
}
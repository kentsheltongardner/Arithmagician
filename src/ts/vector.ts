export default class Vector {
    public static readonly Zero         = new Vector(0, 0)
    public static readonly East         = new Vector(1, 0)
    public static readonly Southeast    = new Vector(1, 1)
    public static readonly South        = new Vector(0, 1)
    public static readonly Southwest    = new Vector(-1, 1)
    public static readonly West         = new Vector(-1, 0)
    public static readonly Northwest    = new Vector(-1, -1)
    public static readonly North        = new Vector(0, -1)
    public static readonly Northeast    = new Vector(1, -1)

    public dx: number
    public dy: number

    constructor(dx: number, dy: number) {
        this.dx = dx
        this.dy = dy
    }

    public oppositeVector() {
        return new Vector(-this.dx, -this.dy)
    }

    public scaledVector(scalar: number): Vector {
        return new Vector(this.dx * scalar, this.dy * scalar)
    }

    public equals(v: Vector): boolean {
        return v.dx === this.dx && v.dy === this.dy
    }
}
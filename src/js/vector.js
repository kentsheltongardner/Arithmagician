export default class Vector {
    static Zero = new Vector(0, 0);
    static East = new Vector(1, 0);
    static Southeast = new Vector(1, 1);
    static South = new Vector(0, 1);
    static Southwest = new Vector(-1, 1);
    static West = new Vector(-1, 0);
    static Northwest = new Vector(-1, -1);
    static North = new Vector(0, -1);
    static Northeast = new Vector(1, -1);
    dx;
    dy;
    constructor(dx, dy) {
        this.dx = dx;
        this.dy = dy;
    }
    oppositeVector() {
        return new Vector(-this.dx, -this.dy);
    }
    scaledVector(scalar) {
        return new Vector(this.dx * scalar, this.dy * scalar);
    }
    equals(v) {
        return v.dx === this.dx && v.dy === this.dy;
    }
}

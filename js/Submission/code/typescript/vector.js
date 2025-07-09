class Vector {
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
Vector.Zero = new Vector(0, 0);
Vector.East = new Vector(1, 0);
Vector.Southeast = new Vector(1, 1);
Vector.South = new Vector(0, 1);
Vector.Southwest = new Vector(-1, 1);
Vector.West = new Vector(-1, 0);
Vector.Northwest = new Vector(-1, -1);
Vector.North = new Vector(0, -1);
Vector.Northeast = new Vector(1, -1);
export default Vector;

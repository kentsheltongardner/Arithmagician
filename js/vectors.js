import Vector from "./vector.js";
const Vectors = {
    Zero: new Vector(0, 0),
    East: new Vector(1, 0),
    Southeast: new Vector(1, 1),
    South: new Vector(0, 1),
    Southwest: new Vector(-1, 1),
    West: new Vector(-1, 0),
    Northwest: new Vector(-1, -1),
    North: new Vector(0, -1),
    Northeast: new Vector(1, -1),
};
export default Vectors;

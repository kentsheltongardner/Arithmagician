import Point from "./point.js"
import Vector from "./vector.js"

export default class Laser {
    public startCell:   Point
    public endCell:     Point
    public startPixel:  Point
    public endPixel:    Point
    public direction:   Vector
    public value:       string
    
    constructor(
        startCell:  Point, 
        endCell:    Point, 
        startPixel: Point, 
        endPixel:   Point, 
        direction:  Vector,
        value:      string) {
        this.startCell  = startCell
        this.endCell    = endCell
        this.startPixel = startPixel
        this.endPixel   = endPixel
        this.direction  = direction
        this.value      = value
    }
}
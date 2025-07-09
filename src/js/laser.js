export default class Laser {
    startCell;
    endCell;
    startPixel;
    endPixel;
    direction;
    value;
    constructor(startCell, endCell, startPixel, endPixel, direction, value) {
        this.startCell = startCell;
        this.endCell = endCell;
        this.startPixel = startPixel;
        this.endPixel = endPixel;
        this.direction = direction;
        this.value = value;
    }
}

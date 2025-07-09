export class Copier {
    constructor() {
        this.floorCopies = new Array;
        this.objectCopies = new Array;
        this.roofCopies = new Array;
        this.cameraCopies = new Array;
    }
    clear() {
        this.floorCopies.length = 0;
        this.objectCopies.length = 0;
        this.roofCopies.length = 0;
        this.cameraCopies.length = 0;
    }
    addFloor(floorCopy) {
        this.floorCopies.push(floorCopy);
    }
    addObject(objectCopy) {
        this.objectCopies.push(objectCopy);
    }
    addRoof(roofCopy) {
        this.roofCopies.push(roofCopy);
    }
    addCamera(cameraCopy) {
        this.cameraCopies.push(cameraCopy);
    }
    copyString() {
        return JSON.stringify({
            floorCopies: this.floorCopies,
            objectCopies: this.objectCopies,
            roofCopies: this.roofCopies,
            cameraCopies: this.cameraCopies,
        });
    }
}

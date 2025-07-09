export interface FloorCopy {
    x:              number
    y:              number
    type:           number
    connections:    number
}

export interface ObjectCopy {
    x:              number
    y:              number
    type:           number
    connections:    number
    value:          string
    ports:          number
}

export interface RoofCopy {
    x:              number
    y:              number
    type:           number
    connections:    number
}

export interface CameraCopy {
    x:              number
    y:              number
    type:           number
}

export class Copier {
    private floorCopies     = new Array<FloorCopy>
    private objectCopies    = new Array<ObjectCopy>
    private roofCopies      = new Array<RoofCopy>
    private cameraCopies    = new Array<CameraCopy>

    public clear() {
        this.floorCopies.length     = 0
        this.objectCopies.length    = 0
        this.roofCopies.length      = 0
        this.cameraCopies.length    = 0
    }
    public addFloor(floorCopy: FloorCopy) {
        this.floorCopies.push(floorCopy)
    }
    public addObject(objectCopy: ObjectCopy) {
        this.objectCopies.push(objectCopy)
    }
    public addRoof(roofCopy: RoofCopy) {
        this.roofCopies.push(roofCopy)
    }
    public addCamera(cameraCopy: CameraCopy) {
        this.cameraCopies.push(cameraCopy)
    }
    public copyString(): string {
        return JSON.stringify({
            floorCopies: this.floorCopies,
            objectCopies: this.objectCopies,
            roofCopies: this.roofCopies,
            cameraCopies: this.cameraCopies,
        })
    }
}
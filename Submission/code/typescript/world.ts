import * as C from './constants.js'

export default class World {
    public floor                = new Array<Uint8Array>(C.WorldWidthCells)
    public floorConnections     = new Array<Uint8Array>(C.WorldWidthCells)
    public objects              = new Array<Uint8Array>(C.WorldWidthCells)
    public objectConnections    = new Array<Uint8Array>(C.WorldWidthCells)
    public objectValues         = new Array<Array<string>>(C.WorldWidthCells)
    public objectPorts          = new Array<Uint8Array>(C.WorldWidthCells)
    public roof                 = new Array<Uint8Array>(C.WorldWidthCells)
    public roofConnections      = new Array<Uint8Array>(C.WorldWidthCells)
    public camera               = new Array<Uint8Array>(C.WorldWidthCells)
    constructor() {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            this.floor[i]               = new Uint8Array(C.WorldHeightCells)
            this.floorConnections[i]    = new Uint8Array(C.WorldHeightCells)
            this.objects[i]             = new Uint8Array(C.WorldHeightCells)
            this.objectConnections[i]   = new Uint8Array(C.WorldHeightCells)
            this.objectPorts[i]         = new Uint8Array(C.WorldHeightCells)
            this.objectValues[i]        = new Array<string>(C.WorldHeightCells)
            this.roof[i]                = new Uint8Array(C.WorldHeightCells)
            this.roofConnections[i]     = new Uint8Array(C.WorldHeightCells)
            this.camera[i]              = new Uint8Array(C.WorldHeightCells)
            for (let j = 0; j < C.WorldHeightCells; j++) {
                this.objectValues[i][j] = C.EmptyString
            }
        }

        for (let i = 0; i < C.WorldWidthCells; i++) {
            this.objects[i][0]                      = C.TypeOffLimits
            this.objects[i][C.WorldHeightCells - 1] = C.TypeOffLimits
            this.camera[i][0]                       = C.TypeNoCamera
            this.camera[i][C.WorldHeightCells - 1]  = C.TypeNoCamera
        } 
        for (let i = 1; i < C.WorldHeightCells - 1; i++) {
            this.objects[0][i]                      = C.TypeOffLimits
            this.objects[C.WorldWidthCells - 1][i]  = C.TypeOffLimits
            this.camera[0][i]                       = C.TypeNoCamera
            this.camera[C.WorldWidthCells - 1][i]   = C.TypeNoCamera
        }
    }
    public saveAsJSON(): string {
        const data = {
            floor:              this.floor,
            floorConnections:   this.floorConnections,
            objects:            this.objects,
            objectConnections:  this.objectConnections,
            objectValues:       this.objectValues,
            objectPorts:        this.objectPorts,
            roof:               this.roof,
            roofConnections:    this.roofConnections,
            camera:             this.camera,
        }
        return JSON.stringify(data)
    }
    public loadFromJSON(json: string) {
        const data = JSON.parse(json)
        this.floor              = data.floor
        this.floorConnections   = data.floorConnections
        this.objects            = data.objects
        this.objectConnections  = data.objectConnections
        this.objectValues       = data.objectValues
        this.objectPorts        = data.objectPorts
        this.roof               = data.roof
        this.roofConnections    = data.roofConnections
        this.camera             = data.camera
    }
}
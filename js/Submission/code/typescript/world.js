import * as C from './constants.js';
export default class World {
    constructor() {
        this.floor = new Array(C.WorldWidthCells);
        this.floorConnections = new Array(C.WorldWidthCells);
        this.objects = new Array(C.WorldWidthCells);
        this.objectConnections = new Array(C.WorldWidthCells);
        this.objectValues = new Array(C.WorldWidthCells);
        this.objectPorts = new Array(C.WorldWidthCells);
        this.roof = new Array(C.WorldWidthCells);
        this.roofConnections = new Array(C.WorldWidthCells);
        this.camera = new Array(C.WorldWidthCells);
        for (let i = 0; i < C.WorldWidthCells; i++) {
            this.floor[i] = new Uint8Array(C.WorldHeightCells);
            this.floorConnections[i] = new Uint8Array(C.WorldHeightCells);
            this.objects[i] = new Uint8Array(C.WorldHeightCells);
            this.objectConnections[i] = new Uint8Array(C.WorldHeightCells);
            this.objectPorts[i] = new Uint8Array(C.WorldHeightCells);
            this.objectValues[i] = new Array(C.WorldHeightCells);
            this.roof[i] = new Uint8Array(C.WorldHeightCells);
            this.roofConnections[i] = new Uint8Array(C.WorldHeightCells);
            this.camera[i] = new Uint8Array(C.WorldHeightCells);
            for (let j = 0; j < C.WorldHeightCells; j++) {
                this.objectValues[i][j] = C.EmptyString;
            }
        }
        for (let i = 0; i < C.WorldWidthCells; i++) {
            this.objects[i][0] = C.TypeOffLimits;
            this.objects[i][C.WorldHeightCells - 1] = C.TypeOffLimits;
            this.camera[i][0] = C.TypeNoCamera;
            this.camera[i][C.WorldHeightCells - 1] = C.TypeNoCamera;
        }
        for (let i = 1; i < C.WorldHeightCells - 1; i++) {
            this.objects[0][i] = C.TypeOffLimits;
            this.objects[C.WorldWidthCells - 1][i] = C.TypeOffLimits;
            this.camera[0][i] = C.TypeNoCamera;
            this.camera[C.WorldWidthCells - 1][i] = C.TypeNoCamera;
        }
    }
    saveAsJSON() {
        const data = {
            floor: this.floor,
            floorConnections: this.floorConnections,
            objects: this.objects,
            objectConnections: this.objectConnections,
            objectValues: this.objectValues,
            objectPorts: this.objectPorts,
            roof: this.roof,
            roofConnections: this.roofConnections,
            camera: this.camera,
        };
        return JSON.stringify(data);
    }
    loadFromJSON(json) {
        const data = JSON.parse(json);
        this.floor = data.floor;
        this.floorConnections = data.floorConnections;
        this.objects = data.objects;
        this.objectConnections = data.objectConnections;
        this.objectValues = data.objectValues;
        this.objectPorts = data.objectPorts;
        this.roof = data.roof;
        this.roofConnections = data.roofConnections;
        this.camera = data.camera;
    }
}

import Vector from "./vector.js";
export default class InputManager {
    static _directionMap = new Map([
        ['KeyD', Vector.East],
        ['KeyS', Vector.South],
        ['KeyA', Vector.West],
        ['KeyW', Vector.North]
    ]);
    _directions = Array();
    _stayPressed = false;
    _undoPressed = false;
    constructor() { }
    keyDown(event) {
        if (event.code === 'ShiftLeft') {
            this._stayPressed = true;
        }
        else if (event.code === 'Space') {
            this._undoPressed = true;
        }
        else if (InputManager._directionMap.has(event.code)
            && this._directions.indexOf(event.code) === -1) {
            this._directions.push(event.code);
        }
    }
    keyUp(event) {
        if (event.code === 'ShiftLeft') {
            this._stayPressed = false;
        }
        else if (event.code === 'Space') {
            this._undoPressed = false;
        }
        else if (InputManager._directionMap.has(event.code)) {
            const index = this._directions.indexOf(event.code);
            if (index !== -1) {
                this._directions.splice(index, 1);
            }
        }
        // if (InputManager._directionMap.has(event.code)) {
        //     const index = this._directions.indexOf(event.code)
        //     if (index !== -1) {
        //         this._directions.splice(index, 1)
        //     }
        // }
    }
    direction() {
        const length = this._directions.length;
        if (length === 0) {
            return Vector.Zero;
        }
        const code = this._directions[length - 1];
        return InputManager._directionMap.get(code);
    }
    stayPressed() { return this._stayPressed; }
    undoPressed() { return this._undoPressed; }
}

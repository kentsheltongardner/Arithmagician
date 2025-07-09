import Vector from "./vector.js"

export default class InputManager {
    private static readonly _directionMap = new Map<string, Vector>([
        ['KeyD', Vector.East],
        ['KeyS', Vector.South],
        ['KeyA', Vector.West],
        ['KeyW', Vector.North]
    ])

    private _directions = Array<string>()
    private _stayPressed = false
    private _undoPressed = false

    constructor() {}
    public keyDown(event: KeyboardEvent) {
        if (event.code === 'ShiftLeft') {
            this._stayPressed = true
        } else if (event.code === 'Space') {
            this._undoPressed = true
        } else if (InputManager._directionMap.has(event.code)
                && this._directions.indexOf(event.code) === -1) {
            this._directions.push(event.code)
        }
    }
    public keyUp(event: KeyboardEvent) {
        if (event.code === 'ShiftLeft') {
            this._stayPressed = false
        } else if (event.code === 'Space') {
            this._undoPressed = false
        } else if (InputManager._directionMap.has(event.code)) {
            const index = this._directions.indexOf(event.code)
            if (index !== -1) {
                this._directions.splice(index, 1)
            }
        }
        // if (InputManager._directionMap.has(event.code)) {
        //     const index = this._directions.indexOf(event.code)
        //     if (index !== -1) {
        //         this._directions.splice(index, 1)
        //     }
        // }
    }
    public direction(): Vector {
        const length = this._directions.length
        if (length === 0) {
            return Vector.Zero
        }
        const code = this._directions[length - 1]
        return InputManager._directionMap.get(code)!
    }
    public stayPressed(): boolean { return this._stayPressed }
    public undoPressed(): boolean { return this._undoPressed }
}
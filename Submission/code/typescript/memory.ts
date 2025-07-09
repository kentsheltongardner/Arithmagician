class Change {
    public edit:    number
    public grid:    any
    public x:       number
    public y:       number
    public value:   any

    constructor(edit: number, grid: any, x: number, y: number, value: any) {
        this.edit   = edit
        this.grid   = grid
        this.x      = x
        this.y      = y
        this.value  = value
    }
    public undo() {
        this.grid[this.x][this.y] = this.value 
    }
    public currentState() {
        return new Change(this.edit, this.grid, this.x, this.y, this.grid[this.x][this.y])
    }
}

export default class Memory {
    private _undoStack  = new Array<Change>()
    private _redoStack  = new Array<Change>()
    private _edit       = 0
    public remember(grid: any, x: number, y: number) {
        const change            = new Change(this._edit, grid, x, y, grid[x][y])
        this._redoStack.length  = 0
        this._undoStack.push(change)
    }
    // public rememberSingle(grid: any, x: number, y: number) {
    //     this.remember(grid, x, y)
    //     this.endChanges()
    // }
    public endChanges() {
        this._edit++
    }
    public undoChanges() {
        this.change(this._undoStack, this._redoStack)
    }
    public redoChanges() {
        this.change(this._redoStack, this._undoStack)
    }
    private change(stackA: Array<Change>, stackB: Array<Change>) {
        const length = stackA.length
        if (length === 0) return
        const edit = stackA[length - 1].edit
        while (true) {
            const change = stackA.pop()
            if (change === undefined) break
            if (change.edit !== edit) {
                stackA.push(change)
                break
            } else {
                stackB.push(change.currentState())
                change.undo()
            }
        }
    }
}
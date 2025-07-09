class Change {
    edit;
    grid;
    x;
    y;
    value;
    constructor(edit, grid, x, y, value) {
        this.edit = edit;
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.value = value;
    }
    undo() {
        this.grid[this.x][this.y] = this.value;
    }
    currentState() {
        return new Change(this.edit, this.grid, this.x, this.y, this.grid[this.x][this.y]);
    }
}
export default class Memory {
    _undoStack = new Array();
    _redoStack = new Array();
    _edit = 0;
    remember(grid, x, y) {
        const change = new Change(this._edit, grid, x, y, grid[x][y]);
        this._redoStack.length = 0;
        this._undoStack.push(change);
    }
    // public rememberSingle(grid: any, x: number, y: number) {
    //     this.remember(grid, x, y)
    //     this.endChanges()
    // }
    endChanges() {
        this._edit++;
    }
    undoChanges() {
        this.change(this._undoStack, this._redoStack);
    }
    redoChanges() {
        this.change(this._redoStack, this._undoStack);
    }
    change(stackA, stackB) {
        const length = stackA.length;
        if (length === 0)
            return;
        const edit = stackA[length - 1].edit;
        while (true) {
            const change = stackA.pop();
            if (change === undefined)
                break;
            if (change.edit !== edit) {
                stackA.push(change);
                break;
            }
            else {
                stackB.push(change.currentState());
                change.undo();
            }
        }
    }
}

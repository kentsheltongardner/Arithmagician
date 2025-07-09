import Point from './point.js';
import * as C from './constants.js';
export default class Camera {
    static SPEED = 0.125;
    _focus = new Point(0, 0);
    focus(p, grid) {
        // this._focus = p.copy()
        // I just need one point and an overlap type : 
        let x = p.x;
        let y = p.y;
        let closestX = new Point(0, 0);
        let closestY = new Point(0, 0);
        let overlap = false;
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (grid[i][j] !== C.TypeNoCamera)
                    continue;
                const adjustX = i * C.CellSizePixels + C.HalfCellSizePixels;
                const adjustY = j * C.CellSizePixels + C.HalfCellSizePixels;
                if (Camera.overlap(adjustX, adjustY, x, y)) {
                    if (overlap) {
                        if (Math.abs(adjustX - x) < Math.abs(closestX.x - x)) {
                            closestX = new Point(adjustX, adjustY);
                        }
                        if (Math.abs(adjustY - y) < Math.abs(closestY.y - y)) {
                            closestY = new Point(adjustX, adjustY);
                        }
                    }
                    else {
                        closestX = new Point(adjustX, adjustY);
                        closestY = new Point(adjustX, adjustY);
                        overlap = true;
                    }
                }
            }
        }
        if (overlap) {
            const equalX = closestX.x === closestY.x;
            const equalY = closestX.y === closestY.y;
            if (equalX && equalY) {
                // exterior
                let newX = 0;
                let newY = 0;
                if (closestX.x < x) {
                    newX = closestX.x + C.HalfCellSizePixels + C.HalfDisplayWidthPixels;
                }
                else {
                    newX = closestX.x - C.HalfCellSizePixels - C.HalfDisplayWidthPixels;
                }
                if (closestY.y < y) {
                    newY = closestY.y + C.HalfCellSizePixels + C.HalfDisplayHeightPixels;
                }
                else {
                    newY = closestY.y - C.HalfCellSizePixels - C.HalfDisplayHeightPixels;
                }
                const dx = Math.abs(newX - x);
                const dy = Math.abs(newX - y);
                if (dx < dy)
                    x = newX;
                else
                    y = newY;
            }
            else if (equalX) {
                // adjust horizontal
                if (closestX.x < x) {
                    x = closestX.x + C.HalfCellSizePixels + C.HalfDisplayWidthPixels;
                }
                else {
                    x = closestX.x - C.HalfCellSizePixels - C.HalfDisplayWidthPixels;
                }
            }
            else if (equalY) {
                // adjust vertical
                if (closestY.y < y) {
                    y = closestY.y + C.HalfCellSizePixels + C.HalfDisplayHeightPixels;
                }
                else {
                    y = closestY.y - C.HalfCellSizePixels - C.HalfDisplayHeightPixels;
                }
            }
            else {
                // adjust vertical and horizontal
                if (closestX.y < y) {
                    y = closestX.y + C.HalfCellSizePixels + C.HalfDisplayHeightPixels;
                }
                else {
                    y = closestX.y - C.HalfCellSizePixels - C.HalfDisplayHeightPixels;
                }
                if (closestY.x < x) {
                    x = closestY.x + C.HalfCellSizePixels + C.HalfDisplayWidthPixels;
                }
                else {
                    x = closestY.x - C.HalfCellSizePixels - C.HalfDisplayWidthPixels;
                }
            }
        }
        this._focus.x = x;
        this._focus.y = y;
    }
    track(p, grid) {
        const contacts = new Array();
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (grid[i][j] !== C.TypeNoCamera)
                    continue;
                const adjustX = i * C.CellSizePixels + C.HalfCellSizePixels;
                const adjustY = j * C.CellSizePixels + C.HalfCellSizePixels;
                contacts.push(new Point(adjustX, adjustY));
            }
        }
        const trackX = Math.floor((p.x - this._focus.x) * Camera.SPEED);
        const trackY = Math.floor((p.y - this._focus.y) * Camera.SPEED);
        const signX = Math.sign(trackX);
        const signY = Math.sign(trackY);
        const destX = this._focus.x + trackX;
        const destY = this._focus.y + trackY;
        while (true) {
            let canX = this._focus.x !== destX;
            let canY = this._focus.y !== destY;
            if (!canX && !canY)
                break;
            const nextX = this._focus.x + signX;
            const nextY = this._focus.y + signY;
            for (const contact of contacts) {
                if (canX) {
                    if (Camera.overlap(nextX, this._focus.y, contact.x, contact.y))
                        canX = false;
                }
                if (canY) {
                    if (Camera.overlap(this._focus.x, nextY, contact.x, contact.y))
                        canY = false;
                }
            }
            if (!canX && !canY)
                break;
            if (!canY) {
                this._focus.x = nextX;
                continue;
            }
            if (!canX) {
                this._focus.y = nextY;
                continue;
            }
            const dxOld = destX - this._focus.x;
            const dyOld = destY - this._focus.y;
            const dxNew = destX - nextX;
            const dyNew = destY - nextY;
            const distanceSquaredX = dxNew * dxNew + dyOld * dyOld;
            const distanceSquaredY = dxOld * dxOld + dyNew * dyNew;
            if (distanceSquaredX < distanceSquaredY) {
                this._focus.x = nextX;
            }
            else {
                this._focus.y = nextY;
            }
        }
    }
    static overlap(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceX = Math.abs(dx);
        const distanceY = Math.abs(dy);
        const overlapX = distanceX < C.HalfCellSizePixels + C.HalfDisplayWidthPixels;
        const overlapY = distanceY < C.HalfCellSizePixels + C.HalfDisplayHeightPixels;
        return overlapX && overlapY;
    }
    renderOrigin() {
        const x = Math.floor(this._focus.x - C.DisplayWidthPixels / 2);
        const y = Math.floor(this._focus.y - C.DisplayHeightPixels / 2);
        return new Point(x, y);
    }
    currentFocus() {
        return this._focus.copy();
    }
    setFocus(focus) {
        this._focus = focus.copy();
    }
}

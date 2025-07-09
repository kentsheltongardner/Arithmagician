import FPSTracker from './fps.js';
import InputManager from './input.js';
import Rect from './rect.js';
import * as C from './constants.js';
import * as I from './images.js';
import * as D from './data.js';
import { BufferedAudio, SoundSet, StreamingAudio } from './sounds.js';
import World from './world.js';
import Camera from './camera.js';
import Point from './point.js';
import Compressor from './compressor.js';
import Vector from './vector.js';
import Laser from './laser.js';
import Rational from './rational.js';
class UndoData {
    direction;
    movers;
    playerCell;
    playerPorts;
    cameraFocus;
    constructor(direction, movers, playerCell, playerPorts, cameraFocus) {
        this.direction = direction;
        this.movers = movers;
        this.playerCell = playerCell;
        this.playerPorts = playerPorts;
        this.cameraFocus = cameraFocus;
    }
}
export default class Game {
    _fpsTracker = new FPSTracker(60);
    _inputManager = new InputManager();
    _world = new World();
    _camera = new Camera();
    _playerCell = new Point(0, 0);
    _lastFrameTime = 0;
    _movementFrame = 0;
    _movementDirection = new Vector(0, 0);
    _leftDown = false;
    _animationId = 0;
    _soundsPlaying = false;
    _reading = false;
    _frame = 0;
    _undoStack = new Array();
    _flags = new Array(C.WorldWidthCells);
    _darkness = new Array(C.WorldWidthCells);
    _concatenatedValues = new Array(C.WorldWidthCells);
    _ambienceAudio = new StreamingAudio('./music/entrance.mp3');
    _laserAudio = new BufferedAudio();
    _zapAudio = new BufferedAudio();
    _footsteps = new SoundSet();
    _canvas;
    _cutoutCanvas;
    _context;
    _cutoutContext;
    // #######  #     #  #######  #######  
    //    #     ##    #     #        #     
    //    #     # #   #     #        #     
    //    #     #  #  #     #        #     
    //    #     #   # #     #        #     
    //    #     #    ##     #        #     
    // #######  #     #  #######     #     
    constructor() {
        this._canvas = document.getElementById('game-canvas');
        this._cutoutCanvas = document.getElementById('cutout-canvas');
        this._context = this._canvas.getContext('2d');
        this._cutoutContext = this._cutoutCanvas.getContext('2d');
        this._canvas.width = C.DisplayWidthPixels;
        this._cutoutCanvas.width = C.DisplayWidthPixels;
        this._canvas.height = C.DisplayHeightPixels;
        this._cutoutCanvas.height = C.DisplayHeightPixels;
        for (let i = 0; i < C.WorldWidthCells; i++) {
            this._flags[i] = new Uint8Array(C.WorldHeightCells);
            this._darkness[i] = new Uint8Array(C.WorldHeightCells);
            this._concatenatedValues[i] = new Array(C.WorldHeightCells);
            for (let j = 0; j < C.WorldHeightCells; j++) {
                this._concatenatedValues[i][j] = C.EmptyString;
            }
        }
        this._canvas.addEventListener('mousedown', event => { this.mouseDownHandler(event); });
        this._canvas.addEventListener('mousemove', event => { this.mouseMoveHandler(event); });
        this._canvas.addEventListener('mouseup', event => { this.mouseUpHandler(event); });
        window.addEventListener('keydown', event => { this.keyDownHandler(event); }, false);
        window.addEventListener('keyup', event => { this.keyUpHandler(event); }, false);
        window.addEventListener('contextmenu', event => { this.ignoreContextMenu(event); });
        this.loadSounds();
    }
    async loadFromBlob(blob) {
        const json = await Compressor.decompress(blob);
        this.loadFromJSON(json);
    }
    async loadFromFile(filename) {
        const response = await fetch(`./worlds/${filename}.wld`);
        const blob = await response.blob();
        const json = await Compressor.decompress(blob);
        this.loadFromJSON(json);
    }
    loadFromJSON(json) {
        this._world.loadFromJSON(json);
    }
    async saveToBlob() {
        const json = this._world.saveAsJSON();
        const blob = await Compressor.compress(json);
        return blob;
    }
    run() {
        this.findPlayerCell();
        this.focusCamera();
        this.calculateDarkness();
        this._lastFrameTime = performance.now();
        this._fpsTracker.start();
        this.loop();
        this._laserAudio.loop();
        this._ambienceAudio.loop();
        this._laserAudio.volume = 0.0;
        this._footsteps.volume = 0.125;
        this._soundsPlaying = true;
    }
    findPlayerCell() {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (this._world.objects[i][j] === C.TypeArithmagician) {
                    this._playerCell = new Point(i, j);
                    return;
                }
            }
        }
    }
    focusCamera() {
        const x = this._playerCell.x * C.CellSizePixels + C.CellSizePixels / 2;
        const y = this._playerCell.y * C.CellSizePixels + C.CellSizePixels / 2;
        this._camera.focus(new Point(x, y), this._world.camera);
    }
    calculateDarkness() {
        const objects = this._world.objects;
        const connections = this._world.objectConnections;
        for (let i = 1; i < C.WorldWidthCells - 1; i++) {
            for (let j = 1; j < C.WorldHeightCells - 1; j++) {
                const type = objects[i][j];
                if (C.TypeIsImmobile[type])
                    this._darkness[i][j] = 1;
            }
        }
        for (let i = 0; i < C.MaxDarkness; i++) {
            for (let j = 0; j < C.WorldWidthCells; j++) {
                for (let k = 0; k < C.WorldHeightCells; k++) {
                    const d = this._darkness[j][k];
                    if (d === 0)
                        continue;
                    const e = d <= this._darkness[j + 1][k] && (connections[j][k] & C.BitsEast) === C.BitsEast;
                    const s = d <= this._darkness[j][k + 1] && (connections[j][k] & C.BitsSouth) === C.BitsSouth;
                    const w = d <= this._darkness[j - 1][k] && (connections[j][k] & C.BitsWest) === C.BitsWest;
                    const n = d <= this._darkness[j][k - 1] && (connections[j][k] & C.BitsNorth) === C.BitsNorth;
                    const se = d <= this._darkness[j + 1][k + 1] && (connections[j][k] & C.BitsSoutheast) === C.BitsSoutheast;
                    const sw = d <= this._darkness[j - 1][k + 1] && (connections[j][k] & C.BitsSouthwest) === C.BitsSouthwest;
                    const nw = d <= this._darkness[j - 1][k - 1] && (connections[j][k] & C.BitsNorthwest) === C.BitsNorthwest;
                    const ne = d <= this._darkness[j + 1][k - 1] && (connections[j][k] & C.BitsNortheast) === C.BitsNortheast;
                    if (e && s && w && n && se && sw && nw && ne) {
                        this._darkness[j][k]++;
                    }
                }
            }
        }
    }
    // #######  #     #  ######   #     #  #######  
    //    #     ##    #  #     #  #     #     #     
    //    #     # #   #  #     #  #     #     #     
    //    #     #  #  #  ######   #     #     #     
    //    #     #   # #  #        #     #     #     
    //    #     #    ##  #        #     #     #     
    // #######  #     #  #         #####      #     
    mouseDownHandler(event) {
        if (event.button === 0) {
            this._leftDown = true;
            if (this._reading) {
                this._reading = false;
            }
            else {
                const grabCell = this.grabCell();
                if (this._world.objects[grabCell.x][grabCell.y] === C.TypeMonument) {
                    this._reading = true;
                }
            }
        }
    }
    mouseMoveHandler(event) {
        // Turn based on mouse movement
        // if (this._leftDown) return
        // const playerPosition = this.playerPosition()
        // const mousePoint = new Point(event.offsetX, event.offsetY)
        // const mousePosition = this.mousePosition(mousePoint)
        // const direction = this.cardinalDirection(playerPosition, mousePosition)
        // const x = this._playerCell.x
        // const y = this._playerCell.y
        // if (direction.equals(Vector.East)) {
        //     this._world.objectPorts[x][y] = C.PortOutEast
        // } else if (direction.equals(Vector.South)) {
        //     this._world.objectPorts[x][y] = C.PortOutSouth
        // } else if (direction.equals(Vector.West)) {
        //     this._world.objectPorts[x][y] = C.PortOutWest
        // } else if (direction.equals(Vector.North)) {
        //     this._world.objectPorts[x][y] = C.PortOutNorth
        // }
    }
    mouseUpHandler(event) {
        if (event.button === 0)
            this._leftDown = false;
    }
    // private mousePosition(mousePoint: Point): Point {
    //     const cameraOrigin = this._camera.renderOrigin()
    //     const renderRect = Game.gameDisplayRect()
    //     const x = cameraOrigin.x + mousePoint.x / renderRect.w * C.DisplayWidthPixels
    //     const y = cameraOrigin.y + mousePoint.y / renderRect.h * C.DisplayHeightPixels
    //     return new Point(x, y)
    // }
    // private cardinalDirection(a: Point, b: Point): Vector {
    //     const dx = b.x - a.x
    //     const dy = b.y - a.y
    //     return Math.abs(dx) > Math.abs(dy) ? new Vector(Math.sign(dx), 0) : new Vector(0, Math.sign(dy))
    // }
    grab() {
        return this._leftDown;
    }
    async keyDownHandler(event) {
        this._inputManager.keyDown(event);
    }
    keyUpHandler(event) {
        this._inputManager.keyUp(event);
    }
    ignoreContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    async loadSounds() {
        this.loadFootsteps();
        this._laserAudio.load('/sounds/laser.mp3');
        this._zapAudio.load('/sounds/zap.mp3');
    }
    loadFootsteps() {
        for (let i = 1; i <= 10; i++) {
            this._footsteps.load(`/sounds/footsteps/footstep${i}.mp3`);
        }
    }
    // #     #  ######   ######      #     #######  #######  
    // #     #  #     #  #     #    # #       #     #        
    // #     #  #     #  #     #   #   #      #     #        
    // #     #  ######   #     #  #######     #     ####     
    // #     #  #        #     #  #     #     #     #        
    // #     #  #        #     #  #     #     #     #        
    //  #####   #        ######   #     #     #     #######  
    loop() {
        const time = performance.now();
        const frameTime = (time - this._lastFrameTime) / 1000;
        if (frameTime > 1 / 65) {
            this.update();
            this.render();
            if (this._soundsPlaying) {
                this.setLaserVolume();
            }
            this._lastFrameTime = time;
            this._frame++;
        }
        this._animationId = requestAnimationFrame(() => { this.loop(); });
    }
    close() {
        window.cancelAnimationFrame(this._animationId);
    }
    update() {
        if (this.isMovement()) {
            this.advanceFrame();
            if (this.movementComplete()) {
                this.performMovements();
                this._movementFrame = 0;
                this._movementDirection = Vector.Zero;
            }
        }
        else if (this._inputManager.undoPressed() && this._frame % 5 === 0) {
            this.undoMovements();
        }
        else if (!this.playerPetrified()) {
            const direction = this._inputManager.direction();
            if (!direction.equals(Vector.Zero)) {
                this._reading = false;
                const x = this._playerCell.x;
                const y = this._playerCell.y;
                if (this._inputManager.stayPressed()) {
                    // Add direction undo, if desired
                    if (direction.equals(Vector.East)) {
                        this._world.objectPorts[x][y] = C.PortOutEast;
                    }
                    else if (direction.equals(Vector.South)) {
                        this._world.objectPorts[x][y] = C.PortOutSouth;
                    }
                    else if (direction.equals(Vector.West)) {
                        this._world.objectPorts[x][y] = C.PortOutWest;
                    }
                    else if (direction.equals(Vector.North)) {
                        this._world.objectPorts[x][y] = C.PortOutNorth;
                    }
                }
                else {
                    this.clearFlags(C.FlagsAll);
                    const lasers = this.lasers();
                    this.unlockGates(lasers);
                    const dx = direction.dx;
                    const dy = direction.dy;
                    const grabCell = this.grabCell();
                    const grabType = this._world.objects[grabCell.x][grabCell.y];
                    const grab = this.grab() && grabType !== C.TypeEmpty;
                    let move = this.calculateMovements(x, y, dx, dy);
                    if (grab) {
                        move &&= this.calculateMovements(grabCell.x, grabCell.y, dx, dy);
                    }
                    else {
                        if (direction.equals(Vector.East)) {
                            this._world.objectPorts[x][y] = C.PortOutEast;
                        }
                        else if (direction.equals(Vector.South)) {
                            this._world.objectPorts[x][y] = C.PortOutSouth;
                        }
                        else if (direction.equals(Vector.West)) {
                            this._world.objectPorts[x][y] = C.PortOutWest;
                        }
                        else if (direction.equals(Vector.North)) {
                            this._world.objectPorts[x][y] = C.PortOutNorth;
                        }
                    }
                    if (move) {
                        this._footsteps.playRandom();
                        this._movementDirection = direction;
                        this.advanceFrame();
                    }
                }
            }
        }
        this._camera.track(this.playerPosition(), this._world.camera);
    }
    grabCell() {
        const x = this._playerCell.x;
        const y = this._playerCell.y;
        const grabPort = this._world.objectPorts[x][y];
        const grabVector = this.grabVector(grabPort);
        const grabX = x + grabVector.dx;
        const grabY = y + grabVector.dy;
        return new Point(grabX, grabY);
    }
    grabVector(port) {
        switch (port) {
            case C.PortOut: return Vector.East;
            case C.PortOut << 2: return Vector.South;
            case C.PortOut << 4: return Vector.West;
            case C.PortOut << 6: return Vector.North;
            default: return Vector.Zero;
        }
    }
    playerPetrified() {
        return this._world.objects[this._playerCell.x][this._playerCell.y] === C.TypePetrified;
    }
    isMovement() {
        return this._movementFrame > 0;
    }
    advanceFrame() {
        this._movementFrame++;
    }
    movementComplete() {
        return this._movementFrame === C.MovementFrames;
    }
    movementOffset() {
        const dx = this._movementDirection.dx * this._movementFrame * C.MovementSpeed;
        const dy = this._movementDirection.dy * this._movementFrame * C.MovementSpeed;
        return new Vector(dx, dy);
    }
    playerPosition() {
        const movementOffset = this.movementOffset();
        const x = this._playerCell.x * C.CellSizePixels + movementOffset.dx + C.CellSizePixels / 2;
        const y = this._playerCell.y * C.CellSizePixels + movementOffset.dy + C.CellSizePixels / 2;
        return new Point(x, y);
    }
    // #     #   #####   #     #  #######  #     #  #######  #     #  #######  
    // ##   ##  #     #  #     #  #        ##   ##  #        ##    #     #     
    // # # # #  #     #  #     #  #        # # # #  #        # #   #     #     
    // #  #  #  #     #  #     #  ####     #  #  #  ####     #  #  #     #     
    // #     #  #     #   #   #   #        #     #  #        #   # #     #     
    // #     #  #     #    # #    #        #     #  #        #    ##     #     
    // #     #   #####      #     #######  #     #  #######  #     #     #     
    clearFlags(flags) {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                this._flags[i][j] &= ~flags;
            }
        }
    }
    traversed(x, y) { return this._flags[x][y] & C.FlagsTraversed; }
    moving(x, y) { return this._flags[x][y] & C.FlagsMoving; }
    unlocked(x, y) { return this._flags[x][y] & C.FlagsUnlocked; }
    inactive(x, y) { return this._flags[x][y] & C.FlagsInactive; }
    traverse(x, y) { this._flags[x][y] |= C.FlagsTraversed; }
    move(x, y) { this._flags[x][y] |= C.FlagsMoving; }
    unlock(x, y) { this._flags[x][y] |= C.FlagsUnlocked; }
    deactivate(x, y) { this._flags[x][y] |= C.FlagsInactive; }
    calculateMovements(x, y, dx, dy) {
        if (this.traversed(x, y))
            return true;
        this.traverse(x, y);
        const type = this._world.objects[x][y];
        if (type === C.TypeEmpty)
            return true;
        if (C.TypeIsImmobile[type])
            return false;
        if (type === C.TypeGate && !this.unlocked(x, y))
            return false;
        this.move(x, y);
        const connections = this._world.objectConnections[x][y];
        if ((connections & C.BitsEast) !== 0 && !this.calculateMovements(x + 1, y, dx, dy))
            return false;
        if ((connections & C.BitsSouth) !== 0 && !this.calculateMovements(x, y + 1, dx, dy))
            return false;
        if ((connections & C.BitsWest) !== 0 && !this.calculateMovements(x - 1, y, dx, dy))
            return false;
        if ((connections & C.BitsNorth) !== 0 && !this.calculateMovements(x, y - 1, dx, dy))
            return false;
        const roofConnections = this._world.roofConnections[x][y];
        if ((roofConnections & C.BitsEast) !== 0 && !this.calculateMovements(x + 1, y, dx, dy))
            return false;
        if ((roofConnections & C.BitsSouth) !== 0 && !this.calculateMovements(x, y + 1, dx, dy))
            return false;
        if ((roofConnections & C.BitsWest) !== 0 && !this.calculateMovements(x - 1, y, dx, dy))
            return false;
        if ((roofConnections & C.BitsNorth) !== 0 && !this.calculateMovements(x, y - 1, dx, dy))
            return false;
        return this.calculateMovements(x + dx, y + dy, dx, dy);
    }
    performMovements() {
        const objects = this._world.objects;
        const objectConnections = this._world.objectConnections;
        const objectValues = this._world.objectValues;
        const objectPorts = this._world.objectPorts;
        const roof = this._world.roof;
        const roofConnections = this._world.roofConnections;
        let startX = 0;
        let startY = 0;
        let endX = C.WorldWidthCells;
        let endY = C.WorldHeightCells;
        let dx = this._movementDirection.dx;
        let dy = this._movementDirection.dy;
        const iteratorX = dx === 1 ? -1 : 1;
        const iteratorY = dy === 1 ? -1 : 1;
        if (dx === 1) {
            startX = C.WorldWidthCells - 1;
            endX = 0;
        }
        if (dy === 1) {
            startY = C.WorldHeightCells - 1;
            endY = 0;
        }
        const undoDirection = this._movementDirection.oppositeVector();
        const playerPorts = objectPorts[this._playerCell.x][this._playerCell.y];
        const movers = new Array();
        for (let i = startX; i !== endX; i += iteratorX) {
            for (let j = startY; j !== endY; j += iteratorY) {
                if (this.moving(i, j)) {
                    const x = i + dx;
                    const y = j + dy;
                    movers.push(new Point(x, y));
                    objects[x][y] = objects[i][j];
                    objectConnections[x][y] = objectConnections[i][j];
                    objectValues[x][y] = objectValues[i][j];
                    objectPorts[x][y] = objectPorts[i][j];
                    objects[i][j] = C.TypeEmpty;
                    objectConnections[i][j] = C.BitsNone;
                    objectValues[i][j] = C.EmptyString;
                    objectPorts[i][j] = C.PortNone;
                    roof[x][y] = roof[i][j];
                    roofConnections[x][y] = roofConnections[i][j];
                    roof[i][j] = C.TypeEmpty;
                    roofConnections[i][j] = C.BitsNone;
                }
            }
        }
        this._undoStack.push(new UndoData(undoDirection, movers, this._playerCell.copy(), playerPorts, this._camera.currentFocus()));
        this._playerCell.x += this._movementDirection.dx;
        this._playerCell.y += this._movementDirection.dy;
    }
    undoMovements() {
        if (this._reading)
            return;
        if (this._undoStack.length === 0)
            return;
        const undoData = this._undoStack.pop();
        this.clearFlags(C.FlagsMoving);
        for (const mover of undoData.movers) {
            this.move(mover.x, mover.y);
        }
        const objects = this._world.objects;
        const objectConnections = this._world.objectConnections;
        const objectValues = this._world.objectValues;
        const objectPorts = this._world.objectPorts;
        const roof = this._world.roof;
        const roofConnections = this._world.roofConnections;
        let startX = 0;
        let startY = 0;
        let endX = C.WorldWidthCells;
        let endY = C.WorldHeightCells;
        let dx = undoData.direction.dx;
        let dy = undoData.direction.dy;
        const iteratorX = dx === 1 ? -1 : 1;
        const iteratorY = dy === 1 ? -1 : 1;
        if (dx === 1) {
            startX = C.WorldWidthCells - 1;
            endX = 0;
        }
        if (dy === 1) {
            startY = C.WorldHeightCells - 1;
            endY = 0;
        }
        for (let i = startX; i !== endX; i += iteratorX) {
            for (let j = startY; j !== endY; j += iteratorY) {
                if (this.moving(i, j)) {
                    const x = i + dx;
                    const y = j + dy;
                    objects[x][y] = objects[i][j];
                    objectConnections[x][y] = objectConnections[i][j];
                    objectValues[x][y] = objectValues[i][j];
                    objectPorts[x][y] = objectPorts[i][j];
                    objects[i][j] = C.TypeEmpty;
                    objectConnections[i][j] = C.BitsNone;
                    objectValues[i][j] = C.EmptyString;
                    objectPorts[i][j] = C.PortNone;
                    roof[x][y] = roof[i][j];
                    roofConnections[x][y] = roofConnections[i][j];
                    roof[i][j] = C.TypeEmpty;
                    roofConnections[i][j] = C.BitsNone;
                }
            }
        }
        this._playerCell = undoData.playerCell;
        objectPorts[this._playerCell.x][this._playerCell.y] = undoData.playerPorts;
        if (this.playerPetrified()) {
            objects[this._playerCell.x][this._playerCell.y] = C.TypeArithmagician;
        }
        this._camera.setFocus(undoData.cameraFocus);
    }
    // #           #      #####   #######  ######    #####   
    // #          # #    #     #  #        #     #  #     #  
    // #         #   #   #        #        #     #  #        
    // #        #######   #####   ####     ######    #####   
    // #        #     #        #  #        #   #          #  
    // #        #     #  #     #  #        #    #   #     #  
    // #######  #     #   #####   #######  #     #   #####   
    cellRect(minX, minY, maxX, maxY) {
        const x = Math.floor(minX / C.CellSizePixels);
        const y = Math.floor(minY / C.CellSizePixels);
        const w = Math.ceil(maxX / C.CellSizePixels) - x;
        const h = Math.ceil(maxY / C.CellSizePixels) - y;
        return new Rect(x, y, w, h);
    }
    lasers() {
        const objects = this._world.objects;
        const values = this._world.objectValues;
        const lasers = new Array;
        const mx = this._movementDirection.dx;
        const my = this._movementDirection.dy;
        this.deactivateVariables();
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                this._concatenatedValues[i][j] = C.EmptyString;
            }
        }
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (objects[i][j] !== C.TypeConstant)
                    continue;
                const value = values[i][j];
                const operandType = D.stringToOperandType(value);
                this.fireLasers(i, j, mx, my, value, operandType, lasers);
            }
        }
        return lasers;
    }
    deactivateVariables() {
        this.clearFlags(C.FlagsInactive);
        const objects = this._world.objects;
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (objects[i][j] === C.TypeVariable) {
                    this.deactivateVariable(i, j);
                }
            }
        }
    }
    deactivateVariable(cellX, cellY) {
        const objects = this._world.objects;
        const movementOffset = this.movementOffset();
        let x = cellX * C.CellSizePixels + C.HalfCellSizePixels;
        let y = cellY * C.CellSizePixels + C.HalfCellSizePixels;
        if (this.moving(cellX, cellY)) {
            x += movementOffset.dx;
            y += movementOffset.dy;
        }
        const minX = x - C.DefinitionRadiusPixels;
        const minY = y - C.DefinitionRadiusPixels;
        const maxX = x + C.DefinitionRadiusPixels;
        const maxY = y + C.DefinitionRadiusPixels;
        const cells = this.cellRect(minX, minY, maxX, maxY);
        let count = 0;
        loop: for (let i = cells.left; i < cells.right; i++) {
            for (let j = cells.top; j < cells.bottom; j++) {
                if (objects[i][j] !== C.TypeDefinition)
                    continue;
                let definitionX = i * C.CellSizePixels + C.HalfCellSizePixels;
                let definitionY = j * C.CellSizePixels + C.HalfCellSizePixels;
                if (this.moving(i, j)) {
                    definitionX += movementOffset.dx;
                    definitionY += movementOffset.dy;
                }
                const dx = definitionX - x;
                const dy = definitionY - y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared > C.DefinitionRadiusSquaredPixels)
                    continue;
                count++;
                if (count > 1) {
                    break loop;
                }
            }
        }
        if (count === 2) {
            this.deactivate(cellX, cellY);
        }
    }
    fireLasers(x, y, mx, my, value, valueType, lasers) {
        const ports = this._world.objectPorts[x][y];
        if ((ports & C.PortOutEast) === C.PortOutEast)
            this.fireLaser(x, y, mx, my, 1, 0, value, valueType, lasers);
        if ((ports & C.PortOutSouth) === C.PortOutSouth)
            this.fireLaser(x, y, mx, my, 0, 1, value, valueType, lasers);
        if ((ports & C.PortOutWest) === C.PortOutWest)
            this.fireLaser(x, y, mx, my, -1, 0, value, valueType, lasers);
        if ((ports & C.PortOutNorth) === C.PortOutNorth)
            this.fireLaser(x, y, mx, my, 0, -1, value, valueType, lasers);
    }
    fireLaser(x, y, mx, my, dx, dy, value, valueType, lasers) {
        const objects = this._world.objects;
        const laserMoving = this.moving(x, y);
        const still = mx + my === 0;
        const parallel = !still && (dy + my === 0 || dx + mx === 0);
        const perpendicular = !still && !parallel;
        let endX = x + dx;
        let endY = y + dy;
        if (!perpendicular || this._movementFrame <= C.HalfMovementFrames) {
            while (C.TypeIsTransparent[objects[endX][endY]]) {
                endX += dx;
                endY += dy;
            }
        }
        else {
            if (laserMoving) {
                let nextX = endX + mx;
                let nextY = endY + my;
                let current = this.moving(endX, endY) && !C.TypeIsTransparent[objects[endX][endY]];
                let next = !this.moving(nextX, nextY) && !C.TypeIsTransparent[objects[nextX][nextY]];
                while (!current && !next) {
                    endX += dx;
                    endY += dy;
                    nextX = endX + mx;
                    nextY = endY + my;
                    current = this.moving(endX, endY) && !C.TypeIsTransparent[objects[endX][endY]];
                    next = !this.moving(nextX, nextY) && !C.TypeIsTransparent[objects[nextX][nextY]];
                }
            }
            else {
                let prevX = endX - mx;
                let prevY = endY - my;
                let prev = this.moving(prevX, prevY) && !C.TypeIsTransparent[objects[prevX][prevY]];
                let current = !this.moving(endX, endY) && !C.TypeIsTransparent[objects[endX][endY]];
                while (!prev && !current) {
                    endX += dx;
                    endY += dy;
                    prevX = endX - mx;
                    prevY = endY - my;
                    prev = this.moving(prevX, prevY) && !C.TypeIsTransparent[objects[prevX][prevY]];
                    current = !this.moving(endX, endY) && !C.TypeIsTransparent[objects[endX][endY]];
                }
            }
        }
        const targetMoving = this.moving(endX, endY);
        const movementOffset = this.movementOffset();
        let x0 = x * C.CellSizePixels + C.HalfCellSizePixels;
        let y0 = y * C.CellSizePixels + C.HalfCellSizePixels;
        let x1 = endX * C.CellSizePixels + C.HalfCellSizePixels;
        let y1 = endY * C.CellSizePixels + C.HalfCellSizePixels;
        if (laserMoving) {
            x0 += movementOffset.dx;
            y0 += movementOffset.dy;
        }
        if (laserMoving && perpendicular || parallel && targetMoving) {
            x1 += movementOffset.dx;
            y1 += movementOffset.dy;
        }
        lasers.push(new Laser(new Point(x, y), new Point(endX, endY), new Point(x0, y0), new Point(x1, y1), new Vector(dx, dy), value));
        // If the laser and target are not lined up
        if (perpendicular && laserMoving !== targetMoving)
            return;
        const targetType = objects[endX][endY];
        const values = this._world.objectValues;
        const targetValue = values[endX][endY];
        const ports = this._world.objectPorts[endX][endY];
        let input1 = false;
        if (dx === 1)
            input1 = (ports & C.PortMaskWest) === C.PortIn1West;
        else if (dy === 1)
            input1 = (ports & C.PortMaskNorth) === C.PortIn1North;
        else if (dx === -1)
            input1 = (ports & C.PortMaskEast) === C.PortIn1East;
        else if (dy === -1)
            input1 = (ports & C.PortMaskSouth) === C.PortIn1South;
        // Propagate values to variables
        if (targetType === C.TypeDefinition && input1) {
            const minX = x1 - C.DefinitionRadiusPixels;
            const minY = y1 - C.DefinitionRadiusPixels;
            const maxX = x1 + C.DefinitionRadiusPixels;
            const maxY = y1 + C.DefinitionRadiusPixels;
            const cells = this.cellRect(minX, minY, maxX, maxY);
            for (let i = cells.left; i < cells.right; i++) {
                for (let j = cells.top; j < cells.bottom; j++) {
                    // Only propagate to variables
                    if (objects[i][j] !== C.TypeVariable)
                        continue;
                    // Don't propagate to variables with different letters
                    if (values[i][j] !== targetValue)
                        continue;
                    // Don't propagate to inactive variables
                    if (this.inactive(i, j))
                        continue;
                    let variableX = i * C.CellSizePixels + C.HalfCellSizePixels;
                    let variableY = j * C.CellSizePixels + C.HalfCellSizePixels;
                    if (this.moving(i, j)) {
                        variableX += movementOffset.dx;
                        variableY += movementOffset.dy;
                    }
                    const dx = variableX - x1;
                    const dy = variableY - y1;
                    const distanceSquared = dx * dx + dy * dy;
                    // Don't propagate out of radius
                    if (distanceSquared > C.DefinitionRadiusSquaredPixels)
                        continue;
                    this.fireLasers(i, j, mx, my, value, valueType, lasers);
                }
            }
            return;
        }
        // if the operator cannot accept the value type, return
        let operatorType = 0;
        let expectedOperandType = 0;
        if (targetType === C.TypeUnaryOperator) {
            operatorType = C.StringToUnaryOperator[targetValue];
            expectedOperandType = C.UnaryOperatorInputType[operatorType];
        }
        else {
            operatorType = C.StringToBinaryOperator[targetValue];
            expectedOperandType = C.BinaryOperatorInputType[operatorType];
        }
        if (expectedOperandType !== C.OperandTypeAny && valueType !== expectedOperandType)
            return;
        // if the operator is unary and has input, fire and return
        if (targetType === C.TypeUnaryOperator && input1) {
            const valueTypeOut = C.UnaryOperatorOutputType[operatorType];
            const newValue = operatorType === C.UnaryOperatorNegation ? `0 ${value} -` : `${value} ${targetValue}`;
            this.fireLasers(endX, endY, mx, my, newValue, valueTypeOut, lasers);
            return;
        }
        let input2 = false;
        if (dx === 1)
            input2 = (ports & C.PortMaskWest) === C.PortIn2West;
        else if (dy === 1)
            input2 = (ports & C.PortMaskNorth) === C.PortIn2North;
        else if (dx === -1)
            input2 = (ports & C.PortMaskEast) === C.PortIn2East;
        else if (dy === -1)
            input2 = (ports & C.PortMaskSouth) === C.PortIn2South;
        // If there is no input port, return
        if (!input1 && !input2)
            return;
        // If the binary operator already has an input, fire, otherwise prime
        const oldValue = this._concatenatedValues[endX][endY];
        if (oldValue !== C.EmptyString) {
            const valueTypeOut = C.BinaryOperatorOutputType[operatorType];
            const newValue = input1 ? `${value} ${oldValue} ${targetValue}` : `${oldValue} ${value} ${targetValue}`;
            // Check for division by zero
            if (newValue.substring(newValue.length - 3) !== '0 /') {
                this.fireLasers(endX, endY, mx, my, newValue, valueTypeOut, lasers);
            }
            // Check for incompatible = operands?
        }
        else {
            this._concatenatedValues[endX][endY] = value;
        }
    }
    // TODO: Handle laser effects separately (gates, player)
    // When firing and overlap
    // If defined same, no problem, end loop
    // If defined different, mark for deletion as a bad variable and continue forward
    // Mark all succeeding unmarked cells for laser deletion
    // Upon encountering a cell already marked for deletion, terminate
    // Upon encountering a fresh cell (no concatenated value), terminate and mark preceding laser for deletion
    petrifyPlayer(lasers) {
        const objects = this._world.objects;
        for (const laser of lasers) {
            const x = laser.endCell.x;
            const y = laser.endCell.y;
            if (objects[x][y] === C.TypeArithmagician) {
                this._world.objects[x][y] = C.TypePetrified;
                // this._zapAudio.play()
            }
        }
    }
    unlockGates(lasers) {
        const objects = this._world.objects;
        for (const laser of lasers) {
            const x = laser.endCell.x;
            const y = laser.endCell.y;
            if (objects[x][y] === C.TypeGate) {
                const ports = this._world.objectPorts[x][y];
                const dx = laser.direction.dx;
                const dy = laser.direction.dy;
                let input1 = false;
                if (dx === 1)
                    input1 = (ports & C.PortMaskWest) === C.PortIn1West;
                else if (dy === 1)
                    input1 = (ports & C.PortMaskNorth) === C.PortIn1North;
                else if (dx === -1)
                    input1 = (ports & C.PortMaskEast) === C.PortIn1East;
                else if (dy === -1)
                    input1 = (ports & C.PortMaskSouth) === C.PortIn1South;
                if (input1 && this.evaluate(laser.value) === this.evaluate(this._world.objectValues[x][y])) {
                    this.unlock(x, y);
                }
            }
        }
    }
    consistentLasers(lasers) {
        return lasers;
    }
    evaluate(value) {
        const tokens = value.split(' ');
        const stack = new Array();
        for (const token of tokens) {
            switch (token) {
                case '+': {
                    const b = Rational.fromString(stack.pop());
                    const a = Rational.fromString(stack.pop());
                    stack.push(a.add(b).str());
                    break;
                }
                case '-': {
                    const b = Rational.fromString(stack.pop());
                    const a = Rational.fromString(stack.pop());
                    stack.push(a.sub(b).str());
                    break;
                }
                case '*': {
                    const b = Rational.fromString(stack.pop());
                    const a = Rational.fromString(stack.pop());
                    stack.push(a.mul(b).str());
                    break;
                }
                case '/': {
                    const b = Rational.fromString(stack.pop());
                    const a = Rational.fromString(stack.pop());
                    stack.push(a.div(b).str());
                    break;
                }
                case '=': {
                    const b = stack.pop();
                    const a = stack.pop();
                    const isBooleanA = a === 'true' || a === 'false';
                    const isBooleanB = b === 'true' || b === 'false';
                    if (isBooleanA !== isBooleanB) {
                        stack.push('false');
                    }
                    else if (isBooleanA) {
                        stack.push((a === b).toString());
                    }
                    else {
                        const rationalA = Rational.fromString(a);
                        const rationalB = Rational.fromString(b);
                        stack.push(rationalA.eq(rationalB).toString());
                    }
                    break;
                }
                case 'not': {
                    const a = stack.pop();
                    stack.push(a === 'true' ? 'false' : 'true');
                    break;
                }
                case 'and': {
                    const b = stack.pop() === 'true';
                    const a = stack.pop() === 'true';
                    stack.push((a && b).toString());
                    break;
                }
                case 'or': {
                    const b = stack.pop() === 'true';
                    const a = stack.pop() === 'true';
                    stack.push((a || b).toString());
                    break;
                }
                default:
                    stack.push(token);
                    break;
            }
        }
        return stack[0];
    }
    // ######   #######  #     #  ######   #######  ######   
    // #     #  #        ##    #  #     #  #        #     #  
    // #     #  #        # #   #  #     #  #        #     #  
    // ######   ####     #  #  #  #     #  ####     ######   
    // #   #    #        #   # #  #     #  #        #   #    
    // #    #   #        #    ##  #     #  #        #    #   
    // #     #  #######  #     #  ######   #######  #     #  
    setLaserVolume() {
        const movementOffset = this.movementOffset();
        const types = this._world.objects;
        const cellX = this._playerCell.x;
        const cellY = this._playerCell.y;
        let x = cellX * C.CellSizePixels;
        let y = cellY * C.CellSizePixels;
        if (this.moving(cellX, cellY)) {
            x += movementOffset.dx;
            y += movementOffset.dy;
        }
        let closest = Number.MAX_VALUE;
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldWidthCells; j++) {
                const type = types[i][j];
                if (type !== C.TypeConstant && type !== C.TypeVariable)
                    continue;
                let laserX = i * C.CellSizePixels;
                let laserY = j * C.CellSizePixels;
                if (this.moving(i, j)) {
                    laserX += movementOffset.dx;
                    laserY += movementOffset.dy;
                }
                const dx = laserX - x;
                const dy = laserY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closest) {
                    closest = distance;
                }
            }
        }
        const factor = C.CellSizePixels / closest;
        const targetVolume = factor * factor * 0.25;
        const volume = this._laserAudio.volume;
        this._laserAudio.volume = volume + (targetVolume - volume) * 0.05;
    }
    render() {
        this._fpsTracker.tick();
        const rect = Game.gameDisplayRect();
        this.positionCanvas(this._canvas, rect);
        this.positionCanvas(this._cutoutCanvas, rect);
        const renderOrigin = this._camera.renderOrigin();
        const renderCells = this.renderCells();
        const playerPosition = this.playerPosition();
        const lasers = this.lasers();
        this.petrifyPlayer(lasers);
        this.renderFloor(renderOrigin, renderCells);
        this.renderShadows(renderOrigin, renderCells);
        this.renderLasers(renderOrigin, lasers);
        this.renderObjects(renderOrigin, renderCells);
        this.renderDarkness(renderOrigin, renderCells);
        this.renderLaserImpacts(renderOrigin, lasers);
        this.renderRoof(renderOrigin, renderCells);
        this.renderDefinitions(renderOrigin);
        this.renderWand(renderOrigin);
        this.renderLight(renderOrigin, playerPosition);
        this.renderGrab(renderOrigin);
        this.renderMessage();
        this.renderFPS();
    }
    // includes a buffer for cells with effects such as shadows that might spill over onto the screen
    renderCells() {
        const renderOrigin = this._camera.renderOrigin();
        const x = Math.floor(renderOrigin.x / C.CellSizePixels) - 1;
        const y = Math.floor(renderOrigin.y / C.CellSizePixels) - 1;
        const w = C.DisplayWidthCells + 2;
        const h = C.DisplayHeightCells + 2;
        return new Rect(x, y, w, h);
    }
    positionCanvas(canvas, rect) {
        canvas.style.left = `${rect.left}px`;
        canvas.style.top = `${rect.top}px`;
        canvas.style.width = `${rect.w}px`;
        canvas.style.height = `${rect.h}px`;
    }
    renderGrab(renderOrigin) {
    }
    renderDarkness(renderOrigin, renderCells) {
        const darkness = this._darkness;
        this._context.fillStyle = 'black';
        for (let i = renderCells.x; i <= renderCells.right; i++) {
            for (let j = renderCells.y; j <= renderCells.bottom; j++) {
                if (i < 0 || j < 0 || i >= C.WorldWidthCells || j >= C.WorldHeightCells) {
                    continue;
                }
                let se = darkness[i + 1][j + 1];
                let sw = darkness[i][j + 1];
                let nw = darkness[i][j];
                let ne = darkness[i + 1][j];
                let degree = 0;
                if (se > degree)
                    degree = se;
                if (sw > degree)
                    degree = sw;
                if (nw > degree)
                    degree = nw;
                if (ne > degree)
                    degree = ne;
                if (degree < 2)
                    continue;
                const baseX = i * C.CellSizePixels - renderOrigin.x + C.HalfCellSizePixels;
                const baseY = j * C.CellSizePixels - renderOrigin.y + C.HalfCellSizePixels;
                if (degree > 2) {
                    this._context.fillRect(baseX, baseY, C.CellSizePixels, C.CellSizePixels);
                    continue;
                }
                se--;
                sw--;
                nw--;
                ne--;
                const offset = (se | (sw << 1) | (nw << 2) | (ne << 3)) * C.CellSizePixels;
                this._context.drawImage(I.Darkness, offset, 0, C.CellSizePixels, C.CellSizePixels, baseX, baseY, C.CellSizePixels, C.CellSizePixels);
            }
        }
    }
    renderDefinitions(renderOrigin) {
        const movementOffset = this.movementOffset();
        const types = this._world.objects;
        this._context.fillStyle = '#ffffff10';
        this._context.strokeStyle = '#ffffff30';
        this._context.lineWidth = 1;
        this._context.beginPath();
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                if (types[i][j] !== C.TypeDefinition)
                    continue;
                let x = i * C.CellSizePixels - renderOrigin.x + C.HalfCellSizePixels;
                let y = j * C.CellSizePixels - renderOrigin.y + C.HalfCellSizePixels;
                if (this.moving(i, j)) {
                    x += movementOffset.dx;
                    y += movementOffset.dy;
                }
                this._context.moveTo(x + C.DefinitionRadiusPixels, y);
                this._context.arc(x, y, C.DefinitionRadiusPixels, 0, C.Tau);
            }
        }
        this._context.fill();
        this._context.stroke();
    }
    renderShadows(renderOrigin, renderCells) {
        const types = this._world.objects;
        const connections = this._world.objectConnections;
        const ports = this._world.objectPorts;
        const movementOffset = this.movementOffset();
        this._cutoutContext.fillStyle = 'black';
        this._cutoutContext.globalCompositeOperation = 'source-over';
        this._cutoutContext.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
        this._cutoutContext.globalCompositeOperation = 'destination-out';
        for (let i = renderCells.x; i <= renderCells.right; i++) {
            for (let j = renderCells.y; j <= renderCells.bottom; j++) {
                if (i < 0 || j < 0 || i >= C.WorldWidthCells || j >= C.WorldHeightCells) {
                    continue;
                }
                const type = types[i][j];
                if (type === C.TypeEmpty || type === C.TypeOffLimits)
                    continue;
                let baseX = i * C.CellSizePixels - renderOrigin.x;
                let baseY = j * C.CellSizePixels - renderOrigin.y;
                if (this.moving(i, j)) {
                    baseX += movementOffset.dx;
                    baseY += movementOffset.dy;
                }
                const tileset = I.TypeToTileset.get(type);
                let offset = 0;
                // if (type === C.TypeDefinition) {
                //     console.log(C.TypeToTileset[type])
                // }
                switch (C.TypeToTileset[type]) {
                    case C.TilesetConnected:
                        offset = connections[i][j];
                        break;
                    case C.TilesetIO:
                        offset = ports[i][j];
                        break;
                    case C.TilesetEmitter:
                        offset = I.EmitterOffset.get(ports[i][j]);
                        break;
                    case C.TilesetReceiver:
                        offset = I.ReceiverOffset.get(ports[i][j]);
                        break;
                    case C.TilesetArithmagician:
                        offset = I.ArithmagicianOffset.get(ports[i][j]);
                        break;
                    case C.TilesetOrthogonal:
                        offset = I.OrthogonalOffset.get(ports[i][j]);
                        break;
                }
                for (let i = 1; i < 6; i++) {
                    this._cutoutContext.drawImage(tileset, offset * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, baseX + i, baseY + i, C.CellSizePixels, C.CellSizePixels);
                }
            }
        }
        this._cutoutContext.globalCompositeOperation = 'xor';
        this._cutoutContext.fillStyle = 'black';
        this._cutoutContext.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
        this._context.globalAlpha = 0.25;
        this._context.drawImage(this._cutoutCanvas, 0, 0);
        this._context.globalAlpha = 1;
    }
    renderWand(renderOrigin) {
        // if (this.playerPetrified())  return
        const movementOffset = this.movementOffset();
        let cx = this._playerCell.x * C.CellSizePixels - renderOrigin.x + movementOffset.dx;
        let cy = this._playerCell.y * C.CellSizePixels - renderOrigin.y + movementOffset.dy;
        switch (this.grabVector(this._world.objectPorts[this._playerCell.x][this._playerCell.y])) {
            case Vector.East:
                cx += C.WandXEast;
                cy += C.WandYEast;
                break;
            case Vector.South:
                cx += C.WandXSouth;
                cy += C.WandYSouth;
                break;
            case Vector.West:
                cx += C.WandXWest;
                cy += C.WandYWest;
                break;
            case Vector.North:
                cx += C.WandXNorth;
                cy += C.WandYNorth;
                break;
        }
        const innerRadius = 1 + Math.random() - 0.5;
        const outerRadius = 8 + 2 * Math.random() - 1;
        const x = Math.floor(cx - outerRadius);
        const y = Math.floor(cy - outerRadius);
        const size = Math.ceil(outerRadius * 2);
        const gradient = this._context.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.25, '#fc44');
        gradient.addColorStop(1, '#f800');
        this._context.fillStyle = gradient;
        this._context.globalCompositeOperation = 'lighter';
        this._context.fillRect(x, y, size, size);
        this._context.globalCompositeOperation = 'source-over';
        this._context.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
    }
    renderLight(renderOrigin, playerPosition) {
        const innerRadius = 30 + Math.random() * 2 - 1;
        const outerRadius = 260 + Math.random() * 2 - 1;
        const cx = playerPosition.x - renderOrigin.x + Math.random() * 2 - 1;
        const cy = playerPosition.y - renderOrigin.y + Math.random() * 2 - 1;
        const gradient = this._context.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        gradient.addColorStop(0, '#f802');
        gradient.addColorStop(0.6, '#0024');
        gradient.addColorStop(1, '#002c');
        this._context.fillStyle = gradient;
        this._context.globalCompositeOperation = 'hue';
        this._context.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
        this._context.globalCompositeOperation = 'source-over';
        this._context.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
    }
    renderFloor(renderOrigin, renderCells) {
        const types = this._world.floor;
        const connections = this._world.floorConnections;
        for (let i = renderCells.x; i <= renderCells.right; i++) {
            for (let j = renderCells.y; j <= renderCells.bottom; j++) {
                if (i < 0 || j < 0 || i >= C.WorldWidthCells || j >= C.WorldHeightCells) {
                    continue;
                }
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                const x = i * C.CellSizePixels - renderOrigin.x;
                const y = j * C.CellSizePixels - renderOrigin.y;
                const tileset = I.TypeToTileset.get(type);
                switch (C.TypeToTileset[type]) {
                    case C.TilesetConnected: {
                        this._context.drawImage(tileset, connections[i][j] * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, x, y, C.CellSizePixels, C.CellSizePixels);
                        break;
                    }
                    case C.TilesetBlock: {
                        this._context.drawImage(tileset, x, y, C.CellSizePixels, C.CellSizePixels);
                        break;
                    }
                }
            }
        }
    }
    renderLasers(renderOrigin, lasers) {
        const start = (performance.now() * 5 % 500) / 10;
        const path = new Path2D();
        for (const laser of lasers) {
            let x0 = laser.startPixel.x - renderOrigin.x;
            let y0 = laser.startPixel.y - renderOrigin.y;
            let x1 = laser.endPixel.x - renderOrigin.x;
            let y1 = laser.endPixel.y - renderOrigin.y;
            const dx = x1 - x0;
            const dy = y1 - y0;
            const signX = Math.sign(dx);
            const signY = Math.sign(dy);
            const length = Math.abs(dx + dy);
            for (let i = start; i < length; i += 50) {
                const x = x0 + i * signX + Math.random() * 2 - 1;
                const y = y0 + i * signY + Math.random() * 2 - 1;
                path.moveTo(x, y);
                path.arc(x, y, Math.random(), 0, C.Tau);
            }
            path.moveTo(x0, y0);
            path.lineTo(x1, y1);
        }
        const scalar = (Math.sin(performance.now() / 1000 * C.Tau) + 1) / 2;
        this._context.globalCompositeOperation = 'lighter';
        this._context.lineWidth = 4 + 2 * scalar;
        this._context.strokeStyle = '#f004';
        this._context.stroke(path);
        this._context.lineWidth = 2 + 1 * scalar;
        this._context.strokeStyle = '#f808';
        this._context.stroke(path);
        this._context.lineWidth = 1 * scalar;
        this._context.strokeStyle = '#fff';
        this._context.stroke(path);
        this._context.globalCompositeOperation = 'source-over';
        // pulses in the direction of fire
    }
    renderLaserImpacts(renderOrigin, lasers) {
        const scalar = (Math.sin(performance.now() / 1000 * C.Tau) + 1) / 2;
        for (const laser of lasers) {
            let x0 = laser.startPixel.x - renderOrigin.x;
            let y0 = laser.startPixel.y - renderOrigin.y;
            let x1 = laser.endPixel.x - renderOrigin.x;
            let y1 = laser.endPixel.y - renderOrigin.y;
            const dx = x1 - x0;
            const dy = y1 - y0;
            const signX = Math.sign(dx);
            const signY = Math.sign(dy);
            const x = x1 - signX * C.HalfCellSizePixels;
            const y = y1 - signY * C.HalfCellSizePixels;
            const radius = 8 + Math.random() * 4 * scalar;
            const gradient = this._context.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, "#fff");
            gradient.addColorStop(0.5, "#f808");
            gradient.addColorStop(1, "#f000");
            this._context.fillStyle = gradient;
            this._context.globalCompositeOperation = 'lighter';
            this._context.fillRect(x - 12, y - 12, 24, 24);
            this._context.globalCompositeOperation = 'source-over';
        }
    }
    renderObjects(renderOrigin, renderCells) {
        // Limit renders to visible
        this._context.globalCompositeOperation = 'source-over';
        const types = this._world.objects;
        const connections = this._world.objectConnections;
        const ports = this._world.objectPorts;
        const values = this._world.objectValues;
        const movementOffset = this.movementOffset();
        for (let i = renderCells.x; i <= renderCells.right; i++) {
            for (let j = renderCells.y; j <= renderCells.bottom; j++) {
                if (i < 0 || j < 0 || i >= C.WorldWidthCells || j >= C.WorldHeightCells) {
                    continue;
                }
                const type = types[i][j];
                if (type === C.TypeEmpty || type === C.TypeOffLimits)
                    continue;
                let baseX = i * C.CellSizePixels - renderOrigin.x;
                let baseY = j * C.CellSizePixels - renderOrigin.y;
                if (this.moving(i, j)) {
                    baseX += movementOffset.dx;
                    baseY += movementOffset.dy;
                }
                const tileset = I.TypeToTileset.get(type);
                let offset = 0;
                switch (C.TypeToTileset[type]) {
                    case C.TilesetConnected: {
                        offset = connections[i][j];
                        break;
                    }
                    case C.TilesetIO:
                        offset = ports[i][j];
                        break;
                    case C.TilesetEmitter:
                        offset = I.EmitterOffset.get(ports[i][j]);
                        break;
                    case C.TilesetReceiver:
                        offset = I.ReceiverOffset.get(ports[i][j]);
                        break;
                    case C.TilesetArithmagician:
                        offset = I.ArithmagicianOffset.get(ports[i][j]);
                        break;
                    case C.TilesetOrthogonal:
                        offset = I.OrthogonalOffset.get(ports[i][j]);
                        break;
                }
                this._context.drawImage(tileset, offset * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, baseX, baseY, C.CellSizePixels, C.CellSizePixels);
                const value = values[i][j];
                if (value === C.EmptyString)
                    continue;
                const valueType = D.stringToValueType(type, value);
                if (value.length === 1) {
                    const charCode = value.charCodeAt(0);
                    const srcX = C.FontWidth * charCode;
                    const dstX = baseX + C.CellSingleX;
                    const dstY = baseY + C.CellIntegerY;
                    this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, C.FontWidth, C.FontHeight);
                    continue;
                }
                switch (valueType) {
                    case C.ValueUnaryOperator:
                    case C.ValueBinaryOperator:
                    case C.ValueBoolean: {
                        const length = value.length;
                        const startX = (C.CellSizePixels - C.FontWidth * length) / 2;
                        for (let i = 0; i < length; i++) {
                            const charCode = value.charCodeAt(i);
                            const srcX = C.FontWidth * charCode;
                            const dstX = baseX + startX + C.FontWidth * i;
                            const dstY = baseY + C.CellIntegerY;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, C.FontWidth, C.FontHeight);
                        }
                        break;
                    }
                    case C.ValueInteger: {
                        const negative = value[0] === '-';
                        const absoluteValue = negative ? value.substring(1) : value;
                        const width = absoluteValue.length;
                        const dstY = baseY + C.CellIntegerY;
                        if (width === 1) {
                            const srcX = C.FontWidth * absoluteValue.charCodeAt(0);
                            const dstX = baseX + C.CellSingleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, C.FontWidth, C.FontHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * absoluteValue.charCodeAt(0);
                            const srcX2 = C.FontWidth * absoluteValue.charCodeAt(1);
                            const dstX1 = baseX + C.CellDoubleX1;
                            const dstX2 = baseX + C.CellDoubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, dstY, C.FontWidth, C.FontHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, dstY, C.FontWidth, C.FontHeight);
                        }
                        if (negative) {
                            const dstX = baseX + (width === 1 ? C.CellMinusXSingle : C.CellMinusXDouble);
                            const dstY = baseY + C.CellFractionY;
                            this._context.drawImage(I.MinusSign, dstX, dstY, C.MinusWidth, C.FractionHeight);
                        }
                        break;
                    }
                    case C.ValueRational: {
                        const fractionIndex = value.indexOf('/');
                        const negative = value[0] === '-';
                        const numerator = negative ? value.substring(1, fractionIndex) : value.substring(0, fractionIndex);
                        const denominator = value.substring(fractionIndex + 1);
                        const width = Math.max(numerator.length, denominator.length);
                        const numY = baseY + C.CellNumeratorY;
                        const denY = baseY + C.CellDenominatorY;
                        if (width === 1) {
                            const dstX = baseX + C.CellSingleX;
                            const dstY = baseY + C.CellFractionY;
                            this._context.drawImage(I.Fraction1, dstX, dstY, C.Fraction1Width, C.FractionHeight);
                        }
                        else {
                            const dstX = baseX + C.CellDoubleX1;
                            const dstY = baseY + C.CellFractionY;
                            this._context.drawImage(I.Fraction2, dstX, dstY, C.Fraction2Width, C.FractionHeight);
                        }
                        if (numerator.length === 1) {
                            const srcX = C.FontWidth * numerator.charCodeAt(0);
                            const dstX = baseX + C.CellSingleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, numY, C.FontWidth, C.FontHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * numerator.charCodeAt(0);
                            const srcX2 = C.FontWidth * numerator.charCodeAt(1);
                            const dstX1 = baseX + C.CellDoubleX1;
                            const dstX2 = baseX + C.CellDoubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, numY, C.FontWidth, C.FontHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, numY, C.FontWidth, C.FontHeight);
                        }
                        if (denominator.length === 1) {
                            const srcX = C.FontWidth * denominator.charCodeAt(0);
                            const dstX = baseX + C.CellSingleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, denY, C.FontWidth, C.FontHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * denominator.charCodeAt(0);
                            const srcX2 = C.FontWidth * denominator.charCodeAt(1);
                            const dstX1 = baseX + C.CellDoubleX1;
                            const dstX2 = baseX + C.CellDoubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, denY, C.FontWidth, C.FontHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, denY, C.FontWidth, C.FontHeight);
                        }
                        if (negative) {
                            const dstX = baseX + (width === 1 ? C.CellMinusXSingle : C.CellMinusXDouble);
                            const dstY = baseY + C.CellFractionY;
                            this._context.drawImage(I.MinusSign, dstX, dstY, C.MinusWidth, C.FractionHeight);
                        }
                        break;
                    }
                }
            }
        }
    }
    renderRoof(renderOrigin, renderCells) {
        const types = this._world.roof;
        const connections = this._world.roofConnections;
        const movementOffset = this.movementOffset();
        for (let i = renderCells.x; i <= renderCells.right; i++) {
            for (let j = renderCells.y; j <= renderCells.bottom; j++) {
                if (i < 0 || j < 0 || i >= C.WorldWidthCells || j >= C.WorldHeightCells) {
                    continue;
                }
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                let baseX = i * C.CellSizePixels - renderOrigin.x;
                let baseY = j * C.CellSizePixels - renderOrigin.y;
                if (this.moving(i, j)) {
                    baseX += movementOffset.dx;
                    baseY += movementOffset.dy;
                }
                const tileset = I.TypeToTileset.get(type);
                switch (C.TypeToTileset[type]) {
                    case C.TilesetConnected: {
                        this._context.drawImage(tileset, connections[i][j] * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, baseX, baseY, C.CellSizePixels, C.CellSizePixels);
                        break;
                    }
                    case C.TilesetBlock: {
                        this._context.drawImage(tileset, baseX, baseY, C.CellSizePixels, C.CellSizePixels);
                        break;
                    }
                }
            }
        }
    }
    renderMessage() {
        if (!this._reading)
            return;
        this._context.globalCompositeOperation = 'source-over';
        this._context.fillStyle = '#000c';
        this._context.fillRect(0, 0, C.DisplayWidthPixels, C.DisplayHeightPixels);
        const grabCell = this.grabCell();
        const message = this._world.objectValues[grabCell.x][grabCell.y];
        const lines = this.messageLines(message);
        const w = lines.reduce((a, b) => a.length > b.length ? a : b).length;
        const h = lines.length;
        const displayW = w * C.FontWidth;
        const displayH = h * C.FontHeight;
        const originX = Math.floor((C.DisplayWidthPixels - displayW) / 2);
        const originY = Math.floor((C.DisplayHeightPixels - displayH) / 2);
        for (let j = 0; j < h; j++) {
            const y = originY + j * C.FontHeight;
            for (let i = 0; i < w; i++) {
                const x = originX + i * C.FontWidth;
                const charCode = lines[j].charCodeAt(i);
                const offset = charCode * C.FontWidth;
                this._context.drawImage(I.Font, offset, 0, C.FontWidth, C.FontHeight, x, y, C.FontWidth, C.FontHeight);
            }
        }
    }
    messageLines(message) {
        let lineIndex = 0;
        let spaceIndex = 0;
        const lines = new Array;
        for (let i = 0; i < message.length; i++) {
            if (message[i] === C.CharSpace) {
                spaceIndex = i;
            }
            if (i - lineIndex > C.MaxMessageWidth) {
                lines.push(message.substring(lineIndex, spaceIndex));
                lineIndex = spaceIndex + 1;
            }
        }
        const lastLine = message.substring(lineIndex).trim();
        if (lastLine !== C.EmptyString) {
            lines.push(lastLine);
        }
        return lines;
    }
    renderFPS() {
        const fps = this._fpsTracker.fps;
        const fpsString = fps.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        this._context.font = '20px sans-serif';
        this._context.fillStyle = '#ffffff20';
        this._context.fillText(`FPS: ${fpsString}`, 10, 30);
    }
    static horizontalDisplay() {
        return window.innerWidth * C.DisplayHeightCells > window.innerHeight * C.DisplayWidthCells;
    }
    static cellDisplaySize() {
        if (Game.horizontalDisplay()) {
            return Math.floor(window.innerHeight / C.DisplayHeightCells);
        }
        return Math.floor(window.innerWidth / C.DisplayWidthCells);
    }
    static gameDisplayRect() {
        const size = Game.cellDisplaySize();
        const w = size * C.DisplayWidthCells;
        const h = size * C.DisplayHeightCells;
        const x = Math.floor((window.innerWidth - w) / 2);
        const y = Math.floor((window.innerHeight - h) / 2);
        return new Rect(x, y, w, h);
    }
}

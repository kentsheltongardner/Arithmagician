import Point from './point.js';
import World from './world.js';
import Rect from './rect.js';
import Size from './size.js';
import Memory from './memory.js';
import * as I from './images.js';
import * as C from './constants.js';
import * as D from './data.js';
import { Copier } from './copier.js';
import Compressor from './compressor.js';
export default class Editor {
    _scale = C.CellSizePixels;
    _modifierKey = C.ModifierKeyNone;
    _mouseButton = C.MouseButtonNone;
    _focus = new Point(C.WorldWidthCells / 2, C.WorldHeightCells / 2);
    _mousePoint = new Point(0, 0);
    _gamePoint = new Point(0, 0);
    _inspectCell = new Point(C.WorldWidthCells / 2, C.WorldHeightCells / 2);
    _selectPoint = new Point(0, 0);
    _selection = new Array(C.WorldWidthCells);
    _selectionConnections = new Array(C.WorldWidthCells);
    _world = new World();
    _copier = new Copier();
    _memory = new Memory();
    _broadcastChannel = new BroadcastChannel('arithmagician');
    _canvas;
    _context;
    _valueInput;
    _portInput;
    _toolSelect;
    _layerSelect;
    _buildIcons;
    _buildGrids;
    constructor() {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            this._selection[i] = new Uint8Array(C.WorldHeightCells);
            this._selectionConnections[i] = new Uint8Array(C.WorldHeightCells);
        }
        this._canvas = document.getElementById('editor-canvas');
        this._context = this._canvas.getContext('2d');
        this._valueInput = document.getElementById('value-input');
        this._portInput = document.getElementById('port-input');
        this._toolSelect = document.getElementById('tool-select');
        this._layerSelect = document.getElementById('layer-select');
        this._buildIcons = document.querySelectorAll('.build-icon');
        this._buildGrids = document.getElementsByClassName('build-grid');
        window.addEventListener('keydown', e => this.keyDown(e));
        window.addEventListener('keyup', e => this.keyUp(e));
        window.addEventListener('cut', e => { this.cut(e); });
        window.addEventListener('copy', e => { this.copy(e); });
        window.addEventListener('paste', e => { this.paste(e); });
        window.addEventListener('contextmenu', e => this.contextMenu(e));
        this._canvas.addEventListener('mousedown', e => this.mouseDown(e));
        this._canvas.addEventListener('mousemove', e => this.mouseMove(e));
        this._canvas.addEventListener('mouseup', e => this.mouseUp(e));
        this._canvas.addEventListener('wheel', e => this.mouseWheel(e));
        this._canvas.addEventListener('mouseleave', () => this.mouseLeave());
        this._layerSelect.addEventListener('change', () => { this.layerSelected(); });
        this._valueInput.addEventListener('input', () => { this.valueInputReceived(); });
        this._valueInput.addEventListener('change', () => { this.valueInputChanged(); });
        this._valueInput.addEventListener('focusout', () => { this.valueInputFocusOut(); });
        this._portInput.addEventListener('input', () => { this.portInputReceived(); });
        this._portInput.addEventListener('change', () => { this.portInputChanged(); });
        this._portInput.addEventListener('focusout', () => { this.portInputFocusOut(); });
        this._valueInput.addEventListener('paste', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const copyString = await navigator.clipboard.readText();
            this._valueInput.value = copyString;
        });
        const loadButton = document.getElementById('load-button');
        const saveButton = document.getElementById('save-button');
        const testButton = document.getElementById('test-button');
        loadButton.addEventListener('click', () => { this.load(); });
        saveButton.addEventListener('click', () => { this.save(); });
        testButton.addEventListener('click', () => { this.test(); });
        for (const buildIcon of this._buildIcons) {
            buildIcon.addEventListener('click', () => { this.buildIconSelected(buildIcon); });
        }
        this.loop();
    }
    // #     #  #######  
    // #     #     #     
    // #     #     #     
    // #     #     #     
    // #     #     #     
    // #     #     #     
    //  #####   #######  
    tool() {
        return C.StringToTool[this._toolSelect.value];
    }
    layer() {
        return C.StringToLayer[this._layerSelect.value];
    }
    activeBuildGrid() {
        return document.querySelector('.build-grid.active');
    }
    type() {
        const activeBuildGrid = this.activeBuildGrid();
        const selectedBuildIcon = activeBuildGrid.querySelector('.build-icon.selected');
        const buildType = selectedBuildIcon.dataset.type;
        return C.StringToType[buildType];
    }
    buildIconSelected(selectedBuildIcon) {
        const activeBuildGrid = this.activeBuildGrid();
        const activeBuildIcons = activeBuildGrid.querySelectorAll('.build-icon');
        for (const activeBuildIcon of activeBuildIcons) {
            activeBuildIcon.classList.remove('selected');
        }
        selectedBuildIcon.classList.add('selected');
    }
    layerSelected() {
        const selectedIndex = this._layerSelect.selectedIndex;
        const selectedOption = this._layerSelect.options[selectedIndex];
        const gridId = selectedOption.dataset.grid;
        const grid = document.getElementById(gridId);
        for (const buildGrid of this._buildGrids) {
            buildGrid.classList.remove('active');
        }
        grid.classList.add('active');
    }
    isLayerHidden(layer) {
        const layerString = C.LayerToString[layer];
        const selector = `.hide-checkbox[data-layer=${layerString}]`;
        const checkbox = document.querySelector(selector);
        return checkbox.checked;
    }
    isLayerHighlighted(layer) {
        const layerString = C.LayerToString[layer];
        const selector = `.highlight-checkbox[data-layer=${layerString}]`;
        const checkbox = document.querySelector(selector);
        return checkbox.checked;
    }
    isLayerLocked(layer) {
        const layerString = C.LayerToString[layer];
        const selector = `.lock-checkbox[data-layer=${layerString}]`;
        const checkbox = document.querySelector(selector);
        return checkbox.checked;
    }
    // #     #   #####   #     #   #####   #######  
    // ##   ##  #     #  #     #  #     #  #        
    // # # # #  #     #  #     #  #        #        
    // #  #  #  #     #  #     #   #####   ####     
    // #     #  #     #  #     #        #  #        
    // #     #  #     #  #     #  #     #  #        
    // #     #   #####    #####    #####   #######  
    action() {
        switch (this._modifierKey) {
            case C.ModifierKeyCtrl:
                if (this._mouseButton === C.MouseButtonLeft) {
                    return C.ActionInspect;
                }
                break;
            case C.ModifierKeySpace:
                if (this._mouseButton === C.MouseButtonLeft) {
                    return C.ActionPan;
                }
                break;
        }
        const tool = this.tool();
        switch (tool) {
            case C.ToolBuild:
                switch (this._mouseButton) {
                    case C.MouseButtonLeft:
                        return C.ActionBuild;
                    case C.MouseButtonRight:
                        return C.ActionErase;
                }
                break;
            case C.ToolConnect:
                switch (this._mouseButton) {
                    case C.MouseButtonLeft:
                        return C.ActionConnect;
                    case C.MouseButtonRight:
                        return C.ActionDisconnect;
                }
                break;
            case C.ToolSelect:
                if (this._modifierKey === C.ModifierKeyShift) {
                    if (this._mouseButton === C.MouseButtonLeft) {
                        return C.ActionDragSelect;
                    }
                    else if (this._mouseButton === C.MouseButtonRight) {
                        return C.ActionDragUnselect;
                    }
                }
                else {
                    if (this._mouseButton === C.MouseButtonLeft) {
                        return C.ActionSelect;
                    }
                    else if (this._mouseButton === C.MouseButtonRight) {
                        return C.ActionUnselect;
                    }
                }
                break;
        }
        return C.ActionNone;
    }
    mouseDown(e) {
        if (this._mouseButton === C.MouseButtonNone) {
            if (e.button === 0) {
                this._mouseButton = C.MouseButtonLeft;
            }
            else if (e.button === 2) {
                this._mouseButton = C.MouseButtonRight;
            }
        }
        switch (this.action()) {
            case C.ActionBuild:
                this.build(this.type(), this.cellPoint(this._gamePoint), this.layer());
                this._memory.endChanges();
                this.moveInspector();
                this.inspect();
                break;
            case C.ActionErase:
                this.erase(this.cellPoint(this._gamePoint), this.layer());
                this._memory.endChanges();
                break;
            case C.ActionConnect:
                this.connect();
                this._memory.endChanges();
                break;
            case C.ActionDisconnect:
                this.disconnect();
                this._memory.endChanges();
                break;
            case C.ActionSelect:
                this.select();
                this._memory.endChanges();
                break;
            case C.ActionUnselect:
                this.unselect();
                this._memory.endChanges();
                break;
            case C.ActionDragSelect:
                this.beginDragSelect();
                break;
            case C.ActionDragUnselect:
                this.beginDragUnselect();
                break;
            case C.ActionInspect:
                this.moveInspector();
                this.inspect();
                break;
            case C.ActionPan:
                break;
        }
    }
    mouseMove(e) {
        const oldPoint = this.gamePoint(this._mousePoint);
        this._mousePoint = new Point(e.offsetX, e.offsetY);
        this._gamePoint = this.gamePoint(this._mousePoint);
        const oldCell = this.cellPoint(oldPoint);
        const newCell = this.cellPoint(this._gamePoint);
        const crossing = !oldCell.equals(newCell);
        const action = this.action();
        if (crossing) {
            switch (action) {
                case C.ActionBuild:
                    this.build(this.type(), this.cellPoint(this._gamePoint), this.layer());
                    this._memory.endChanges();
                    this.moveInspector();
                    this.inspect();
                    break;
                case C.ActionErase:
                    const cellPoint = this.cellPoint(this._gamePoint);
                    this.erase(cellPoint, this.layer());
                    this._memory.endChanges();
                    break;
                case C.ActionConnect:
                    this.connect();
                    this._memory.endChanges();
                    break;
                case C.ActionDisconnect:
                    this.disconnect();
                    this._memory.endChanges();
                    break;
                case C.ActionSelect:
                    this.select();
                    this._memory.endChanges();
                    break;
                case C.ActionUnselect:
                    this.unselect();
                    this._memory.endChanges();
                    break;
                case C.ActionPan:
                    this.pan(oldPoint, this._gamePoint);
                    break;
            }
        }
        else if (action === C.ActionPan) {
            this.pan(oldPoint, this._gamePoint);
        }
    }
    mouseUp(e) {
        const oldAction = this.action();
        if (e.button === 0 && this._mouseButton === C.MouseButtonLeft
            || e.button === 2 && this._mouseButton === C.MouseButtonRight) {
            this._mouseButton = C.MouseButtonNone;
        }
        switch (oldAction) {
            case C.ActionDragSelect:
                if (this._mouseButton === C.MouseButtonNone) {
                    this.dragSelect();
                }
                break;
            case C.ActionDragUnselect:
                if (this._mouseButton === C.MouseButtonNone) {
                    this.dragUnselect();
                }
                break;
        }
    }
    mouseLeave() {
        this._mouseButton = C.MouseButtonNone;
    }
    mouseWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        const direction = Math.sign(e.deltaY);
        if (direction === 1) {
            this.zoom(1 / C.ZoomFactor, C.ZoomFactor);
        }
        else {
            this.zoom(C.ZoomFactor, 1 / C.ZoomFactor);
        }
    }
    zoom(scalar, inverse) {
        this._scale *= scalar;
        this._focus.x = this._gamePoint.x - inverse * (this._gamePoint.x - this._focus.x);
        this._focus.y = this._gamePoint.y - inverse * (this._gamePoint.y - this._focus.y);
    }
    pan(oldPoint, newPoint) {
        const dragVector = oldPoint.differenceVector(newPoint);
        this._focus = this._focus.addVector(dragVector);
    }
    contextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    // #     #  #######  #     #   #####   
    // #    #   #         #   #   #     #  
    // #   #    #          # #    #        
    // ####     ####        #      #####   
    // #   #    #           #           #  
    // #    #   #           #     #     #  
    // #     #  #######     #      #####   
    keyDown(e) {
        // if (e.repeat) return
        switch (e.code) {
            case 'KeyZ': {
                if (e.ctrlKey) {
                    this._memory.undoChanges();
                    this.inspect();
                }
                break;
            }
            case 'KeyY': {
                if (e.ctrlKey) {
                    this._memory.redoChanges();
                    this.inspect();
                }
                break;
            }
            case 'KeyS': {
                if (e.ctrlKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.save();
                }
                break;
            }
        }
        if (this._modifierKey === C.ModifierKeyNone) {
            switch (e.code) {
                case 'ControlLeft':
                    this._modifierKey = C.ModifierKeyCtrl;
                    break;
                case 'ShiftLeft':
                    this._modifierKey = C.ModifierKeyShift;
                    break;
                case 'Space':
                    this._modifierKey = C.ModifierKeySpace;
                    break;
            }
        }
        if (this._modifierKey === C.ModifierKeyCtrl)
            return;
        if (e.code === 'Escape') {
            this._valueInput.blur();
            this._portInput.blur();
        }
        if (document.activeElement?.nodeName === 'INPUT')
            return;
        switch (e.code) {
            case 'KeyB': {
                this._toolSelect.value = C.ToolToString[C.ToolBuild];
                this._toolSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyC': {
                this._toolSelect.value = C.ToolToString[C.ToolConnect];
                this._toolSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyS': {
                this._toolSelect.value = C.ToolToString[C.ToolSelect];
                this._toolSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyF': {
                this._layerSelect.value = C.LayerToString[C.LayerFloor];
                this._layerSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyO': {
                this._layerSelect.value = C.LayerToString[C.LayerObject];
                this._layerSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyR': {
                this._layerSelect.value = C.LayerToString[C.LayerRoof];
                this._layerSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'KeyA': {
                this._layerSelect.value = C.LayerToString[C.LayerCamera];
                this._layerSelect.dispatchEvent(new Event('change'));
                break;
            }
            case 'Delete': {
                if (this.tool() === C.ToolSelect) {
                    this.eraseSelectedCells();
                    this._memory.endChanges();
                    this.clearSelection();
                    this.inspect();
                }
                break;
            }
        }
    }
    keyUp(e) {
        if (e.code === 'ControlLeft' && this._modifierKey === C.ModifierKeyCtrl
            || e.code === 'ShiftLeft' && this._modifierKey === C.ModifierKeyShift
            || e.code === 'Space' && this._modifierKey === C.ModifierKeySpace) {
            this._modifierKey = C.ModifierKeyNone;
        }
    }
    // ######   #     #  #######  #        ######   
    // #     #  #     #     #     #        #     #  
    // #     #  #     #     #     #        #     #  
    // ######   #     #     #     #        #     #  
    // #     #  #     #     #     #        #     #  
    // #     #  #     #     #     #        #     #  
    // ######    #####   #######  #######  ######   
    build(type, point, layer) {
        if (!C.InnerWorldRectCells.contains(point))
            return;
        const x = point.x;
        const y = point.y;
        switch (layer) {
            case C.LayerFloor: {
                this.buildCell(type, x, y, this._world.floor, this._world.floorConnections);
                break;
            }
            case C.LayerObject: {
                const values = this._world.objectValues;
                const ports = this._world.objectPorts;
                this._memory.remember(values, x, y);
                this._memory.remember(ports, x, y);
                values[x][y] = C.EmptyString;
                ports[x][y] = 0b00000000;
                switch (type) {
                    case C.TypeUnaryOperator: {
                        ports[x][y] = 0b01001100;
                        values[x][y] = C.UnaryOperatorToString[C.UnaryOperatorNot];
                        break;
                    }
                    case C.TypeBinaryOperator: {
                        ports[x][y] = 0b00100111;
                        values[x][y] = C.BinaryOperatorToString[C.BinaryOperatorAddition];
                        break;
                    }
                    case C.TypeGate: {
                        values[x][y] = '-19/3';
                        break;
                    }
                    case C.TypeVariable: {
                        ports[x][y] = 0b00001111;
                        values[x][y] = 'a';
                        break;
                    }
                    case C.TypeConstant: {
                        values[x][y] = '-19/3';
                        break;
                    }
                    case C.TypeDefinition: {
                        ports[x][y] = 0b00000001;
                        values[x][y] = 'a';
                        break;
                    }
                    case C.TypeArithmagician: {
                        for (let i = 0; i < C.WorldWidthCells; i++) {
                            for (let j = 0; j < C.WorldWidthCells; j++) {
                                if (this._world.objects[i][j] === C.TypeArithmagician) {
                                    this.erase(new Point(i, j), C.LayerObject);
                                }
                            }
                        }
                        ports[x][y] = 0b00001100;
                        break;
                    }
                }
                this.buildCell(type, x, y, this._world.objects, this._world.objectConnections);
                break;
            }
            case C.LayerRoof: {
                this.buildCell(type, x, y, this._world.roof, this._world.roofConnections);
                break;
            }
            case C.LayerCamera: {
                this._memory.remember(this._world.camera, x, y);
                this._world.camera[x][y] = type;
                break;
            }
        }
    }
    buildCell(type, x, y, types, connections) {
        if (types[x][y] !== type)
            this.eraseCell(x, y, types, connections);
        this._memory.remember(types, x, y);
        types[x][y] = type;
        switch (C.TypeToTileset[type]) {
            case C.TilesetConnected:
                this.connectNewCell(x, y, types, connections);
                break;
        }
    }
    connectNewCell(x, y, types, connections) {
        const type = types[x][y];
        const e = x + 1;
        const s = y + 1;
        const w = x - 1;
        const n = y - 1;
        this._memory.remember(connections, x, y);
        this._memory.remember(connections, e, y);
        this._memory.remember(connections, e, s);
        this._memory.remember(connections, x, s);
        this._memory.remember(connections, w, s);
        this._memory.remember(connections, w, y);
        this._memory.remember(connections, w, n);
        this._memory.remember(connections, x, n);
        this._memory.remember(connections, e, n);
        if (types[e][y] === type) {
            connections[x][y] |= C.BitsEast;
            connections[e][y] |= C.BitsWest;
        }
        if (types[x][s] === type) {
            connections[x][y] |= C.BitsSouth;
            connections[x][s] |= C.BitsNorth;
        }
        if (types[w][y] === type) {
            connections[x][y] |= C.BitsWest;
            connections[w][y] |= C.BitsEast;
        }
        if (types[x][n] === type) {
            connections[x][y] |= C.BitsNorth;
            connections[x][n] |= C.BitsSouth;
        }
        if (types[e][y] === type
            && types[e][s] === type
            && types[x][s] === type
            && (connections[e][y] & C.BitsSouth) === C.BitsSouth
            && (connections[x][s] & C.BitsEast) === C.BitsEast) {
            connections[x][y] |= C.BitsSoutheast;
            connections[e][y] |= C.BitsSouthwest;
            connections[x][s] |= C.BitsNortheast;
            connections[e][s] |= C.BitsNorthwest;
        }
        if (types[w][y] === type
            && types[w][s] === type
            && types[x][s] === type
            && (connections[w][y] & C.BitsSouth) === C.BitsSouth
            && (connections[x][s] & C.BitsWest) === C.BitsWest) {
            connections[x][y] |= C.BitsSouthwest;
            connections[w][y] |= C.BitsSoutheast;
            connections[x][s] |= C.BitsNorthwest;
            connections[w][s] |= C.BitsNortheast;
        }
        if (types[w][y] === type
            && types[w][n] === type
            && types[x][n] === type
            && (connections[w][y] & C.BitsNorth) === C.BitsNorth
            && (connections[x][n] & C.BitsWest) === C.BitsWest) {
            connections[x][y] |= C.BitsNorthwest;
            connections[w][y] |= C.BitsNortheast;
            connections[x][n] |= C.BitsSouthwest;
            connections[w][n] |= C.BitsSoutheast;
        }
        if (types[e][y] === type
            && types[e][n] === type
            && types[x][n] === type
            && (connections[e][y] & C.BitsNorth) === C.BitsNorth
            && (connections[x][n] & C.BitsEast) === C.BitsEast) {
            connections[x][y] |= C.BitsNortheast;
            connections[e][y] |= C.BitsNorthwest;
            connections[x][n] |= C.BitsSoutheast;
            connections[e][n] |= C.BitsSouthwest;
        }
    }
    // #######  ######      #      #####   #######  
    // #        #     #    # #    #     #  #        
    // #        #     #   #   #   #        #        
    // ####     ######   #######   #####   ####     
    // #        #   #    #     #        #  #        
    // #        #    #   #     #  #     #  #        
    // #######  #     #  #     #   #####   #######  
    erase(point, layer) {
        const x = point.x;
        const y = point.y;
        if (!C.InnerWorldRectCells.contains(point))
            return;
        switch (layer) {
            case C.LayerFloor: {
                this.eraseCell(x, y, this._world.floor, this._world.floorConnections);
                break;
            }
            case C.LayerObject: {
                this.eraseCell(x, y, this._world.objects, this._world.objectConnections);
                this._valueInput.value = '';
                this._portInput.value = '00000000';
                const values = this._world.objectValues;
                const ports = this._world.objectPorts;
                this._memory.remember(values, x, y);
                this._memory.remember(ports, x, y);
                values[x][y] = C.EmptyString;
                ports[x][y] = 0b00000000;
                break;
            }
            case C.LayerRoof: {
                this.eraseCell(x, y, this._world.roof, this._world.roofConnections);
                break;
            }
            case C.LayerCamera: {
                this._memory.remember(this._world.camera, x, y);
                this._world.camera[x][y] = C.TypeEmpty;
                break;
            }
        }
    }
    eraseCell(x, y, types, connections) {
        const e = x + 1;
        const s = y + 1;
        const w = x - 1;
        const n = y - 1;
        this._memory.remember(types, x, y);
        this._memory.remember(connections, x, y);
        this._memory.remember(connections, e, y);
        this._memory.remember(connections, e, s);
        this._memory.remember(connections, x, s);
        this._memory.remember(connections, w, s);
        this._memory.remember(connections, w, y);
        this._memory.remember(connections, w, n);
        this._memory.remember(connections, x, n);
        this._memory.remember(connections, e, n);
        types[x][y] = C.TypeEmpty;
        connections[x][y] = C.BitsNone;
        connections[e][y] &= ~(C.BitsWest | C.BitsSouthwest | C.BitsNorthwest);
        connections[x][s] &= ~(C.BitsNorth | C.BitsNortheast | C.BitsNorthwest);
        connections[w][y] &= ~(C.BitsEast | C.BitsSoutheast | C.BitsNortheast);
        connections[x][n] &= ~(C.BitsSouth | C.BitsSoutheast | C.BitsSouthwest);
        connections[e][s] &= ~C.BitsNorthwest;
        connections[w][s] &= ~C.BitsNortheast;
        connections[w][n] &= ~C.BitsSoutheast;
        connections[e][n] &= ~C.BitsSouthwest;
    }
    //  #####    #####   #     #  #     #  #######   #####   #######  
    // #     #  #     #  ##    #  ##    #  #        #     #     #     
    // #        #     #  # #   #  # #   #  #        #           #     
    // #        #     #  #  #  #  #  #  #  ####     #           #     
    // #        #     #  #   # #  #   # #  #        #           #     
    // #     #  #     #  #    ##  #    ##  #        #     #     #     
    //  #####    #####   #     #  #     #  #######   #####      #     
    connect() {
        const cellPoint = this.cellPoint(this._gamePoint);
        const x = cellPoint.x;
        const y = cellPoint.y;
        if (!C.InnerWorldRectCells.contains(cellPoint))
            return;
        switch (this.layer()) {
            case C.LayerFloor: {
                this.connectCells(x, y, this._world.floor, this._world.floorConnections);
                break;
            }
            case C.LayerObject: {
                this.connectCells(x, y, this._world.objects, this._world.objectConnections);
                break;
            }
            case C.LayerRoof: {
                this.connectCells(x, y, this._world.roof, this._world.roofConnections);
                break;
            }
        }
    }
    connectCells(x, y, types, connections) {
        switch (C.TypeToTileset[types[x][y]]) {
            case C.TilesetConnected:
                const gamePoint = this._gamePoint;
                let cellX = gamePoint.x - x;
                let cellY = gamePoint.y - y;
                if (cellX < C.ConnectionScalar) {
                    x--;
                    cellX += 1.0;
                }
                if (cellY < C.ConnectionScalar) {
                    y--;
                    cellY += 1.0;
                }
                const type = types[x][y];
                const e = x + 1;
                const s = y + 1;
                const point = new Point(cellX, cellY);
                this._memory.remember(connections, x, y);
                this._memory.remember(connections, e, y);
                this._memory.remember(connections, x, s);
                this._memory.remember(connections, e, s);
                const distanceEast = point.distance(new Point(1, 0.5));
                if (types[e][y] === type && distanceEast < C.ConnectionScalar) {
                    connections[x][y] |= C.BitsEast;
                    connections[e][y] |= C.BitsWest;
                    return;
                }
                const distanceSouth = point.distance(new Point(0.5, 1));
                if (types[x][s] === type && distanceSouth < C.ConnectionScalar) {
                    connections[x][y] |= C.BitsSouth;
                    connections[x][s] |= C.BitsNorth;
                    return;
                }
                const distanceSoutheast = point.distance(new Point(1, 1));
                if (types[e][y] === type
                    && types[x][s] === type
                    && types[e][s] === type
                    && distanceSoutheast < C.ConnectionScalar) {
                    connections[x][y] |= (C.BitsEast | C.BitsSouth | C.BitsSoutheast);
                    connections[e][y] |= (C.BitsWest | C.BitsSouth | C.BitsSouthwest);
                    connections[x][s] |= (C.BitsEast | C.BitsNorth | C.BitsNortheast);
                    connections[e][s] |= (C.BitsWest | C.BitsNorth | C.BitsNorthwest);
                }
                break;
        }
    }
    // ######   #######   #####    #####    #####   #     #  #     #  #######   #####   #######  
    // #     #     #     #     #  #     #  #     #  ##    #  ##    #  #        #     #     #     
    // #     #     #     #        #        #     #  # #   #  # #   #  #        #           #     
    // #     #     #      #####   #        #     #  #  #  #  #  #  #  ####     #           #     
    // #     #     #           #  #        #     #  #   # #  #   # #  #        #           #     
    // #     #     #     #     #  #     #  #     #  #    ##  #    ##  #        #     #     #     
    // ######   #######   #####    #####    #####   #     #  #     #  #######   #####      #     
    disconnect() {
        const cellPoint = this.cellPoint(this._gamePoint);
        const x = cellPoint.x;
        const y = cellPoint.y;
        if (!C.InnerWorldRectCells.contains(cellPoint))
            return;
        switch (this.layer()) {
            case C.LayerFloor: {
                this.disconnectCells(x, y, this._world.floorConnections);
                break;
            }
            case C.LayerObject: {
                this.disconnectCells(x, y, this._world.objectConnections);
                break;
            }
            case C.LayerRoof: {
                this.disconnectCells(x, y, this._world.roofConnections);
                break;
            }
        }
    }
    disconnectCells(x, y, connections) {
        const gamePoint = this._gamePoint;
        let cellX = gamePoint.x - x;
        let cellY = gamePoint.y - y;
        if (cellX < C.ConnectionScalar) {
            x--;
            cellX += 1.0;
        }
        if (cellY < C.ConnectionScalar) {
            y--;
            cellY += 1.0;
        }
        const e = x + 1;
        const s = y + 1;
        const w = x - 1;
        const n = y - 1;
        const point = new Point(cellX, cellY);
        this._memory.remember(connections, x, y);
        this._memory.remember(connections, e, y);
        this._memory.remember(connections, x, s);
        this._memory.remember(connections, e, s);
        this._memory.remember(connections, x, n);
        this._memory.remember(connections, e, n);
        this._memory.remember(connections, w, y);
        this._memory.remember(connections, w, s);
        const distanceEast = point.distance(new Point(1, 0.5));
        if (distanceEast < C.ConnectionScalar) {
            connections[x][y] &= ~(C.BitsNortheast | C.BitsEast | C.BitsSoutheast);
            connections[e][y] &= ~(C.BitsNorthwest | C.BitsWest | C.BitsSouthwest);
            connections[x][n] &= ~C.BitsSoutheast;
            connections[x][s] &= ~C.BitsNortheast;
            connections[e][n] &= ~C.BitsSouthwest;
            connections[e][s] &= ~C.BitsNorthwest;
            return;
        }
        const distanceSouth = point.distance(new Point(0.5, 1));
        if (distanceSouth < C.ConnectionScalar) {
            connections[x][y] &= ~(C.BitsSoutheast | C.BitsSouth | C.BitsSouthwest);
            connections[x][s] &= ~(C.BitsNorthwest | C.BitsNorth | C.BitsNortheast);
            connections[e][y] &= ~C.BitsSouthwest;
            connections[w][y] &= ~C.BitsSoutheast;
            connections[e][s] &= ~C.BitsNorthwest;
            connections[w][s] &= ~C.BitsNortheast;
            return;
        }
        const distanceSoutheast = point.distance(new Point(1, 1));
        if (distanceSoutheast < C.ConnectionScalar) {
            connections[x][y] &= ~C.BitsSoutheast;
            connections[e][y] &= ~C.BitsSouthwest;
            connections[x][s] &= ~C.BitsNortheast;
            connections[e][s] &= ~C.BitsNorthwest;
        }
    }
    // #######  #     #   #####   ######   #######   #####   #######  
    //    #     ##    #  #     #  #     #  #        #     #     #     
    //    #     # #   #  #        #     #  #        #           #     
    //    #     #  #  #   #####   ######   ####     #           #     
    //    #     #   # #        #  #        #        #           #     
    //    #     #    ##  #     #  #        #        #     #     #     
    // #######  #     #   #####   #        #######   #####      #     
    moveInspector() {
        const cellPoint = this.cellPoint(this._gamePoint);
        if (C.InnerWorldRectCells.contains(cellPoint)) {
            this._inspectCell = cellPoint;
        }
    }
    inspect() {
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        this._valueInput.value = this._world.objectValues[x][y];
        this._portInput.value = this._world.objectPorts[x][y].toString(2).padStart(8, '0');
    }
    inspectType() {
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        return this._world.objects[x][y];
    }
    valueInputReceived() {
        const valueString = this._valueInput.value;
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        const type = this._world.objects[x][y];
        const valueType = D.stringToValueType(type, valueString);
        if (valueType === C.ValueInvalid) {
            this._valueInput.classList.add('invalid');
        }
        else {
            this._valueInput.classList.remove('invalid');
        }
    }
    valueInputChanged() {
        const valueString = this._valueInput.value;
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        const type = this._world.objects[x][y];
        const valueType = D.stringToValueType(type, valueString);
        if (valueType !== C.ValueInvalid) {
            const values = this._world.objectValues;
            this._memory.remember(values, x, y);
            this._memory.endChanges();
            values[x][y] = valueString;
        }
    }
    valueInputFocusOut() {
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        const value = this._world.objectValues[x][y];
        this._valueInput.value = value;
        this._valueInput.classList.remove('invalid');
    }
    portInputReceived() {
        if (this.validPort()) {
            this._portInput.classList.remove('invalid');
        }
        else {
            this._portInput.classList.add('invalid');
        }
    }
    portInputChanged() {
        if (this.validPort()) {
            const x = this._inspectCell.x;
            const y = this._inspectCell.y;
            const ports = this._world.objectPorts;
            this._memory.remember(ports, x, y);
            this._memory.endChanges();
            ports[x][y] = parseInt(this._portInput.value, 2);
        }
    }
    portInputFocusOut() {
        const x = this._inspectCell.x;
        const y = this._inspectCell.y;
        this._portInput.value = this._world.objectPorts[x][y].toString(2).padStart(8, '0');
        this._portInput.classList.remove('invalid');
    }
    validPort() {
        const value = this._portInput.value;
        if (!/^[0-1]{8}$/.test(value)) {
            return false;
        }
        const ports = parseInt(value, 2);
        switch (this.inspectType()) {
            case C.TypeArithmagician:
                return D.areValidArithmagicianPorts(ports);
            case C.TypeGate:
                return D.areValidGatePorts(ports);
            case C.TypeConstant:
                return D.areValidConstantPorts(ports);
            case C.TypeVariable:
                return D.areValidVariablePorts(ports);
            case C.TypeUnaryOperator:
                return D.areValidUnaryOperatorPorts(ports);
            case C.TypeBinaryOperator:
                return D.areValidBinaryOperatorPorts(ports);
            case C.TypeDefinition:
                return D.areValidDefinitionPorts(ports);
        }
        return ports === 0;
    }
    //  #####   #######  #        #######   #####   #######  
    // #     #  #        #        #        #     #     #     
    // #        #        #        #        #           #     
    //  #####   ####     #        ####     #           #     
    //       #  #        #        #        #           #     
    // #     #  #        #        #        #     #     #     
    //  #####   #######  #######  #######   #####      #     
    select() {
        const cellPoint = this.cellPoint(this._gamePoint);
        if (!C.InnerWorldRectCells.contains(cellPoint))
            return;
        const x = cellPoint.x;
        const y = cellPoint.y;
        this.buildCell(C.TypeSelection, x, y, this._selection, this._selectionConnections);
    }
    unselect() {
        const cellPoint = this.cellPoint(this._gamePoint);
        if (!C.InnerWorldRectCells.contains(cellPoint))
            return;
        const x = cellPoint.x;
        const y = cellPoint.y;
        this.eraseCell(x, y, this._selection, this._selectionConnections);
    }
    beginDragSelect() {
        this._selectPoint = this._gamePoint.copy();
    }
    beginDragUnselect() {
        this._selectPoint = this._gamePoint.copy();
    }
    dragSelect() {
        const selectRect = Rect.fromPoints(this._selectPoint, this._gamePoint);
        const x = Math.floor(selectRect.x);
        const y = Math.floor(selectRect.y);
        const right = Math.ceil(selectRect.right);
        const bottom = Math.ceil(selectRect.bottom);
        for (let i = x; i < right; i++) {
            for (let j = y; j < bottom; j++) {
                if (!C.InnerWorldRectCells.contains(new Point(i, j)))
                    continue;
                this.buildCell(C.TypeSelection, i, j, this._selection, this._selectionConnections);
            }
        }
    }
    dragUnselect() {
        const selectRect = Rect.fromPoints(this._selectPoint, this._gamePoint);
        const x = Math.floor(selectRect.x);
        const y = Math.floor(selectRect.y);
        const right = Math.ceil(selectRect.right);
        const bottom = Math.ceil(selectRect.bottom);
        for (let i = x; i < right; i++) {
            for (let j = y; j < bottom; j++) {
                if (!C.InnerWorldRectCells.contains(new Point(i, j)))
                    continue;
                this.eraseCell(i, j, this._selection, this._selectionConnections);
            }
        }
    }
    async cut(e) {
        e.stopPropagation();
        e.preventDefault();
        this.loadCopier();
        const copy = this._copier.copyString();
        this.eraseSelectedCells();
        this._memory.endChanges();
        this.clearSelection();
        this.inspect();
        await navigator.clipboard.writeText(copy);
    }
    async copy(e) {
        e.stopPropagation();
        e.preventDefault();
        this.loadCopier();
        const copyString = this._copier.copyString();
        await navigator.clipboard.writeText(copyString);
    }
    async paste(e) {
        e.stopPropagation();
        e.preventDefault();
        const copyString = await navigator.clipboard.readText();
        this.pasteSelection(copyString);
        this._memory.endChanges();
        this.inspect();
    }
    loadCopier() {
        this._copier.clear();
        const copyFloor = !this.isLayerLocked(C.LayerFloor);
        const copyObjects = !this.isLayerLocked(C.LayerObject);
        const copyRoof = !this.isLayerLocked(C.LayerRoof);
        const copyCamera = !this.isLayerLocked(C.LayerCamera);
        const floor = this._world.floor;
        const floorConnections = this._world.floorConnections;
        const objects = this._world.objects;
        const objectConnections = this._world.objectConnections;
        const objectValues = this._world.objectValues;
        const objectPorts = this._world.objectPorts;
        const roof = this._world.roof;
        const roofConnections = this._world.roofConnections;
        const camera = this._world.camera;
        for (let i = 1; i < C.WorldWidthCells - 1; i++) {
            for (let j = 1; j < C.WorldWidthCells - 1; j++) {
                if (this._selection[i][j] === C.CellUnselected) {
                    continue;
                }
                const x = i - this._inspectCell.x;
                const y = j - this._inspectCell.y;
                if (copyFloor && floor[i][j] !== C.TypeEmpty) {
                    const connections = this.copyConnections(i, j, floorConnections[i][j]);
                    const floorCopy = { x: x, y: y, type: floor[i][j], connections: connections };
                    this._copier.addFloor(floorCopy);
                }
                if (copyObjects && objects[i][j] !== C.TypeEmpty) {
                    const connections = this.copyConnections(i, j, objectConnections[i][j]);
                    const objectCopy = {
                        x: x,
                        y: y,
                        type: objects[i][j],
                        connections: connections,
                        value: objectValues[i][j],
                        ports: objectPorts[i][j],
                    };
                    this._copier.addObject(objectCopy);
                }
                if (copyRoof && roof[i][j] !== C.TypeEmpty) {
                    const connections = this.copyConnections(i, j, roofConnections[i][j]);
                    const roofCopy = { x: x, y: y, type: roof[i][j], connections: connections };
                    this._copier.addRoof(roofCopy);
                }
                if (copyCamera) {
                    const cameraCopy = { x: x, y: y, type: camera[i][j] };
                    this._copier.addCamera(cameraCopy);
                }
            }
        }
    }
    copyConnections(x, y, connections) {
        const xe = x + 1;
        const ys = y + 1;
        const xw = x - 1;
        const yn = y - 1;
        const e = this._selection[xe][y];
        const s = this._selection[x][ys];
        const w = this._selection[xw][y];
        const n = this._selection[x][yn];
        const se = this._selection[xe][ys];
        const sw = this._selection[xw][ys];
        const nw = this._selection[xw][yn];
        const ne = this._selection[xe][yn];
        let off = C.BitsNone;
        if (!e)
            off |= C.BitsEast | C.BitsNortheast | C.BitsSoutheast;
        if (!s)
            off |= C.BitsSouth | C.BitsSoutheast | C.BitsSouthwest;
        if (!w)
            off |= C.BitsWest | C.BitsSouthwest | C.BitsNorthwest;
        if (!n)
            off |= C.BitsNorth | C.BitsNorthwest | C.BitsNortheast;
        if (!se)
            off |= C.BitsSoutheast;
        if (!sw)
            off |= C.BitsSouthwest;
        if (!nw)
            off |= C.BitsNorthwest;
        if (!ne)
            off |= C.BitsNortheast;
        return connections & ~off;
    }
    clearSelection() {
        const selection = this._selection;
        const selectionConnections = this._selectionConnections;
        for (let i = 1; i < C.WorldWidthCells - 1; i++) {
            for (let j = 1; j < C.WorldWidthCells - 1; j++) {
                selection[i][j] = C.TypeEmpty;
                selectionConnections[i][j] = C.BitsNone;
            }
        }
    }
    eraseSelectedCells() {
        const eraseFloor = !this.isLayerLocked(C.LayerFloor);
        const eraseObjects = !this.isLayerLocked(C.LayerObject);
        const eraseRoof = !this.isLayerLocked(C.LayerRoof);
        const eraseCamera = !this.isLayerLocked(C.LayerCamera);
        const floor = this._world.floor;
        const floorConnections = this._world.floorConnections;
        const objects = this._world.objects;
        const objectConnections = this._world.objectConnections;
        const objectValues = this._world.objectValues;
        const objectPorts = this._world.objectPorts;
        const roof = this._world.roof;
        const roofConnections = this._world.roofConnections;
        const camera = this._world.camera;
        for (let i = 1; i < C.WorldWidthCells - 1; i++) {
            for (let j = 1; j < C.WorldWidthCells - 1; j++) {
                if (this._selection[i][j] === C.CellUnselected) {
                    continue;
                }
                if (eraseFloor) {
                    this.eraseCell(i, j, floor, floorConnections);
                }
                if (eraseObjects) {
                    this.eraseCell(i, j, objects, objectConnections);
                    this._memory.remember(objectValues, i, j);
                    this._memory.remember(objectPorts, i, j);
                    objectValues[i][j] = C.EmptyString;
                    objectPorts[i][j] = 0;
                }
                if (eraseRoof) {
                    this.eraseCell(i, j, roof, roofConnections);
                }
                if (eraseCamera) {
                    this._memory.remember(camera, i, j);
                    camera[i][j] = C.TypeEmpty;
                }
            }
        }
    }
    pasteSelection(copyString) {
        const data = JSON.parse(copyString);
        const floorCopies = data.floorCopies;
        const objectCopies = data.objectCopies;
        const roofCopies = data.roofCopies;
        const cameraCopies = data.cameraCopies;
        const floor = this._world.floor;
        const floorConnections = this._world.floorConnections;
        const objects = this._world.objects;
        const objectConnections = this._world.objectConnections;
        const objectValues = this._world.objectValues;
        const objectPorts = this._world.objectPorts;
        const roof = this._world.roof;
        const roofConnections = this._world.roofConnections;
        const camera = this._world.camera;
        const inspector = this._inspectCell;
        if (!this.isLayerLocked(C.LayerFloor)) {
            for (let floorCopy of floorCopies) {
                floorCopy.x += inspector.x;
                floorCopy.y += inspector.y;
                if (!C.InnerWorldRectCells.contains(new Point(floorCopy.x, floorCopy.y)))
                    continue;
                this.eraseCell(floorCopy.x, floorCopy.y, floor, floorConnections);
            }
            for (let floorCopy of floorCopies) {
                const x = floorCopy.x;
                const y = floorCopy.y;
                if (!C.InnerWorldRectCells.contains(new Point(x, y)))
                    continue;
                this._memory.remember(floor, x, y);
                this._memory.remember(floorConnections, x, y);
                floor[x][y] = floorCopy.type;
                floorConnections[x][y] = this.pasteConnections(floorCopy.connections, x, y);
            }
        }
        if (!this.isLayerLocked(C.LayerObject)) {
            for (let objectCopy of objectCopies) {
                objectCopy.x += inspector.x;
                objectCopy.y += inspector.y;
                if (!C.InnerWorldRectCells.contains(new Point(objectCopy.x, objectCopy.y)))
                    continue;
                this.eraseCell(objectCopy.x, objectCopy.y, objects, objectConnections);
            }
            for (let objectCopy of objectCopies) {
                const x = objectCopy.x;
                const y = objectCopy.y;
                if (!C.InnerWorldRectCells.contains(new Point(x, y)))
                    continue;
                this._memory.remember(objects, x, y);
                this._memory.remember(objectConnections, x, y);
                this._memory.remember(objectValues, x, y);
                this._memory.remember(objectPorts, x, y);
                objects[x][y] = objectCopy.type;
                objectConnections[x][y] = this.pasteConnections(objectCopy.connections, x, y);
                objectValues[x][y] = objectCopy.value;
                objectPorts[x][y] = objectCopy.ports;
            }
        }
        if (!this.isLayerLocked(C.LayerRoof)) {
            for (let roofCopy of roofCopies) {
                roofCopy.x += inspector.x;
                roofCopy.y += inspector.y;
                if (!C.InnerWorldRectCells.contains(new Point(roofCopy.x, roofCopy.y)))
                    continue;
                this.eraseCell(roofCopy.x, roofCopy.y, roof, roofConnections);
            }
            for (let roofCopy of roofCopies) {
                const x = roofCopy.x;
                const y = roofCopy.y;
                if (!C.InnerWorldRectCells.contains(new Point(x, y)))
                    continue;
                this._memory.remember(roof, x, y);
                this._memory.remember(roofConnections, x, y);
                roof[x][y] = roofCopy.type;
                roofConnections[x][y] = this.pasteConnections(roofCopy.connections, x, y);
            }
        }
        if (!this.isLayerLocked(C.LayerCamera)) {
            for (let cameraCopy of cameraCopies) {
                cameraCopy.x += inspector.x;
                cameraCopy.y += inspector.y;
                if (!C.InnerWorldRectCells.contains(new Point(cameraCopy.x, cameraCopy.y)))
                    continue;
                this._memory.remember(camera, cameraCopy.x, cameraCopy.y);
                camera[cameraCopy.x][cameraCopy.y] = C.TypeEmpty;
            }
            for (let cameraCopy of cameraCopies) {
                const x = cameraCopy.x;
                const y = cameraCopy.y;
                if (!C.InnerWorldRectCells.contains(new Point(x, y)))
                    continue;
                this._memory.remember(camera, x, y);
                camera[x][y] = cameraCopy.type;
            }
        }
    }
    pasteConnections(connections, x, y) {
        if (x === 1) {
            connections &= ~(C.BitsWest | C.BitsSouthwest | C.BitsNorthwest);
        }
        if (y === 1) {
            connections &= ~(C.BitsNorth | C.BitsNorthwest | C.BitsNortheast);
        }
        if (x === C.WorldWidthCells - 2) {
            connections &= ~(C.BitsEast | C.BitsNortheast | C.BitsSoutheast);
        }
        if (y === C.WorldHeightCells - 2) {
            connections &= ~(C.BitsSouth | C.BitsSoutheast | C.BitsSouthwest);
        }
        return connections;
    }
    // #######  #######  #        #######   #####   
    // #           #     #        #        #     #  
    // #           #     #        #        #        
    // ####        #     #        ####      #####   
    // #           #     #        #              #  
    // #           #     #        #        #     #  
    // #        #######  #######  #######   #####   
    load() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.wld';
        fileInput.addEventListener('change', async () => {
            const files = fileInput.files;
            if (files === null)
                return;
            const file = files[0];
            const data = await Compressor.decompress(file);
            this._world.loadFromJSON(data);
        });
        fileInput.click();
    }
    async save() {
        const anchor = document.createElement('a');
        const text = this._world.saveAsJSON();
        const zip = await Compressor.compress(text);
        const url = window.URL.createObjectURL(zip);
        anchor.href = url;
        anchor.download = 'world.wld';
        anchor.click();
    }
    async test() {
        this._broadcastChannel.postMessage(this._world.saveAsJSON());
    }
    // ######   #######  #     #  ######   #######  ######   
    // #     #  #        ##    #  #     #  #        #     #  
    // #     #  #        # #   #  #     #  #        #     #  
    // ######   ####     #  #  #  #     #  ####     ######   
    // #   #    #        #   # #  #     #  #        #   #    
    // #    #   #        #    ##  #     #  #        #    #   
    // #     #  #######  #     #  ######   #######  #     #  
    loop() {
        this.render();
        requestAnimationFrame(() => this.loop());
    }
    render() {
        this._canvas.width = this._canvas.offsetWidth;
        this._canvas.height = this._canvas.offsetHeight;
        this._context.imageSmoothingEnabled = false;
        if (!this.isLayerHidden(C.LayerFloor)) {
            this.renderLayer(this._world.floor, this._world.floorConnections);
        }
        if (!this.isLayerHidden(C.LayerObject)) {
            this.renderObjects();
        }
        if (!this.isLayerHidden(C.LayerRoof)) {
            this.renderLayer(this._world.roof, this._world.roofConnections);
        }
        if (!this.isLayerHidden(C.LayerCamera)) {
            this.renderSimpleLayer(this._world.camera);
        }
        if (this.isLayerHighlighted(C.LayerFloor)) {
            this.renderHighlights(this._world.floor);
        }
        if (this.isLayerHighlighted(C.LayerObject)) {
            this.renderHighlights(this._world.objects);
        }
        if (this.isLayerHighlighted(C.LayerRoof)) {
            this.renderHighlights(this._world.roof);
        }
        if (this.isLayerHighlighted(C.LayerCamera)) {
            this.renderHighlights(this._world.camera);
        }
        switch (this.tool()) {
            case C.ToolBuild:
                this.renderHover();
                break;
            case C.ToolConnect:
                this.renderConnections();
                break;
            case C.ToolSelect:
                // this.renderSimpleLayer(this._selection, this._selectionConnections)
                // this.renderHover()
                break;
        }
        this.renderLayer(this._selection, this._selectionConnections);
        this.renderInspector();
        this.renderGrid();
        this.renderMouseCell();
        switch (this.action()) {
            case C.ActionDragSelect:
                this.renderDragSelector('#0f0', '#0f04');
                break;
            case C.ActionDragUnselect:
                this.renderDragSelector('#f00', '#f004');
                break;
        }
    }
    renderDragSelector(borderColor, interiorColor) {
        const selectRect = Rect.fromPoints(this._selectPoint, this._gamePoint);
        const canvasRect = this.canvasRect(selectRect);
        this._context.lineWidth = 1;
        this._context.strokeStyle = borderColor;
        this._context.fillStyle = interiorColor;
        this._context.fillRect(canvasRect.x, canvasRect.y, canvasRect.w, canvasRect.h);
        this._context.strokeRect(canvasRect.x, canvasRect.y, canvasRect.w, canvasRect.h);
    }
    renderGrid() {
        const topLeft = this.canvasPoint(new Point(0, 0));
        const bottom = topLeft.y + C.WorldHeightCells * this._scale;
        const right = topLeft.x + C.WorldWidthCells * this._scale;
        this._context.strokeStyle = '#ffffff40';
        this._context.lineWidth = 0.5; // this._scale * 0.03125
        this._context.beginPath();
        for (let i = topLeft.y; i <= bottom; i += this._scale) {
            this._context.moveTo(topLeft.x, i);
            this._context.lineTo(right, i);
        }
        for (let i = topLeft.x; i <= right; i += this._scale) {
            this._context.moveTo(i, topLeft.y);
            this._context.lineTo(i, bottom);
        }
        this._context.stroke();
    }
    renderHover() {
        const hoverCell = this.cellPoint(this._gamePoint);
        const displayPoint = this.canvasPoint(hoverCell);
        this._context.fillStyle = '#ffffff20';
        this._context.fillRect(displayPoint.x, displayPoint.y, this._scale, this._scale);
    }
    renderMouseCell() {
        this._context.fillStyle = '#ffffff80';
        this._context.font = "20px sans-serif";
        const cell = this.cellPoint(this._gamePoint);
        this._context.fillText(`${cell.x}, ${cell.y}`, 10, this._canvas.offsetHeight - 15);
    }
    renderSimpleLayer(types) {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                const point = new Point(i, j);
                const canvasPoint = this.canvasPoint(point);
                const tileset = I.TypeToTileset.get(type);
                this._context.drawImage(tileset, canvasPoint.x, canvasPoint.y, this._scale, this._scale);
            }
        }
    }
    renderLayer(types, connections) {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                const point = new Point(i, j);
                const canvasPoint = this.canvasPoint(point);
                const tileset = I.TypeToTileset.get(type);
                switch (C.TypeToTileset[type]) {
                    case C.TilesetConnected: {
                        this._context.drawImage(tileset, connections[i][j] * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, canvasPoint.x, canvasPoint.y, this._scale, this._scale);
                        break;
                    }
                    case C.TilesetBlock: {
                        this._context.drawImage(tileset, canvasPoint.x, canvasPoint.y, this._scale, this._scale);
                        break;
                    }
                }
            }
        }
    }
    renderObjects() {
        const scalar = this._scale / C.CellSizePixels;
        const charWidth = C.FontWidth * scalar;
        const charHeight = C.FontHeight * scalar;
        const singleX = C.CellSingleX * scalar;
        const doubleX1 = C.CellDoubleX1 * scalar;
        const doubleX2 = C.CellDoubleX2 * scalar;
        const integerY = C.CellIntegerY * scalar;
        const fractionY = C.CellFractionY * scalar;
        const fractionHeight = C.FractionHeight * scalar;
        const numeratorY = C.CellNumeratorY * scalar;
        const denominatorY = C.CellDenominatorY * scalar;
        const fraction1Width = C.Fraction1Width * scalar;
        const fraction2Width = C.Fraction2Width * scalar;
        const minusXSingle = C.CellMinusXSingle * scalar;
        const minusXDouble = C.CellMinusXDouble * scalar;
        const minusWidth = C.MinusWidth * scalar;
        const types = this._world.objects;
        const connections = this._world.objectConnections;
        const ports = this._world.objectPorts;
        const values = this._world.objectValues;
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                const point = new Point(i, j);
                const canvasPoint = this.canvasPoint(point);
                const tileset = I.TypeToTileset.get(type);
                let offset = 0;
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
                this._context.drawImage(tileset, offset * C.CellSizePixels, 0, C.CellSizePixels, C.CellSizePixels, canvasPoint.x, canvasPoint.y, this._scale, this._scale);
                const value = values[i][j];
                if (value === C.EmptyString)
                    continue;
                const valueType = D.stringToValueType(type, value);
                if (value.length === 1) {
                    const charCode = value.charCodeAt(0);
                    const srcX = C.FontWidth * charCode;
                    const dstX = canvasPoint.x + singleX;
                    const dstY = canvasPoint.y + integerY;
                    this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, charWidth, charHeight);
                    continue;
                }
                switch (valueType) {
                    case C.ValueBoolean: {
                        const length = value.length;
                        const x = (this._scale - charWidth * length) / 2;
                        for (let i = 0; i < length; i++) {
                            const charCode = value.charCodeAt(i);
                            const srcX = C.FontWidth * charCode;
                            const dstX = canvasPoint.x + x + charWidth * i;
                            const dstY = canvasPoint.y + integerY;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, charWidth, charHeight);
                        }
                        break;
                    }
                    case C.ValueInteger: {
                        const negative = value[0] === '-';
                        const absoluteValue = negative ? value.substring(1) : value;
                        const width = absoluteValue.length;
                        const dstY = canvasPoint.y + integerY;
                        if (width === 1) {
                            const srcX = C.FontWidth * absoluteValue.charCodeAt(0);
                            const dstX = canvasPoint.x + singleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, charWidth, charHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * absoluteValue.charCodeAt(0);
                            const srcX2 = C.FontWidth * absoluteValue.charCodeAt(1);
                            const dstX1 = canvasPoint.x + doubleX1;
                            const dstX2 = canvasPoint.x + doubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, dstY, charWidth, charHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, dstY, charWidth, charHeight);
                        }
                        if (negative) {
                            const dstX = canvasPoint.x + (width === 1 ? minusXSingle : minusXDouble);
                            const dstY = canvasPoint.y + fractionY;
                            this._context.drawImage(I.MinusSign, dstX, dstY, minusWidth, fractionHeight);
                        }
                        break;
                    }
                    case C.ValueRational: {
                        const fractionIndex = value.indexOf('/');
                        const negative = value[0] === '-';
                        const numerator = negative ? value.substring(1, fractionIndex) : value.substring(0, fractionIndex);
                        const denominator = value.substring(fractionIndex + 1);
                        const width = Math.max(numerator.length, denominator.length);
                        const numY = canvasPoint.y + numeratorY;
                        const denY = canvasPoint.y + denominatorY;
                        if (width === 1) {
                            const dstX = canvasPoint.x + singleX;
                            const dstY = canvasPoint.y + fractionY;
                            this._context.drawImage(I.Fraction1, dstX, dstY, fraction1Width, fractionHeight);
                        }
                        else {
                            const dstX = canvasPoint.x + doubleX1;
                            const dstY = canvasPoint.y + fractionY;
                            this._context.drawImage(I.Fraction2, dstX, dstY, fraction2Width, fractionHeight);
                        }
                        if (numerator.length === 1) {
                            const srcX = C.FontWidth * numerator.charCodeAt(0);
                            const dstX = canvasPoint.x + singleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, numY, charWidth, charHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * numerator.charCodeAt(0);
                            const srcX2 = C.FontWidth * numerator.charCodeAt(1);
                            const dstX1 = canvasPoint.x + doubleX1;
                            const dstX2 = canvasPoint.x + doubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, numY, charWidth, charHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, numY, charWidth, charHeight);
                        }
                        if (denominator.length === 1) {
                            const srcX = C.FontWidth * denominator.charCodeAt(0);
                            const dstX = canvasPoint.x + singleX;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, denY, charWidth, charHeight);
                        }
                        else {
                            const srcX1 = C.FontWidth * denominator.charCodeAt(0);
                            const srcX2 = C.FontWidth * denominator.charCodeAt(1);
                            const dstX1 = canvasPoint.x + doubleX1;
                            const dstX2 = canvasPoint.x + doubleX2;
                            this._context.drawImage(I.Font, srcX1, 0, C.FontWidth, C.FontHeight, dstX1, denY, charWidth, charHeight);
                            this._context.drawImage(I.Font, srcX2, 0, C.FontWidth, C.FontHeight, dstX2, denY, charWidth, charHeight);
                        }
                        if (negative) {
                            const dstX = canvasPoint.x + (width === 1 ? minusXSingle : minusXDouble);
                            const dstY = canvasPoint.y + fractionY;
                            this._context.drawImage(I.MinusSign, dstX, dstY, minusWidth, fractionHeight);
                        }
                        break;
                    }
                    case C.ValueUnaryOperator:
                    case C.ValueBinaryOperator: {
                        const length = value.length;
                        const x = (this._scale - charWidth * length) / 2;
                        for (let i = 0; i < length; i++) {
                            const charCode = value.charCodeAt(i);
                            const srcX = C.FontWidth * charCode;
                            const dstX = canvasPoint.x + x + charWidth * i;
                            const dstY = canvasPoint.y + integerY;
                            this._context.drawImage(I.Font, srcX, 0, C.FontWidth, C.FontHeight, dstX, dstY, charWidth, charHeight);
                        }
                        break;
                    }
                }
            }
        }
    }
    renderHighlights(types) {
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                const point = new Point(i, j);
                const canvasPoint = this.canvasPoint(point);
                this._context.drawImage(I.Highlight, canvasPoint.x, canvasPoint.y, this._scale, this._scale);
            }
        }
    }
    renderInspector() {
        const displayPoint = this.canvasPoint(this._inspectCell);
        this._context.drawImage(I.Inspector, displayPoint.x, displayPoint.y, this._scale, this._scale);
    }
    renderConnections() {
        switch (this.layer()) {
            case C.LayerFloor: {
                this.renderLayerConnections(this._world.floor);
                break;
            }
            case C.LayerObject: {
                this.renderLayerConnections(this._world.objects);
                break;
            }
            case C.LayerRoof: {
                this.renderLayerConnections(this._world.roof);
                break;
            }
        }
    }
    renderLayerConnections(types) {
        this._context.fillStyle = 'rgba(255, 255, 255, 0.25)';
        const half = this._scale / 2;
        const sixth = this._scale * C.ConnectionScalar;
        this._context.beginPath();
        for (let i = 0; i < C.WorldWidthCells; i++) {
            for (let j = 0; j < C.WorldHeightCells; j++) {
                const type = types[i][j];
                if (type === C.TypeEmpty)
                    continue;
                if (C.TypeToTileset[type] !== C.TilesetConnected)
                    continue;
                const e = type === types[i + 1][j];
                const s = type === types[i][j + 1];
                const se = type === types[i + 1][j + 1];
                const p = this.canvasPoint(new Point(i, j));
                if (e) {
                    const x = p.x + this._scale;
                    const y = p.y + half;
                    this._context.moveTo(x, y);
                    this._context.arc(x, y, sixth, 0, C.Tau);
                }
                if (s) {
                    const x = p.x + half;
                    const y = p.y + this._scale;
                    this._context.moveTo(x, y);
                    this._context.arc(x, y, sixth, 0, C.Tau);
                }
                if (e && s && se) {
                    const x = p.x + this._scale;
                    const y = p.y + this._scale;
                    this._context.moveTo(x, y);
                    this._context.arc(x, y, sixth, 0, C.Tau);
                }
            }
        }
        this._context.fill();
    }
    gamePoint(canvasPoint) {
        const x = this._focus.x + (canvasPoint.x - this._canvas.offsetWidth / 2) / this._scale;
        const y = this._focus.y + (canvasPoint.y - this._canvas.offsetHeight / 2) / this._scale;
        return new Point(x, y);
    }
    cellPoint(gamePoint) {
        const x = Math.floor(gamePoint.x);
        const y = Math.floor(gamePoint.y);
        return new Point(x, y);
    }
    canvasPoint(gamePoint) {
        const x = this._canvas.offsetWidth / 2 + this._scale * (gamePoint.x - this._focus.x);
        const y = this._canvas.offsetHeight / 2 + this._scale * (gamePoint.y - this._focus.y);
        return new Point(x, y);
    }
    canvasSize(size) {
        return new Size(this._scale * size.w, this._scale * size.h);
    }
    canvasRect(gameRect) {
        const origin = this.canvasPoint(gameRect.origin);
        const size = this.canvasSize(gameRect.size);
        return Rect.fromOriginAndSize(origin, size);
    }
}
window.addEventListener('load', () => {
    I.loadImages();
    new Editor();
});

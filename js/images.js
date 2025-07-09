import * as C from './constants.js';
// Assumes a template with even dimensions
function createConnectedTileset(template) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = C.CellSizePixels;
    const half = size / 2;
    canvas.width = size * 256;
    canvas.height = size;
    for (let i = 0; i < 256; i++) {
        const e = (i & 1) === 1;
        const s = (i & 2) >> 1 === 1;
        const w = (i & 4) >> 2 === 1;
        const n = (i & 8) >> 3 === 1;
        const se = (i & 16) >> 4 === 1;
        const sw = (i & 32) >> 5 === 1;
        const nw = (i & 64) >> 6 === 1;
        const ne = (i & 128) >> 7 === 1;
        const seIndex = connectionTemplateIndex(e, s, se);
        const swIndex = connectionTemplateIndex(w, s, sw);
        const nwIndex = connectionTemplateIndex(w, n, nw);
        const neIndex = connectionTemplateIndex(e, n, ne);
        context.drawImage(template, seIndex * size + half, half, half, half, i * size + half, half, half, half);
        context.drawImage(template, swIndex * size, half, half, half, i * size, half, half, half);
        context.drawImage(template, nwIndex * size, 0, half, half, i * size, 0, half, half);
        context.drawImage(template, neIndex * size + half, 0, half, half, i * size + half, 0, half, half);
    }
    const tileset = new Image();
    tileset.src = canvas.toDataURL();
    return tileset;
}
function connectionTemplateIndex(horizontal, vertical, diagonal) {
    if (diagonal && !(horizontal && vertical))
        return -1;
    if (diagonal)
        return 0;
    if (horizontal && vertical)
        return 1;
    if (horizontal)
        return 2;
    if (vertical)
        return 3;
    return 4;
}
// Assumes a template with dimensions evenly divisible by 3
function createIOTileset(template) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = C.CellSizePixels;
    const third = size / 3;
    const twoThirds = third * 2;
    canvas.width = size * 256;
    canvas.height = size;
    for (let i = 0; i < 256; i++) {
        const e = (i & 0b00000011) + 1;
        const s = ((i >> 2) & 0b00000011) + 1;
        const w = ((i >> 4) & 0b00000011) + 1;
        const n = ((i >> 6) & 0b00000011) + 1;
        context.drawImage(template, 0, 0, size, size, i * size, 0, size, size);
        context.drawImage(template, e * size + twoThirds, third, third, third, i * size + twoThirds, third, third, third);
        context.drawImage(template, s * size + third, twoThirds, third, third, i * size + third, twoThirds, third, third);
        context.drawImage(template, w * size, third, third, third, i * size, third, third, third);
        context.drawImage(template, n * size + third, 0, third, third, i * size + third, 0, third, third);
    }
    const tileset = new Image();
    tileset.src = canvas.toDataURL();
    return tileset;
}
// Assumes a template with dimensions evenly divisible by 3
function createBinaryTileset(template) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = C.CellSizePixels;
    const third = size / 3;
    const twoThirds = third * 2;
    canvas.width = size * 16;
    canvas.height = size;
    for (let i = 0; i < 16; i++) {
        const e = (i & C.BitsEast) === 0 ? 1 : 2;
        const s = (i & C.BitsSouth) === 0 ? 1 : 2;
        const w = (i & C.BitsWest) === 0 ? 1 : 2;
        const n = (i & C.BitsNorth) === 0 ? 1 : 2;
        context.drawImage(template, 0, 0, size, size, i * size, 0, size, size);
        context.drawImage(template, e * size + twoThirds, third, third, third, i * size + twoThirds, third, third, third);
        context.drawImage(template, s * size + third, twoThirds, third, third, i * size + third, twoThirds, third, third);
        context.drawImage(template, w * size, third, third, third, i * size, third, third, third);
        context.drawImage(template, n * size + third, 0, third, third, i * size + third, 0, third, third);
    }
    const tileset = new Image();
    tileset.src = canvas.toDataURL();
    return tileset;
}
export const Highlight = document.getElementById('highlight-image');
export const Fraction1 = document.getElementById('fraction-image-1');
export const Fraction2 = document.getElementById('fraction-image-2');
export const MinusSign = document.getElementById('minus-sign-image');
export const Inspector = document.getElementById('inspector-image');
export const Font = document.getElementById('font-image');
export const Darkness = document.getElementById('darkness-image');
export const Cursor = document.getElementById('cursor-image');
export const TypeToTileset = new Map();
export const ArithmagicianOffset = new Map();
export const EmitterOffset = new Map();
export const ReceiverOffset = new Map();
export const OrthogonalOffset = new Map();
export function loadImages() {
    ArithmagicianOffset.set(0b00000011, 0);
    ArithmagicianOffset.set(0b00001100, 1);
    ArithmagicianOffset.set(0b00110000, 2);
    ArithmagicianOffset.set(0b11000000, 3);
    OrthogonalOffset.set(0b00000001, 0);
    OrthogonalOffset.set(0b00000100, 1);
    OrthogonalOffset.set(0b00010000, 2);
    OrthogonalOffset.set(0b01000000, 3);
    EmitterOffset.set(0b00000000, 0);
    EmitterOffset.set(0b00000011, 1);
    EmitterOffset.set(0b00001100, 2);
    EmitterOffset.set(0b00001111, 3);
    EmitterOffset.set(0b00110000, 4);
    EmitterOffset.set(0b00110011, 5);
    EmitterOffset.set(0b00111100, 6);
    EmitterOffset.set(0b00111111, 7);
    EmitterOffset.set(0b11000000, 8);
    EmitterOffset.set(0b11000011, 9);
    EmitterOffset.set(0b11001100, 10);
    EmitterOffset.set(0b11001111, 11);
    EmitterOffset.set(0b11110000, 12);
    EmitterOffset.set(0b11110011, 13);
    EmitterOffset.set(0b11111100, 14);
    EmitterOffset.set(0b11111111, 15);
    ReceiverOffset.set(0b00000000, 0);
    ReceiverOffset.set(0b00000001, 1);
    ReceiverOffset.set(0b00000100, 2);
    ReceiverOffset.set(0b00000101, 3);
    ReceiverOffset.set(0b00010000, 4);
    ReceiverOffset.set(0b00010001, 5);
    ReceiverOffset.set(0b00010100, 6);
    ReceiverOffset.set(0b00010101, 7);
    ReceiverOffset.set(0b01000000, 8);
    ReceiverOffset.set(0b01000001, 9);
    ReceiverOffset.set(0b01000100, 10);
    ReceiverOffset.set(0b01000101, 11);
    ReceiverOffset.set(0b01010000, 12);
    ReceiverOffset.set(0b01010001, 13);
    ReceiverOffset.set(0b01010100, 14);
    ReceiverOffset.set(0b01010101, 15);
    const connectedImages = document.getElementsByClassName('connected-image');
    for (const connectedImage of connectedImages) {
        const image = connectedImage;
        const tileset = createConnectedTileset(image);
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, tileset);
    }
    const blockImages = document.getElementsByClassName('block-image');
    for (const blockImage of blockImages) {
        const image = blockImage;
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, image);
    }
    const ioImages = document.getElementsByClassName('io-image');
    for (const ioImage of ioImages) {
        const image = ioImage;
        const tileset = createIOTileset(image);
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, tileset);
    }
    const orthogonalImages = document.getElementsByClassName('orthogonal-image');
    for (const orthogonalImage of orthogonalImages) {
        const image = orthogonalImage;
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, image);
    }
    const emitterImages = document.getElementsByClassName('emitter-image');
    for (const emitterImage of emitterImages) {
        const image = emitterImage;
        const tileset = createBinaryTileset(image);
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, tileset);
    }
    const receiverImages = document.getElementsByClassName('receiver-image');
    for (const receiverImage of receiverImages) {
        const image = receiverImage;
        const tileset = createBinaryTileset(image);
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, tileset);
    }
    const arithmagicianImages = document.getElementsByClassName('arithmagician-image');
    for (const arithmagicianImage of arithmagicianImages) {
        const image = arithmagicianImage;
        const type = C.StringToType[image.dataset.type];
        TypeToTileset.set(type, image);
    }
}

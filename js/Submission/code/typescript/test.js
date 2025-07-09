import Game from './game.js';
import { loadImages } from './images.js';
window.addEventListener('load', () => {
    loadImages();
    const broadcastChannel = new BroadcastChannel('arithmagician');
    const game = new Game();
    broadcastChannel.addEventListener('message', e => {
        game.close();
        game.loadFromJSON(e.data);
        game.run();
    });
});

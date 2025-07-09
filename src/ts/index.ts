import { Tau } from './constants.js'
import Game from './game.js'
import { loadImages } from './images.js'

class ScreenManager {
    private static TimeMillisFadeIn     = 500
    private static TimeMillisFadeOut    = 1000
    
    public loginDiv:    HTMLDivElement
    public titleDiv:    HTMLDivElement
    public gameDiv:     HTMLDivElement

    constructor(
        loginDiv:   HTMLDivElement, 
        titleDiv:   HTMLDivElement, 
        gameDiv:    HTMLDivElement
    ) {
        this.loginDiv                       = loginDiv
        this.titleDiv                       = titleDiv
        this.gameDiv                        = gameDiv

        this.loginDiv.style.opacity         = '1'
        this.loginDiv.style.pointerEvents   = 'all'

        this.titleDiv.style.opacity         = '0'
        this.gameDiv.style.opacity          = '0'
        this.titleDiv.style.pointerEvents   = 'none'
        this.gameDiv.style.pointerEvents    = 'none'
    }

    public swap(oldElement: HTMLElement, newElement: HTMLElement) {
        oldElement.style.transition     = `${ScreenManager.TimeMillisFadeOut}ms`
        oldElement.style.opacity        = '0'
        oldElement.style.pointerEvents  = 'none'
        setTimeout(() => {
            newElement.style.transition     = `${ScreenManager.TimeMillisFadeIn}ms`
            newElement.style.opacity        = '1'
            newElement.style.pointerEvents  = 'all'
        }, ScreenManager.TimeMillisFadeOut)
    }

    // Login -> title
    public login() {
        this.swap(this.loginDiv, this.titleDiv)
    }

    // Title -> login
    public logout() {
        this.swap(this.titleDiv, this.loginDiv)
    }

    // Title -> game
    public play() {
        this.swap(this.titleDiv, this.gameDiv)
    }

    // Game -> title
    public pause() {
        this.swap(this.gameDiv, this.titleDiv)
    }
}

window.addEventListener('load', () => {
    const display = <HTMLDivElement>document.getElementById('display')
    display.style.opacity = '1'

    loadImages()

    const game: Game = new Game()

    const displayMode   = <HTMLDivElement>document.getElementById('display-mode')
    const loginScreen   = <HTMLDivElement>document.getElementById('login-screen')
    const titleScreen   = <HTMLDivElement>document.getElementById('title-screen')
    const gameScreen    = <HTMLDivElement>document.getElementById('game-screen')
    const enterButton   = <HTMLDivElement>document.getElementById('enter-button')
    const starCanvas    = <HTMLCanvasElement>document.getElementById('star-canvas')
    const playButton    = <HTMLDivElement>document.getElementById('play-button')
    const editButton    = <HTMLDivElement>document.getElementById('edit-button')
    const logoutButton  = <HTMLDivElement>document.getElementById('logout-button')
    const usernameInput = <HTMLInputElement>document.getElementById('username-input')
    const passwordInput = <HTMLInputElement>document.getElementById('password-input')
    const errorMessage  = <HTMLInputElement>document.getElementById('error-message')

    const screenManager = new ScreenManager(loginScreen, titleScreen, gameScreen)

    const starContext   = starCanvas.getContext('2d')!

    let starRenderId    = requestAnimationFrame(starLoop)

    let username        = ''
    let password        = ''

    displayMode.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.body.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    })
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            displayMode.innerText = 'Fullscreen'
        } else {
            displayMode.innerText = 'Window'
        }
    })

    enterButton.addEventListener('click', attemptLogin)

    playButton.addEventListener('click', () => {
        screenManager.play()
        game.run()
    })

    editButton.addEventListener('click', () => {
        window.open('./editor.html', '_blank')
    })

    logoutButton.addEventListener('click', () => {
        screenManager.logout()
        logout()
    })

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            screenManager.pause()
        }
    })

    function starLoop() {
        renderStars()
        starRenderId = requestAnimationFrame(starLoop)
    }

    
    let frame = 0
    function renderStars() {
        starContext.globalCompositeOperation = 'source-in'
        starCanvas.width = window.innerWidth
        starCanvas.height = window.innerHeight
        starContext.fillStyle = 'white'
        const rand = new Random()
        starContext.beginPath()
        for (let i = 0; i < 400; i++) {
            const r     = rand.nextFloat() * 2.0
            const vy    = rand.nextFloat() * 1.0
            const x     = rand.nextFloat() * window.innerWidth
            const y     = (rand.nextFloat() * window.innerHeight + vy * frame) % window.innerHeight
            starContext.moveTo(x, y)
            starContext.arc(x, y, r, 0, Tau)
        }
        starContext.fill()
        frame++

        starContext.globalCompositeOperation = 'destination-out'
        const gradient = starContext.createLinearGradient(0, 0, 0, window.innerHeight)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 1.0)')
        starContext.fillStyle = gradient
        starContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    window.addEventListener('beforeunload', e => {
        console.log('save')
    })

    async function getUrl(path: String) {
        const response  = await fetch(`https://c2k1aw5nta.execute-api.us-east-1.amazonaws.com/prod/${path}`,
        {
            method: 'GET',
            headers: {
                'username': username,
                'password': password
            }
        })
        const result = await response.json()
        return result.url
    }

    async function logout() {
        const saveUrl   = await getUrl('save_url')
        const blob      = await game.saveToBlob()
        await fetch(saveUrl, {
            method: "PUT",
            body: blob
        })
    }

    async function attemptLogin() {
        username        = usernameInput.value
        password        = passwordInput.value

        if (username.length === 0 || password.length === 0) {
            errorMessage.style.opacity      = '1'
            return
        }

        const loadUrl   = await getUrl('load_url')

        if (loadUrl === '') {
            errorMessage.style.opacity      = '1'
        } else {
            usernameInput.value             = ''
            passwordInput.value             = ''
            errorMessage.style.opacity      = '0'
            const response                  = await fetch(loadUrl)
            const blob                      = await response.blob()
            await game.loadFromBlob(blob)
            screenManager.login()
        }
    }
})

// Linear congruential
class Random {
    private static A    = 1664525
    private static C    = 1013904223
    private static M    = Math.pow(2, 32)
    private seed        = 2817880113

    nextInt() {
        this.seed = (Random.A * this.seed + Random.C) % Random.M
        return this.seed
    }
    nextFloat() {
        return this.nextInt() / Random.M
    }
}
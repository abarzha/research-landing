import { regl } from './render'
import { draw } from './shaders/draw'
import { FFT } from './shaders/fft'
import { WPM } from './shaders/wpm'
import { SHAPE } from './shaders/shape'
import { sample } from './shaders/sample'
import { SmoothVar } from './smoothvar'

// FFT domain
const levels = 9
const N = 2 ** levels
const NH = Math.round(N / 4)

// Set canvas to fill viewport (cap at 1080p for performance)
function resizeCanvas() {
    regl._gl.canvas.width = Math.min(window.innerWidth, 1920)
    regl._gl.canvas.height = Math.min(window.innerHeight, 1080)
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const domain_size = 15
const dx = domain_size / N
const dz = domain_size / NH

let temp_fbo = regl.framebuffer({
    color: [
        regl.texture({ width: N, height: NH, format: "rgba", mag:"nearest", min:"nearest"}),
    ]
})

const rgb_fbos = ['r', 'g', 'b'].map(x => regl.framebuffer({
    color: [
        regl.texture({ width: N, height: NH, format: "rgba", mag:"nearest", min:"nearest" }),
    ]
}))

const rgb_fbos_mag = ['r', 'g', 'b'].map(x => regl.framebuffer({
    color: [
        regl.texture({ width: N, height: NH, format: "rgba", mag:"linear", min:"linear" }),
    ]
}))

// Clear initial state
rgb_fbos.map(x => x.use(function () {
    regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
    })
}))

// Mouse position — default to center
let mx = 0.5
let my = 0.5
let mouseActive = false   // true once user has moved the mouse
let autoTime = 0          // used for idle auto-sweep animation
let focalScreenY = 0      // focal point Y in viewport pixels (from top)
let scrollFactor = 0      // 0 = top, approaches 1 when scrolled down

const parameters = {
    // Fixed beam centered at x=0.5; mouse Y sets focal point position
    width: new SmoothVar(0.28, domain_size/N*2, 0.5),  // wider beam = more dramatic convergence
    power: new SmoothVar(0.1, 0.005, 1.2),  // much wider range for tighter focus
    colormode: new SmoothVar(1, 0, 1)       // 1 = RGB true-color mode
}

// Track scroll for scroll-linked physics
window.addEventListener('scroll', () => {
    scrollFactor = Math.min(1, window.scrollY / (window.innerHeight * 1.5))
})

let phase = 0

function update() {
    regl.poll()

    regl.clear({
        color: [0, 0, 0, 1],
    })

    for (let i = 0; i < 3; i++) {
        const wavelength = [0.63, 0.532, 0.47][i]
        const k0 = Math.PI * 2 / wavelength

        // Beam always centered at x=0.5; mouse position unused by shader
        let output = SHAPE(rgb_fbos[i], temp_fbo, NH, k0*domain_size,
            parameters.width.value,
            parameters.power.value * domain_size, 0.5, -1)
        rgb_fbos[i] = output[0]
        temp_fbo = output[1]

        output = FFT(rgb_fbos[i], temp_fbo, levels, N, 1)
        rgb_fbos[i] = output[0]
        temp_fbo = output[1]

        output = WPM(rgb_fbos[i], temp_fbo, N, k0, dz, dx)
        rgb_fbos[i] = output[0]
        temp_fbo = output[1]

        output = FFT(rgb_fbos[i], temp_fbo, levels, N, -1)
        rgb_fbos[i] = output[0]
        temp_fbo = output[1]

        rgb_fbos_mag[i].use(function () {
            regl.clear({ depth: 1 })
            sample({ texture: rgb_fbos[i] })
        })
    }

    draw({
        textureR: rgb_fbos_mag[0].color[0],
        textureG: rgb_fbos_mag[1].color[0],
        textureB: rgb_fbos_mag[2].color[0],
        phase: phase,
        colormode: parameters.colormode.value
    })

    phase = phase - Math.PI / 60
    phase = phase % (Math.PI * 2)

    // Idle auto-sweep: slowly oscillate focal point when mouse hasn't been used
    if (!mouseActive) {
        autoTime += 0.008
        my = 0.5 + Math.sin(autoTime * 0.7) * 0.45  // wider sweep range
    }

    // Map mouse Y to focal point: focal distance = (1 - my) * domain_size
    // power = 1 / focal_distance  =>  beam focuses at mouse Y position
    const focalDist = Math.max(0.2, (1 - my) * domain_size)

    // Scroll-linked physics: widen beam when scrolled for ambient background feel
    parameters.width.set(0.28 + scrollFactor * 0.15)
    parameters.power.set(1 / focalDist)

    // Expose focal point screen Y (viewport pixels from top)
    focalScreenY = (1 - my) * window.innerHeight

    for(let i in parameters){
        parameters[i].update()
    }
}

/** Returns current focal point Y in viewport pixels from top */
function getFocalY() {
    return focalScreenY
}

window.addEventListener('mousemove', (event) => {
    mouseActive = true
    const rect = regl._gl.canvas.getBoundingClientRect()
    my = 1 - (event.clientY - rect.top) / rect.height
})

// Touch support
const canvas = regl._gl.canvas
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(e) {
    e.preventDefault();
    mouseActive = true;
    const r = canvas.getBoundingClientRect();
    my = 1 - (e.touches[0].clientY - r.top) / r.height;
}

function handleTouchMove(e) {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    my = 1 - (e.touches[0].clientY - r.top) / r.height;
}

function handleTouchEnd(e) {
    e.preventDefault();
}

window.regl = regl
window.parameters = parameters

export { update, getFocalY }

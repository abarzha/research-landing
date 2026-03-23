import './style.scss'
import {regl} from './render'
import {update, getFocalY} from './interactive'
import {initAnimations} from './animations'

regl.frame(update)

// ── Cache DOM elements ──────────────────────────────────
const ring = document.getElementById('mouse-ring')
const cards = document.querySelectorAll('.project-card')
const heroText = document.querySelector('.hero-text')
const title = document.querySelector('h1')
const hint = document.querySelector('.hero-hint')
const scrollIndicator = document.querySelector('.scroll-indicator')

let ringX = window.innerWidth / 2
let ringY = window.innerHeight / 2
let targetX = ringX
let targetY = ringY
let hintHidden = false

// ── Kick off anime.js animations ────────────────────────
initAnimations()

// ── Mouse tracking ──────────────────────────────────────
window.addEventListener('mousemove', (e) => {
    targetX = e.clientX
    targetY = e.clientY
    ring.classList.add('visible')

    // Fade hint text on first interaction
    if (!hintHidden && hint) {
        hintHidden = true
        hint.classList.add('faded')
    }
})

// ── Scroll: fade out the scroll indicator ───────────────
window.addEventListener('scroll', () => {
    if (scrollIndicator) {
        const opacity = Math.max(0, 1 - window.scrollY / 200)
        scrollIndicator.style.opacity = opacity
        if (window.scrollY > 300) scrollIndicator.style.pointerEvents = 'none'
    }
})

// ── Combined animation loop: ring + glow effects ────────
;(function animate() {
    // Smooth mouse ring follower
    ringX += (targetX - ringX) * 0.12
    ringY += (targetY - ringY) * 0.12
    ring.style.left = ringX + 'px'
    ring.style.top = ringY + 'px'

    const focalY = getFocalY()

    // ── Card glow: illuminate cards near the focal point ──
    cards.forEach(card => {
        const rect = card.getBoundingClientRect()
        const cardCenterY = rect.top + rect.height / 2
        const distance = Math.abs(focalY - cardCenterY)
        const maxDist = 400
        const glow = Math.max(0, 1 - distance / maxDist)

        if (glow > 0.01) {
            const g = glow
            card.style.boxShadow =
                `0 0 ${g * 80}px ${g * 18}px rgba(126, 184, 255, ${g * 0.12}), ` +
                `0 0 ${g * 40}px ${g * 8}px rgba(180, 124, 255, ${g * 0.07}), ` +
                `inset 0 0 ${g * 30}px rgba(126, 184, 255, ${g * 0.05})`
            card.style.borderColor = `rgba(255, 255, 255, ${0.10 + g * 0.35})`
            card.style.background = `rgba(10, 10, 20, ${0.25 - g * 0.10})`
        } else {
            card.style.boxShadow = ''
            card.style.borderColor = ''
            card.style.background = ''
        }
    })

    // ── Hero text glow: brighten hero when beam passes ────
    if (heroText) {
        const rect = heroText.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const distance = Math.abs(focalY - centerY)
        const maxDist = 350
        const glow = Math.max(0, 1 - distance / maxDist)

        heroText.style.filter = glow > 0.01
            ? `brightness(${1 + glow * 0.7})`
            : ''

        // Drive the title bloom pseudo-element via CSS variable
        if (title) {
            title.style.setProperty('--title-glow', glow.toFixed(3))
        }
    }

    requestAnimationFrame(animate)
})()

import anime from 'animejs/lib/anime.es.js'

// ═══════════════════════════════════════════════════════════
//  anime.js animation system for the research landing page
// ═══════════════════════════════════════════════════════════

export function initAnimations() {
    setupHeroLetters()
    setupSubtitleTyping()

    // Wait two frames for layout to settle, then run everything
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            applyLetterGradients()
            runHeroTimeline()
            initScrollReveal()
            initInterests()
            initMagneticCards()
            initFloatingParticles()
        })
    })
}

// ─── Split h1 into individual letter spans ──────────────
function setupHeroLetters() {
    const title = document.querySelector('h1')
    const text = title.textContent.trim()
    title.textContent = ''

    // Split into words: first name on line 1, rest on line 2 (mobile only)
    const words = text.split(' ')

    words.forEach((word, wi) => {
        word.split('').forEach(ch => {
            const span = document.createElement('span')
            span.className = 'letter'
            span.textContent = ch
            title.appendChild(span)
        })

        if (wi === 0) {
            // After first name: mobile line break + desktop space
            const br = document.createElement('br')
            br.className = 'mobile-break'
            title.appendChild(br)

            const space = document.createElement('span')
            space.className = 'letter desktop-space'
            space.textContent = '\u00A0'
            title.appendChild(space)
        } else if (wi < words.length - 1) {
            const space = document.createElement('span')
            space.className = 'letter'
            space.textContent = '\u00A0'
            title.appendChild(space)
        }
    })
}

// ─── Apply continuous gradient across individual letters ─
function applyLetterGradients() {
    const title = document.querySelector('h1')
    const letters = title.querySelectorAll('.letter')
    const totalWidth = title.scrollWidth

    letters.forEach(letter => {
        const offset = letter.offsetLeft
        letter.style.backgroundImage =
            'linear-gradient(135deg, #ffffff 30%, #7eb8ff 70%, #b47cff 100%)'
        letter.style.backgroundSize = `${totalWidth}px 100%`
        letter.style.backgroundPosition = `-${offset}px 0`
        letter.style.webkitBackgroundClip = 'text'
        letter.style.webkitTextFillColor = 'transparent'
        letter.style.backgroundClip = 'text'
    })
}

// ─── Split subtitle into letter spans for typing effect ──
function setupSubtitleTyping() {
    const subtitle = document.querySelector('.hero-subtitle')
    const text = subtitle.textContent.trim()
    subtitle.textContent = ''

    text.split('').forEach(ch => {
        const span = document.createElement('span')
        span.className = 'sub-letter'
        span.textContent = ch
        subtitle.appendChild(span)
    })

    // Blinking cursor
    const cursor = document.createElement('span')
    cursor.className = 'typing-cursor'
    cursor.textContent = '|'
    subtitle.appendChild(cursor)
}

// ═══════════════════════════════════════════════════════════
//  1. HERO TIMELINE — orchestrated entrance sequence
// ═══════════════════════════════════════════════════════════
function runHeroTimeline() {
    const eyebrow = document.querySelector('.hero-eyebrow')
    const hint = document.querySelector('.hero-hint')
    const scrollIndicator = document.querySelector('.scroll-indicator')
    const cursor = document.querySelector('.typing-cursor')

    const tl = anime.timeline({ easing: 'easeOutExpo' })

    // Eyebrow: slide in from left + fade
    tl.add({
        targets: eyebrow,
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 900,
        delay: 300,
    })

    // Title letters: cascade in with 3D flip + wave stagger
    .add({
        targets: 'h1 .letter',
        opacity: [0, 1],
        translateY: [60, 0],
        rotateX: [80, 0],
        duration: 1400,
        delay: anime.stagger(40, { from: 'first' }),
        easing: 'easeOutExpo',
    }, '-=500')

    // Subtitle: typing effect — letters appear sequentially
    .add({
        targets: '.hero-subtitle .sub-letter',
        opacity: [0, 1],
        duration: 1,
        delay: anime.stagger(28),
        easing: 'steps(1)',
    }, '-=600')

    // Fade cursor after typing, then hide
    .add({
        targets: cursor,
        opacity: [1, 0],
        duration: 800,
        delay: 1200,
        easing: 'easeInQuad',
    })

    // Hint text fades in
    .add({
        targets: hint,
        opacity: [0, 0.30],
        duration: 1200,
        easing: 'easeInOutSine',
    }, '-=2000')

    // Scroll indicator
    .add({
        targets: scrollIndicator,
        opacity: [0, 0.35],
        translateY: [-15, 0],
        duration: 800,
    }, '-=1000')
}

// ═══════════════════════════════════════════════════════════
//  2. SCROLL-TRIGGERED REVEALS — cards + section titles
// ═══════════════════════════════════════════════════════════
function initScrollReveal() {
    const cards = document.querySelectorAll('.project-card')
    const sectionTitles = document.querySelectorAll('.section-title')

    // All section titles: slide from left on scroll into view
    sectionTitles.forEach(sectionTitle => {
        sectionTitle.style.opacity = '0'
        sectionTitle.style.transform = 'translateX(-40px)'

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    anime({
                        targets: sectionTitle,
                        opacity: [0, 1],
                        translateX: [-40, 0],
                        duration: 1000,
                        easing: 'easeOutExpo',
                    })
                    obs.unobserve(entry.target)
                }
            })
        }, { threshold: 0.3 })
        obs.observe(sectionTitle)
    })

    // Cards: spring physics entrance with stagger
    // Set initial hidden state
    cards.forEach(card => {
        card.style.opacity = '0'
        card.style.transform = 'translateY(70px) scale(0.90)'
    })

    let revealed = false
    const cardObs = new IntersectionObserver((entries) => {
        if (revealed) return
        const anyVisible = entries.some(e => e.isIntersecting)
        if (anyVisible) {
            revealed = true
            anime({
                targets: Array.from(cards),
                opacity: [0, 1],
                translateY: [70, 0],
                scale: [0.90, 1],
                rotateX: [8, 0],
                duration: 1200,
                delay: anime.stagger(80, { from: 'first' }),
                easing: 'spring(1, 80, 12, 0)',
                complete: () => {
                    // Clean up inline transforms so CSS hover still works
                    cards.forEach(card => {
                        card.style.transform = ''
                        card.style.opacity = ''
                    })
                }
            })
            cards.forEach(c => cardObs.unobserve(c))
        }
    }, { threshold: 0.05 })

    cards.forEach(card => cardObs.observe(card))
}

// ═══════════════════════════════════════════════════════════
//  3. RESEARCH INTERESTS — editorial list with counters
// ═══════════════════════════════════════════════════════════
function initInterests() {
    const items = document.querySelectorAll('.interest-item')
    if (!items.length) return

    // Set initial hidden state: number faded, body offset
    items.forEach((item, i) => {
        const num = item.querySelector('.interest-num')
        const body = item.querySelector('.interest-body')
        const isEven = i % 2 === 1

        num.style.opacity = '0'
        body.style.opacity = '0'
        // Alternate direction: odd items from left, even from right
        body.style.transform = isEven ? 'translateX(40px)' : 'translateX(-40px)'
    })

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            const item = entry.target
            const num = item.querySelector('.interest-num')
            const body = item.querySelector('.interest-body')
            const targetVal = parseInt(item.dataset.num, 10)
            const isEven = [...items].indexOf(item) % 2 === 1

            // 1. Trigger the CSS border draw
            item.classList.add('revealed')

            // 2. Counter: count up from 0 to target number
            const counter = { val: 0 }
            anime({
                targets: counter,
                val: targetVal,
                duration: 900,
                delay: 150,
                easing: 'easeOutQuart',
                round: 1,
                update: () => {
                    num.textContent = String(Math.round(counter.val)).padStart(2, '0')
                },
            })

            // 3. Number fade in
            anime({
                targets: num,
                opacity: [0, 1],
                duration: 600,
                delay: 100,
                easing: 'easeOutQuad',
            })

            // 4. Body slides in from alternating direction
            anime({
                targets: body,
                opacity: [0, 1],
                translateX: [isEven ? 40 : -40, 0],
                duration: 800,
                delay: 250,
                easing: 'easeOutExpo',
                complete: () => { body.style.transform = '' }
            })

            obs.unobserve(item)
        })
    }, { threshold: 0.25 })

    items.forEach(item => obs.observe(item))
}

// ═══════════════════════════════════════════════════════════
//  4. MAGNETIC 3D CARD TILT — cards tilt toward cursor
// ═══════════════════════════════════════════════════════════
function initMagneticCards() {
    const cards = document.querySelectorAll('.project-card')

    cards.forEach(card => {
        let currentAnim = null

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 to 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5

            const tiltX = y * -12   // degrees (inverted for natural feel)
            const tiltY = x * 12

            if (currentAnim) currentAnim.pause()
            currentAnim = anime({
                targets: card,
                rotateX: tiltX,
                rotateY: tiltY,
                scale: 1.03,
                duration: 300,
                easing: 'easeOutQuad',
            })
        })

        card.addEventListener('mouseleave', () => {
            if (currentAnim) currentAnim.pause()
            currentAnim = anime({
                targets: card,
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                duration: 800,
                easing: 'easeOutElastic(1, .4)',
            })
        })
    })
}

// ═══════════════════════════════════════════════════════════
//  4. FLOATING PARTICLES — luminous drifting dots
// ═══════════════════════════════════════════════════════════
function initFloatingParticles() {
    const container = document.createElement('div')
    container.className = 'particles-container'
    document.body.appendChild(container)

    const colors = [
        'rgba(126, 184, 255, 0.6)',  // accent blue
        'rgba(180, 124, 255, 0.5)',  // accent purple
        'rgba(255, 255, 255, 0.4)',  // white
    ]

    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div')
        p.className = 'particle'
        const size = Math.random() * 3 + 1.5
        p.style.width = size + 'px'
        p.style.height = size + 'px'
        p.style.left = Math.random() * 100 + 'vw'
        p.style.top = Math.random() * 100 + 'vh'
        p.style.background = colors[i % colors.length]
        p.style.boxShadow = `0 0 ${size * 3}px ${p.style.background}`
        container.appendChild(p)

        driftParticle(p)
    }
}

function driftParticle(el) {
    const dur = anime.random(10000, 22000)

    anime({
        targets: el,
        translateX: () => anime.random(-180, 180),
        translateY: () => anime.random(-180, 180),
        opacity: [
            { value: [0, anime.random(15, 50) / 100], duration: dur * 0.3, easing: 'easeInSine' },
            { value: 0, duration: dur * 0.3, delay: dur * 0.4, easing: 'easeOutSine' },
        ],
        scale: [
            { value: [0.3, anime.random(8, 18) / 10], duration: dur * 0.5 },
            { value: 0.3, duration: dur * 0.5 },
        ],
        duration: dur,
        easing: 'easeInOutSine',
        complete: () => {
            // Respawn at a new random position
            el.style.left = Math.random() * 100 + 'vw'
            el.style.top = Math.random() * 100 + 'vh'
            driftParticle(el)
        },
    })
}

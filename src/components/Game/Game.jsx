import { useEffect, useRef, useState, useCallback } from 'react'
import {
  COIN_CONFIG, GOOD_TYPES, BAD_TYPES,
  GRAVITY, COIN_RADIUS, SPAWN_INTERVAL_MS, MAX_COINS,
  GOOD_SCORE, BAD_PENALTY, BAD_COIN_CHANCE, WINDOW_MS, GAME_DURATION,
} from './constants'

// ─── Canvas-drawn fallback god (used when image not loaded) ───────────────────
function drawFortuneGod(ctx, cx, cy, size, t) {
  const s = size / 160
  const bob = Math.sin(t * 0.002) * 2

  ctx.save()
  ctx.translate(cx, cy + bob)
  ctx.scale(s, s)

  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur  = 30
  ctx.beginPath()
  ctx.ellipse(0, 72, 52, 10, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 215, 0, 0.10)'
  ctx.fill()
  ctx.shadowBlur = 0

  const bodyGrad = ctx.createLinearGradient(-50, -30, 50, 70)
  bodyGrad.addColorStop(0, '#EE2200')
  bodyGrad.addColorStop(1, '#991100')
  ctx.beginPath()
  ctx.ellipse(0, 22, 52, 58, 0, 0, Math.PI * 2)
  ctx.fillStyle = bodyGrad
  ctx.fill()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 2.5
  ctx.stroke()

  ctx.beginPath()
  ctx.rect(-48, 12, 96, 9)
  ctx.fillStyle = '#FFD700'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, -5, 16, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD700'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur  = 10
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle    = '#992200'
  ctx.font         = 'bold 18px serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('財', 0, -5)

  ctx.beginPath()
  ctx.moveTo(-38, -12)
  ctx.quadraticCurveTo(-62, -4, -72, 5)
  ctx.strokeStyle = '#DD1100'
  ctx.lineWidth   = 15
  ctx.lineCap     = 'round'
  ctx.stroke()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(38, -12)
  ctx.quadraticCurveTo(62, -4, 72, 5)
  ctx.strokeStyle = '#DD1100'
  ctx.lineWidth   = 15
  ctx.lineCap     = 'round'
  ctx.stroke()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(-72, 5, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#F5C97A'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-72, 5, 9, 6, -0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD700'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur  = 14
  ctx.fill()
  ctx.shadowBlur  = 0
  ctx.strokeStyle = '#AA8800'
  ctx.lineWidth   = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(72, 5, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#F5C97A'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(72, 5, 9, 6, 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD700'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur  = 14
  ctx.fill()
  ctx.shadowBlur  = 0
  ctx.strokeStyle = '#AA8800'
  ctx.lineWidth   = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, -37, 14, 0, Math.PI * 2)
  ctx.fillStyle = '#F5C97A'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, -60, 28, 0, Math.PI * 2)
  ctx.fillStyle = '#F5C97A'
  ctx.fill()
  ctx.strokeStyle = '#D4A050'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.globalAlpha = 0.35
  ctx.fillStyle   = '#FF5533'
  ctx.beginPath(); ctx.ellipse(-18, -55, 7, 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse( 18, -55, 7, 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  ctx.beginPath()
  ctx.moveTo(-15, -44)
  ctx.bezierCurveTo(-20, -15, -18, 15, -10, 35)
  ctx.bezierCurveTo(0, 45, 10, 35, 10, 35)
  ctx.bezierCurveTo(18, 15, 20, -15, 15, -44)
  ctx.closePath()
  ctx.fillStyle = '#F0EEE8'
  ctx.fill()
  ctx.strokeStyle = '#CCCCCC'
  ctx.lineWidth   = 1
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.moveTo(i * 7, -42)
    ctx.quadraticCurveTo(i * 9, 0, i * 6, 32)
    ctx.stroke()
  }

  ctx.strokeStyle = '#553300'
  ctx.lineWidth   = 3.5
  ctx.lineCap     = 'round'
  ctx.beginPath()
  ctx.moveTo(-20, -74); ctx.quadraticCurveTo(-12, -79, -4, -74)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(4, -74); ctx.quadraticCurveTo(12, -79, 20, -74)
  ctx.stroke()

  ctx.strokeStyle = '#333333'
  ctx.lineWidth   = 2.5
  ctx.beginPath()
  ctx.arc(-12, -66, 5, Math.PI + 0.4, -0.4)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc( 12, -66, 5, Math.PI + 0.4, -0.4)
  ctx.stroke()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath(); ctx.arc(-10, -68, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 14, -68, 1.5, 0, Math.PI * 2); ctx.fill()

  ctx.beginPath()
  ctx.arc(0, -58, 12, 0.25, Math.PI - 0.25)
  ctx.strokeStyle = '#AA5522'
  ctx.lineWidth   = 2.5
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(0, -86, 28, 6, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1A0800'
  ctx.fill()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-19, -86)
  ctx.lineTo(-12, -125)
  ctx.lineTo( 12, -125)
  ctx.lineTo( 19, -86)
  ctx.closePath()
  ctx.fillStyle = '#1A0800'
  ctx.fill()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-16, -100); ctx.lineTo(16, -100)
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth   = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, -125, 8, 0, Math.PI * 2)
  ctx.fillStyle   = '#FFD700'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur  = 16
  ctx.fill()
  ctx.shadowBlur  = 0

  const sparkPhase = (t * 0.003) % (Math.PI * 2)
  ;[[-72, 5], [72, 5]].forEach(([sx, sy], i) => {
    const a = sparkPhase + i * Math.PI
    ctx.fillStyle   = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 8
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a * 2)
    ctx.font        = `${10 + 3 * Math.sin(a)}px serif`
    ctx.textAlign   = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✦', sx + Math.cos(a) * 16, sy + Math.sin(a) * 10 - 12)
    ctx.fillText('✦', sx - Math.cos(a) * 14, sy - Math.sin(a) * 8 - 20)
    ctx.globalAlpha = 1
    ctx.shadowBlur  = 0
  })

  ctx.restore()
}

// ─── Throw arm overlay ────────────────────────────────────────────────────────

function drawThrowArm(ctx, hx, hy, isLeft, throwT, now, t) {
  const age   = now - throwT
  const phase = Math.min(age / 600, 1)

  // Idle vertical float — opposite phase for each hand, large amplitude
  const idleFloat = Math.sin(t * 0.0020 + (isLeft ? 0 : Math.PI)) * 26
  const idleX = hx
  const idleY = hy + idleFloat

  let armX, armY

  ctx.save()

  if (phase >= 1) {
    // ── Idle: glowing fist bobbing up/down ────────────────────────────────
    armX = idleX
    armY = idleY
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 14
    ctx.fillStyle   = '#F5C97A'
    ctx.beginPath()
    ctx.arc(armX, armY, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    // knuckle lines
    for (let i = 0; i < 4; i++) {
      const kx = armX + (i - 1.5) * 5
      ctx.strokeStyle = '#C8965A'
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.arc(kx, armY - 7, 2.5, Math.PI, 0)
      ctx.stroke()
    }
  } else if (phase < 0.25) {
    // ── Windup: hand raises UP clearly ────────────────────────────────────
    const p    = phase / 0.25
    const ease = p * p
    const pullX = (isLeft ? 1 : -1) * ease * 22   // slight inward
    const liftY = -ease * 46                        // raise UP significantly
    armX = idleX + pullX
    armY = idleY + liftY

    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 18
    ctx.fillStyle   = '#F5C97A'
    ctx.beginPath()
    ctx.arc(armX, armY, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.font         = '16px serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha  = 0.9
    ctx.fillText('🤙', armX, armY)
    ctx.globalAlpha  = 1

  } else if (phase < 0.55) {
    // ── Release: hand swings DOWN and OUT ─────────────────────────────────
    const p    = (phase - 0.25) / 0.30
    const ease = 1 - (1 - p) * (1 - p)
    const thrust = ease * 72
    // Arc: starts raised (-46) then swings down (+22) as it extends outward
    armX = idleX + (isLeft ? -1 : 1) * thrust
    armY = idleY + (-46 * (1 - ease)) + (22 * ease)

    // Speed lines behind hand
    ctx.globalAlpha = (1 - p) * 0.75
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth   = 2.5
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 8
    for (let i = 0; i < 6; i++) {
      const angle = (isLeft ? Math.PI : 0) + (i - 2.5) * 0.17
      const len   = 16 + i * 9
      ctx.beginPath()
      ctx.moveTo(armX + Math.cos(angle) * 12, armY + Math.sin(angle) * 12)
      ctx.lineTo(armX + Math.cos(angle) * (12 + len), armY + Math.sin(angle) * (12 + len))
      ctx.stroke()
    }
    ctx.shadowBlur  = 0
    ctx.globalAlpha = 1

    // Open hand (palm + fingers)
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 22
    ctx.fillStyle   = '#F5C97A'
    ctx.beginPath()
    ctx.ellipse(armX, armY, 13, 10, isLeft ? 0.4 : -0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#C8965A'
    ctx.lineWidth   = 4
    ctx.lineCap     = 'round'
    for (let i = 0; i < 4; i++) {
      const base = (isLeft ? -0.9 : -2.2) + i * 0.6
      ctx.beginPath()
      ctx.moveTo(armX + Math.cos(base) * 10, armY + Math.sin(base) * 8)
      ctx.lineTo(armX + Math.cos(base) * 22, armY + Math.sin(base) * 17)
      ctx.stroke()
    }

    // Star flash at release peak
    if (p > 0.6) {
      ctx.globalAlpha  = (p - 0.6) / 0.4
      ctx.fillStyle    = '#FFD700'
      ctx.font         = '20px serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor  = '#FFD700'
      ctx.shadowBlur   = 14
      ctx.fillText('✦', armX + (isLeft ? -24 : 24), armY - 18)
      ctx.fillText('✦', armX + (isLeft ? -8 : 8), armY + 20)
      ctx.shadowBlur  = 0
      ctx.globalAlpha = 1
    }

  } else {
    // ── Recoil: elastic snap back ──────────────────────────────────────────
    const p      = (phase - 0.55) / 0.45
    const bounce = Math.sin(p * Math.PI) * 0.35
    const frac   = 1 - p
    armX = idleX + (isLeft ? -1 : 1) * frac * 72 * (1 + bounce)
    armY = idleY + frac * 22

    ctx.fillStyle   = '#F5C97A'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur  = 8
    ctx.beginPath()
    ctx.arc(armX, armY, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

// ─── God scene (image + overlays) ─────────────────────────────────────────────

const SPEECH_TEXTS = ['六!', '七!', '財!', 'YEET!', '哈哈!', '✨']

function drawGodScene(ctx, img, throwAnims, cx, cy, size, t, remaining, scaleX = 1, scaleY = 1) {
  if (!img) {
    drawFortuneGod(ctx, cx, cy, size, t)
    return
  }

  const imgH  = size * 1.8
  const imgW  = imgH * (img.naturalWidth / img.naturalHeight)
  const bobY  = Math.sin(t * 0.0025) * 6
  const sway  = Math.sin(t * 0.0015) * 0.025

  // ── Glow aura behind god ──────────────────────────────────────────────────
  ctx.save()
  ctx.translate(cx, cy + bobY)
  const aura = ctx.createRadialGradient(0, -imgH * 0.5, imgH * 0.05, 0, -imgH * 0.5, imgH * 0.65)
  aura.addColorStop(0, 'rgba(255, 215, 0, 0.18)')
  aura.addColorStop(0.6, 'rgba(255, 160, 0, 0.07)')
  aura.addColorStop(1, 'rgba(255, 100, 0, 0)')
  ctx.fillStyle = aura
  ctx.beginPath()
  ctx.ellipse(0, -imgH * 0.5, imgW * 0.6, imgH * 0.65, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Draw the god image on canvas ──────────────────────────────────────────
  ctx.save()
  ctx.translate(cx, cy + bobY)
  ctx.rotate(sway)
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(img, -imgW / 2, -imgH, imgW, imgH)
  ctx.restore()

  // ── Sweat drop (last 3 s) ─────────────────────────────────────────────────
  if (remaining > 0 && remaining < 3000) {
    const sweatAlpha = Math.min(1, (3000 - remaining) / 1000)
    const sx = cx + imgW * 0.18
    const sy = cy - imgH * 0.82 + bobY
    ctx.save()
    ctx.globalAlpha = sweatAlpha * (0.7 + 0.3 * Math.sin(t * 0.008))
    ctx.fillStyle = '#60D0FF'
    ctx.shadowColor = '#60D0FF'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(sx, sy, 5, Math.PI, 0)
    ctx.bezierCurveTo(sx + 5, sy + 10, sx - 5, sy + 10, sx, sy)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // ── Speech bubbles on throw ───────────────────────────────────────────────
  const headY = cy - imgH * 0.9 + bobY
  const headX = cx + imgW * 0.25      // offset to right of head

  for (const [side, anim] of [['left', throwAnims.left], ['right', throwAnims.right]]) {
    const age   = t - anim.t
    const phase = age / 550
    if (phase >= 0 && phase < 0.55) {
      const fadeIn  = Math.min(age / 80, 1)
      const fadeOut = phase > 0.35 ? 1 - (phase - 0.35) / 0.2 : 1
      const alpha   = fadeIn * fadeOut
      const offsetX = side === 'left' ? -imgW * 0.15 : imgW * 0.15
      const bx = headX + offsetX
      const by = headY - 10

      ctx.save()
      ctx.globalAlpha = alpha
      // Bubble background
      const tw = 52, th = 26, br = 8
      ctx.fillStyle   = '#FFFFFF'
      ctx.strokeStyle = '#222222'
      ctx.lineWidth   = 2
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur  = 4
      ctx.beginPath()
      ctx.roundRect(bx - tw / 2, by - th / 2, tw, th, br)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0
      // Bubble tail
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(bx - 6, by + th / 2)
      ctx.lineTo(bx + 4, by + th / 2)
      ctx.lineTo(bx - 2, by + th / 2 + 8)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#222222'
      ctx.lineWidth   = 1.5
      ctx.stroke()
      // Text
      ctx.fillStyle    = '#111111'
      ctx.font         = 'bold 14px serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(anim.text, bx, by)
      ctx.restore()
    }
  }

  // ── Arm overlays ─────────────────────────────────────────────────────────
  // Hand positions matching Caishen image anatomy
  const rightHandX = cx + imgW * 0.32
  const rightHandY = cy - imgH * 0.64 + bobY   // upper (raised OK gesture)
  const leftHandX  = cx - imgW * 0.42
  const leftHandY  = cy - imgH * 0.40 + bobY   // lower (ingot hand)

  drawThrowArm(ctx, leftHandX,  leftHandY,  true,  throwAnims.left.t,  t, t)
  drawThrowArm(ctx, rightHandX, rightHandY, false, throwAnims.right.t, t, t)
}

// ─── Particle burst on coin click ─────────────────────────────────────────────

const BURST_COLORS_GOOD = ['#FFD700', '#A78BFA', '#60EFFF', '#FFFFFF']
const BURST_COLORS_BAD  = ['#FF4444', '#FF8800', '#FFDD00', '#FF2222']

function spawnBurst(particles, x, y, isGood) {
  const colors = isGood ? BURST_COLORS_GOOD : BURST_COLORS_BAD
  const count  = isGood ? 12 : 10

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    const speed = 120 + Math.random() * 220
    particles.push({
      x, y,
      vx:     Math.cos(angle) * speed,
      vy:     Math.sin(angle) * speed - 60,
      life:   1.0,
      decay:  0.0018 + Math.random() * 0.001,
      color:  colors[Math.floor(Math.random() * colors.length)],
      radius: 3 + Math.random() * 4,
    })
  }

  particles.push({
    x, y,
    vx: 0, vy: 0,
    life: 1.0, decay: 0.004,
    color: isGood ? '#A78BFA' : '#FF4444',
    radius: 0,
    isRing: true,
    maxRadius: COIN_RADIUS * 2.2,
  })
}

// ─── Coin helpers ──────────────────────────────────────────────────────────────

let _coinId = 0

function makeCoin(handX, handY, isLeft) {
  const isBad = Math.random() < BAD_COIN_CHANCE
  const pool  = isBad ? BAD_TYPES : GOOD_TYPES
  const type  = pool[Math.floor(Math.random() * pool.length)]

  // Both hands throw mostly upward — arcs up then falls with gravity
  const angle = isLeft
    ? -Math.PI * 0.95 + Math.random() * (Math.PI * 0.55)   // left: upper-left arc
    : -Math.PI * 0.60 + Math.random() * (Math.PI * 0.55)   // right: upper-right arc

  const speed = 520 + Math.random() * 340

  return {
    id:            _coinId++,
    type,
    x:             handX,
    y:             handY,
    vx:            Math.cos(angle) * speed,
    vy:            Math.sin(angle) * speed,
    rotation:      Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 6,
    radius:        COIN_RADIUS,
    isGood:        !isBad,
  }
}

function renderCoin(ctx, coin) {
  const cfg = COIN_CONFIG[coin.type]
  ctx.save()
  ctx.translate(coin.x, coin.y)
  ctx.rotate(coin.rotation)

  ctx.shadowColor = cfg.glow
  ctx.shadowBlur  = 20
  ctx.beginPath()
  ctx.arc(0, 0, coin.radius, 0, Math.PI * 2)
  ctx.fillStyle = cfg.bg
  ctx.fill()

  ctx.strokeStyle = cfg.glow
  ctx.lineWidth   = 2
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(-coin.radius * 0.25, -coin.radius * 0.3, coin.radius * 0.33, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.13)'
  ctx.fill()

  ctx.fillStyle    = '#fff'
  ctx.font         = `bold ${Math.round(coin.radius * 0.82)}px monospace`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cfg.symbol, 0, 0)

  if (!coin.isGood) {
    ctx.strokeStyle = '#FF4444'
    ctx.lineWidth   = 2.5
    const hw = coin.radius * 0.48
    ctx.beginPath()
    ctx.moveTo(-hw, -coin.radius + 9)
    ctx.lineTo( hw, -coin.radius + 9)
    ctx.stroke()
  }

  ctx.restore()
}

function renderTimer(ctx, elapsed, cx) {
  const remaining = Math.max(0, GAME_DURATION - elapsed)
  const seconds   = Math.ceil(remaining / 1000)
  const progress  = remaining / GAME_DURATION
  const r = 28, ty = 52
  const isLow = remaining < 3000

  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth   = 5
  ctx.beginPath()
  ctx.arc(cx, ty, r, -Math.PI / 2, Math.PI * 1.5)
  ctx.stroke()

  const color = isLow ? '#FF4444' : '#A78BFA'
  ctx.strokeStyle = color
  ctx.lineWidth   = 5
  ctx.shadowColor = color
  ctx.shadowBlur  = isLow ? 14 : 6
  ctx.beginPath()
  ctx.arc(cx, ty, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur  = 0

  ctx.fillStyle    = isLow ? '#FF4444' : '#111'
  ctx.font         = 'bold 20px monospace'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(seconds, cx, ty)
  ctx.restore()
}

// ─── Component ────────────────────────────────────────────────────────────────

const INITIAL_STATS = {
  score: 0, totalClicked: 0, goodClicked: 0, badClicked: 0, phase: 'idle',
}

export default function Game() {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)

  const coinsRef      = useRef([])
  const particlesRef  = useRef([])
  const statsRef      = useRef({ ...INITIAL_STATS })
  const clickTsRef    = useRef([])
  const spawnTimerRef = useRef(0)
  const badFlashRef   = useRef(0)
  const popupsRef     = useRef([])
  const gameStartRef  = useRef(0)
  const godImgRef     = useRef(null)
  const throwAnimRef  = useRef({
    left:  { t: -9999, text: '六!' },
    right: { t: -9999, text: '七!' },
  })

  const [uiStats,     setUiStats]     = useState({ ...INITIAL_STATS })
  const [eventsIn10s, setEventsIn10s] = useState(0)

  const syncUI = useCallback(() => {
    const now = Date.now()
    setUiStats({ ...statsRef.current })
    setEventsIn10s(clickTsRef.current.filter(t => now - t < WINDOW_MS).length)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      clickTsRef.current = clickTsRef.current.filter(t => now - t < WINDOW_MS)
      setEventsIn10s(clickTsRef.current.length)
    }, 500)
    return () => clearInterval(id)
  }, [])

  const startGame = useCallback(() => {
    _coinId               = 0
    coinsRef.current      = []
    particlesRef.current  = []
    clickTsRef.current    = []
    spawnTimerRef.current = 0
    badFlashRef.current   = 0
    popupsRef.current     = []
    gameStartRef.current  = performance.now()
    throwAnimRef.current  = {
      left:  { t: -9999, text: '六!' },
      right: { t: -9999, text: '七!' },
    }
    statsRef.current      = { ...INITIAL_STATS, phase: 'playing' }
    syncUI()
  }, [syncUI])

  // ── RAF loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Load fortune god image
    const img = new Image()
    img.src = '/fortune-god.png'
    img.onload = () => { godImgRef.current = img }

    function resize() {
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let rafId
    let lastTs = 0

    function loop(ts) {
      const cv = canvasRef.current
      if (!cv) return
      const ctx = cv.getContext('2d')
      const w   = cv.width
      const h   = cv.height
      const dt  = Math.min(ts - lastTs, 50)
      lastTs    = ts
      const now = performance.now()
      const gs  = statsRef.current

      // God geometry
      const godX    = w / 2
      const godY    = h * 0.78
      const godSize = Math.min(w * 0.28, h * 0.38, 240)

      const godImg   = godImgRef.current
      const imgH     = godSize * 1.8
      const imgW     = godImg ? imgH * (godImg.naturalWidth / godImg.naturalHeight) : godSize
      const bobY     = Math.sin(now * 0.0025) * 6
      const lPhase   = Math.min((now - throwAnimRef.current.left.t)  / 550, 1)
      const rPhase   = Math.min((now - throwAnimRef.current.right.t) / 550, 1)
      const throwing = lPhase < 1 || rPhase < 1
      const scaleX   = throwing ? 1.05 : 1
      const scaleY   = throwing ? 0.95 : 1

      // Asymmetric hand positions matching Caishen image:
      // Right hand: raised upper area (OK gesture / throwing)
      // Left hand: lower, holding ingot
      const leftHandX  = godX - imgW * 0.42
      const leftHandY  = godY - imgH * 0.40 + bobY
      const rightHandX = godX + imgW * 0.32
      const rightHandY = godY - imgH * 0.64 + bobY

      // ── Update ──────────────────────────────────────────────────────────
      const elapsed   = gs.phase === 'playing' ? now - gameStartRef.current : 0
      const remaining = Math.max(0, GAME_DURATION - elapsed)

      if (gs.phase === 'playing') {
        if (elapsed >= GAME_DURATION) {
          gs.phase = 'gameover'
          coinsRef.current = []
          syncUI()
        } else {
          spawnTimerRef.current += dt
          while (spawnTimerRef.current >= SPAWN_INTERVAL_MS && coinsRef.current.length < MAX_COINS) {
            spawnTimerRef.current -= SPAWN_INTERVAL_MS
            const isLeft = (_coinId % 2 === 0)
            const hx = isLeft ? leftHandX : rightHandX
            const hy = isLeft ? leftHandY : rightHandY
            // Record throw animation + pick speech text
            const texts = SPEECH_TEXTS
            throwAnimRef.current[isLeft ? 'left' : 'right'] = {
              t:    now,
              text: texts[Math.floor(Math.random() * texts.length)],
            }
            coinsRef.current.push(makeCoin(hx, hy, isLeft))
          }

          const s = dt / 1000
          for (const c of coinsRef.current) {
            c.vy       += GRAVITY * s
            c.x        += c.vx * s
            c.y        += c.vy * s
            c.rotation += c.rotationSpeed * s
          }
          coinsRef.current = coinsRef.current.filter(
            c => c.y - c.radius < h + 80 &&
                 c.x + c.radius > -80 &&
                 c.x - c.radius < w + 80
          )
        }
      }

      // Particles (always update)
      for (const p of particlesRef.current) {
        p.life -= p.decay * dt
        if (!p.isRing) {
          p.vx *= Math.pow(0.92, dt / 16)
          p.vy += 300 * (dt / 1000)
          p.x  += p.vx * (dt / 1000)
          p.y  += p.vy * (dt / 1000)
        }
      }
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)

      // ── Render ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(100, 80, 200, 0.05)'
      ctx.lineWidth   = 1
      for (let x = 0; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      // God scene (image + arm overlays + speech bubbles)
      drawGodScene(ctx, godImg, throwAnimRef.current, godX, godY, godSize, now, remaining, scaleX, scaleY)

      // Coins
      for (const c of coinsRef.current) renderCoin(ctx, c)

      // Particles + shockwave rings
      for (const p of particlesRef.current) {
        ctx.save()
        ctx.globalAlpha = p.life
        if (p.isRing) {
          const r = p.maxRadius * (1 - p.life)
          ctx.strokeStyle = p.color
          ctx.lineWidth   = 2.5
          ctx.shadowColor = p.color
          ctx.shadowBlur  = 8
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.fillStyle   = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur  = 8
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // Score popups
      popupsRef.current = popupsRef.current.filter(p => now - p.t < 700)
      for (const p of popupsRef.current) {
        const age = (now - p.t) / 700
        ctx.save()
        ctx.globalAlpha  = 1 - age
        ctx.fillStyle    = p.isGood ? '#A78BFA' : '#FF5555'
        ctx.font         = 'bold 22px monospace'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.text, p.x, p.y - age * 60)
        ctx.restore()
      }

      if (gs.phase === 'playing') {
        renderTimer(ctx, elapsed, w / 2)
      }

      const flashAge = now - badFlashRef.current
      if (flashAge < 400) {
        ctx.fillStyle = `rgba(255,30,30,${(1 - flashAge / 400) * 0.32})`
        ctx.fillRect(0, 0, w, h)
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    function onPointerDown(e) {
      if (statsRef.current.phase !== 'playing') return
      const rect = canvas.getBoundingClientRect()
      const px   = e.clientX - rect.left
      const py   = e.clientY - rect.top
      const now  = performance.now()

      let hit = false
      coinsRef.current = coinsRef.current.filter(c => {
        if (Math.hypot(px - c.x, py - c.y) >= c.radius) return true
        hit = true
        const gs = statsRef.current
        gs.totalClicked++
        clickTsRef.current.push(Date.now())

        if (c.isGood) {
          gs.goodClicked++
          gs.score += GOOD_SCORE
          spawnBurst(particlesRef.current, c.x, c.y, true)
          popupsRef.current.push({ x: c.x, y: c.y, text: `+${GOOD_SCORE}`, t: now, isGood: true })
        } else {
          gs.badClicked++
          gs.score = Math.max(0, gs.score - BAD_PENALTY)
          badFlashRef.current = now
          spawnBurst(particlesRef.current, c.x, c.y, false)
          popupsRef.current.push({ x: c.x, y: c.y, text: `-${BAD_PENALTY}`, t: now, isGood: false })
        }
        return false
      })
      if (hit) syncUI()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('pointerdown', onPointerDown)
      ro.disconnect()
    }
  }, [syncUI])

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-screen h-screen bg-white overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ touchAction: 'none', cursor: 'crosshair' }}
      />

      {/* HUD */}
      <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-10">
        <div className="bg-white/90 border border-gray-100 rounded-2xl px-5 py-4 backdrop-blur-md shadow-sm shadow-black/5 min-w-[140px]">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Score</div>
          <div className="text-gray-900 text-4xl font-bold font-mono tabular-nums leading-none">{uiStats.score}</div>
          <div className="flex gap-4 mt-3 text-xs font-mono">
            <span className="text-green-600 font-medium">🟢 {uiStats.goodClicked}</span>
            <span className="text-red-500 font-medium">🔴 {uiStats.badClicked}</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="bg-white/90 border border-gray-100 rounded-2xl px-5 py-4 backdrop-blur-md shadow-sm shadow-black/5 text-right min-w-[140px]">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Clicks / 10s</div>
          <div className="text-yellow-500 text-4xl font-bold font-mono tabular-nums leading-none">{eventsIn10s}</div>
          <div className="text-gray-400 text-xs font-mono mt-3">{uiStats.totalClicked} total clicks</div>
        </div>
      </div>

      {/* Idle */}
      {uiStats.phase === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8 bg-white/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-500 mb-6">Tap to Collect</div>
          <h1 className="text-6xl font-bold font-mono mb-4 text-center leading-tight">
            <span className="text-yellow-500">Fortune</span>{' '}
            <span className="text-purple-600">Ninja</span>
          </h1>
          <p style={{ marginBottom: '32px' }} className="text-gray-600 text-sm text-center max-w-xs leading-relaxed">
            The Fortune God throws coins — click the good ones before time runs out!
          </p>
          <button
            onClick={startGame}
            style={{ padding: '12px 28px' }}
            className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 active:scale-95
                       text-black font-bold rounded-xl text-base transition-all
                       shadow-lg shadow-yellow-400/40 hover:shadow-yellow-400/60"
          >
            START GAME
          </button>
          <div style={{ marginTop: '32px' }} className="text-gray-400 text-xs tracking-widest">⏱ 10 SECONDS</div>
        </div>
      )}

      {/* Game Over */}
      {uiStats.phase === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-20 px-8">
          <div className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-400 mb-6">Round Complete</div>
          <h2 className="text-6xl font-bold text-yellow-500 font-mono mb-3">TIME&apos;S UP!</h2>
          <p className="text-gray-400 font-mono text-sm mb-12">The Fortune God has spoken.</p>
          <div className="grid grid-cols-2 gap-4 mb-14 font-mono text-center w-full max-w-sm">
            {[
              { label: 'Final Score',  value: uiStats.score,        color: 'text-gray-900'   },
              { label: 'Total Clicks', value: uiStats.totalClicked,  color: 'text-yellow-500' },
              { label: 'Good Coins',   value: uiStats.goodClicked,   color: 'text-green-600'  },
              { label: 'Bad Coins',    value: uiStats.badClicked,    color: 'text-red-500'    },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5">
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-2">{label}</div>
                <div className={`text-4xl font-bold tabular-nums leading-none ${color}`}>{value}</div>
              </div>
            ))}
          </div>
          <button
            onClick={startGame}
            style={{ padding: '12px 28px' }}
            className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 active:scale-95
                       text-black font-bold rounded-xl text-base transition-all
                       shadow-lg shadow-yellow-400/40 hover:shadow-yellow-400/60"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}

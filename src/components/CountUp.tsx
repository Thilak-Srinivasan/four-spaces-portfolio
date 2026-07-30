import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../canvas/useCanvasEffect'

interface CountUpProps {
  value: number
  decimals?: number
  approx?: boolean
  locale?: string
}

/**
 * Number that counts up when it becomes visible. Driven by an
 * IntersectionObserver (not scroll positions), so it fires reliably on
 * mobile and regardless of layout shifts or the smooth-scroll library.
 */
export function CountUp({ value, decimals = 0, approx, locale = 'en-IN' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current!
    const fmt = (v: number) =>
      v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

    if (prefersReducedMotion()) {
      el.textContent = fmt(value)
      return
    }

    el.textContent = fmt(0)
    let raf = 0
    let done = false

    const animate = () => {
      const t0 = performance.now()
      const dur = 1800
      const tick = (t: number) => {
        const p = Math.min((t - t0) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
        el.textContent = fmt(value * eased)
        if (p < 1) raf = requestAnimationFrame(tick)
        else el.textContent = fmt(value)
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done) {
          done = true
          animate()
          io.disconnect()
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -5% 0px' },
    )
    io.observe(el)

    // safety net: if the observer never fires, settle on the final value
    const fallback = setTimeout(() => {
      if (!done) {
        const r = el.getBoundingClientRect()
        if (r.top < innerHeight && r.bottom > 0) {
          done = true
          animate()
          io.disconnect()
        }
      }
    }, 2500)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
    }
  }, [value, decimals, locale])

  return (
    <span>
      {approx && <span className="mr-1 align-top font-mono text-[0.4em] text-[var(--ink-dim)]">~</span>}
      <span ref={ref}>0</span>
    </span>
  )
}

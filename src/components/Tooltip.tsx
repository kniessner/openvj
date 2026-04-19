import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  label: string
  children: React.ReactNode
  side?: 'top' | 'bottom'
  delay?: number
}

export function Tooltip({ label, children, side = 'top', delay = 600 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPos({
        x: rect.left + rect.width / 2,
        y: side === 'top' ? rect.top : rect.bottom,
      })
      setVisible(true)
    }, delay)
  }, [side, delay])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  return (
    <span ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} className="contents">
      {children}
      {visible && createPortal(
        <div
          className={`fixed pointer-events-none z-[9999] bg-gray-950 text-gray-200 text-[10px] leading-tight px-2 py-1 rounded border border-gray-700/80 shadow-xl whitespace-nowrap font-medium -translate-x-1/2 ${
            side === 'top' ? '-translate-y-full -mt-2' : 'mt-2'
          }`}
          style={{ left: pos.x, top: side === 'top' ? pos.y - 6 : pos.y + 6 }}
        >
          {label}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent ${
              side === 'top'
                ? 'top-full border-t-4 border-t-gray-700/80'
                : 'bottom-full border-b-4 border-b-gray-700/80'
            }`}
          />
        </div>,
        document.body
      )}
    </span>
  )
}

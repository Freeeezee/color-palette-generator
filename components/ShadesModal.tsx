'use client'

import { useEffect } from 'react'
import { generateShades, getTextColor, type Swatch } from '@/lib/colors'

type Props = {
  swatch: Swatch
  onClose: () => void
}

export default function ShadesModal({ swatch, onClose }: Props) {
  const shades = generateShades(swatch.hsl)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function copyShade(hex: string) {
    try {
      await navigator.clipboard.writeText(hex)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-[min(90vw,680px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border border-black/10"
              style={{ backgroundColor: swatch.hex }}
            />
            <h2 className="text-sm font-semibold text-gray-900">
              Shades of {swatch.hex.toUpperCase()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex rounded-xl overflow-hidden h-28">
          {shades.map((hex) => {
            const textColor = getTextColor(hex)
            return (
              <button
                key={hex}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-90 group"
                style={{ backgroundColor: hex, color: textColor }}
                onClick={() => copyShade(hex)}
                title={`Copy ${hex.toUpperCase()}`}
              >
                <span className="text-[10px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {hex.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex mt-3 text-[10px] text-gray-400 font-mono">
          {shades.map((hex) => (
            <div key={hex} className="flex-1 text-center truncate px-0.5">
              {hex.replace('#', '')}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Click any shade to copy its hex code
        </p>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { generateShades, getTextColor, type Swatch as SwatchType } from '@/lib/colors'

type Props = {
  swatch: SwatchType
  totalCount: number
  onRemove: (id: string) => void
  onLockToggle: (id: string) => void
  onColorChange: (id: string, hex: string) => void
}

export default function Swatch({
  swatch,
  totalCount,
  onRemove,
  onLockToggle,
  onColorChange,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [shadesOpen, setShadesOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerColor, setPickerColor] = useState(swatch.hex) // always valid #rrggbb
  const [pickerText, setPickerText] = useState('')            // text field, may be partial

  const textColor = getTextColor(swatch.hex)
  const isLight = textColor === '#000000'
  const shades = shadesOpen ? generateShades(swatch.hsl) : []

  // Escape closes shades or picker
  useEffect(() => {
    if (!shadesOpen && !pickerOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShadesOpen(false)
        setPickerOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shadesOpen, pickerOpen])

  function openPicker() {
    setPickerColor(swatch.hex)
    setPickerText(swatch.hex.replace('#', '').toUpperCase())
    setPickerOpen(true)
  }

  function handleColorWheelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setPickerColor(v)
    setPickerText(v.replace('#', '').toUpperCase())
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
    setPickerText(v)
    if (v.length === 6) setPickerColor(`#${v}`)
  }

  function applyPicker() {
    if (/^#[0-9a-fA-F]{6}$/i.test(pickerColor)) {
      onColorChange(swatch.id, pickerColor.toUpperCase())
    }
    setPickerOpen(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(swatch.hex.toUpperCase())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  // Base classes for icon buttons that appear on hover
  const iconBase = `transition-all duration-150 active:scale-95 ${
    isLight ? 'text-black' : 'text-white'
  }`
  const iconHover = `${iconBase} opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:scale-125`

  return (
    <div
      className="relative flex-1 h-full flex flex-col group select-none"
      style={{
        backgroundColor: swatch.hex,
        transition: 'background-color 0.4s ease',
        color: textColor,
      }}
    >
      {/* ── Center column: action buttons above hex code ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5">

        {/* Vertical action buttons */}
        <div className="flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">

          {/* Shades */}
          <button
            onClick={() => setShadesOpen(true)}
            className={`${iconHover} hover:-translate-y-0.5`}
            aria-label="View shades"
            title="View shades"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3.5"  width="18" height="4.5" rx="1.5" />
              <rect x="3" y="9.75" width="18" height="4.5" rx="1.5" fillOpacity="0.6" />
              <rect x="3" y="16"   width="18" height="4.5" rx="1.5" fillOpacity="0.3" />
            </svg>
          </button>

          {/* Color picker */}
          <button
            onClick={openPicker}
            className={iconHover}
            aria-label="Pick color"
            title="Pick color"
          >
            {/* Eyedropper icon */}
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 005 16v3h3a2 2 0 001.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 000-1.65z" />
            </svg>
          </button>

          {/* Lock — filled background when locked for clear visual state */}
          <button
            onClick={() => onLockToggle(swatch.id)}
            className={
              swatch.locked
                ? `${iconBase} rounded-full p-1.5 hover:scale-125 ${
                    isLight ? 'bg-black/15 text-black' : 'bg-white/25 text-white'
                  }`
                : iconHover
            }
            aria-label={swatch.locked ? 'Unlock color' : 'Lock color'}
            title={swatch.locked ? 'Unlock' : 'Lock'}
          >
            {swatch.locked ? (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1C9.24 1 7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
              </svg>
            )}
          </button>

          {/* Remove */}
          {totalCount > 2 && (
            <button
              onClick={() => onRemove(swatch.id)}
              className={`${iconHover} hover:rotate-90`}
              aria-label="Remove color"
              title="Remove"
            >
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Hex code — click to copy */}
        <button
          onClick={handleCopy}
          className={`font-mono text-sm font-semibold tracking-widest uppercase
                      transition-all duration-150 hover:scale-105 active:scale-95 ${
                        isLight ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'
                      }`}
          title="Copy hex"
        >
          {copied ? 'Copied!' : swatch.hex.toUpperCase()}
        </button>
      </div>

      {/* ── Color picker overlay ── */}
      {pickerOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: `${swatch.hex}99` }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-3 w-44 flex flex-col gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="color"
              value={pickerColor}
              onChange={handleColorWheelChange}
              className="w-full h-20 rounded-xl cursor-pointer border-0 p-0.5"
            />
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm">
              <span className="px-2 text-gray-400 font-mono shrink-0">#</span>
              <input
                type="text"
                value={pickerText}
                onChange={handleTextChange}
                maxLength={6}
                placeholder="RRGGBB"
                className="flex-1 py-1.5 font-mono uppercase text-gray-800 outline-none pr-2"
                spellCheck={false}
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPickerOpen(false)}
                className="flex-1 text-xs py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyPicker}
                className="flex-1 text-xs py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shades overlay: full-swatch horizontal slabs ── */}
      {shadesOpen && (
        <div className="absolute inset-0 z-20 flex flex-col">
          {shades.map((shadeHex) => {
            const shadeText = getTextColor(shadeHex)
            const isActive = shadeHex.toUpperCase() === swatch.hex.toUpperCase()
            return (
              <button
                key={shadeHex}
                className="flex-1 w-full flex items-center justify-center relative group/shade"
                style={{ backgroundColor: shadeHex, color: shadeText }}
                onClick={() => {
                  onColorChange(swatch.id, shadeHex)
                  setShadesOpen(false)
                }}
                title={shadeHex.toUpperCase()}
              >
                <span
                  className={`font-mono text-[11px] tracking-wider transition-opacity select-none ${
                    isActive ? 'opacity-60' : 'opacity-0 group-hover/shade:opacity-60'
                  }`}
                >
                  {shadeHex.replace('#', '').toUpperCase()}
                </span>
                {isActive && (
                  <svg className="absolute right-2.5 w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            )
          })}
          <button
            className="absolute top-2 right-2 w-6 h-6 rounded-full
                       bg-black/25 hover:bg-black/45 text-white
                       flex items-center justify-center text-base leading-none
                       transition-all hover:scale-110 active:scale-95 z-30"
            onClick={() => setShadesOpen(false)}
            aria-label="Close shades"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

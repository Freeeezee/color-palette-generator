'use client'

import { useEffect, useRef, useState } from 'react'
import { generateId, hexToHsl, type SavedPalette, type Swatch } from '@/lib/colors'

type Props = {
  savedPalettes: SavedPalette[]
  onSave: () => void
  onLoadPalette: (palette: SavedPalette) => void
  onDeletePalette: (id: string) => void
  onDownload: () => void
  onUpload: (swatches: Swatch[]) => void
}

export default function Navbar({
  savedPalettes,
  onSave,
  onLoadPalette,
  onDeletePalette,
  onDownload,
  onUpload,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data.swatches)) return
        const parsed: Swatch[] = data.swatches
          .filter((s: unknown) =>
            typeof s === 'object' && s !== null &&
            'hex' in s && typeof (s as { hex: unknown }).hex === 'string' &&
            /^#[0-9a-fA-F]{6}$/i.test((s as { hex: string }).hex)
          )
          .map((s: { hex: string }) => ({
            id: generateId(),
            hex: s.hex.toUpperCase(),
            hsl: hexToHsl(s.hex),
            locked: false,
          }))
        const count = parsed.length
        if (count >= 2 && count <= 10) onUpload(parsed)
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const navIconCls =
    'p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg ' +
    'transition-all duration-150 hover:scale-110 active:scale-95'

  return (
    <header className="flex items-center justify-between px-5 h-12 bg-white border-b border-gray-100 shrink-0 z-20">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm tracking-tight text-gray-900">Palette</span>
        <span className="text-xs text-gray-400 hidden sm:block">
          · Press{' '}
          <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">Space</kbd>
          {' '}to generate
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Saved palettes dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600
                       hover:text-gray-900 hover:bg-gray-50 rounded-lg
                       transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>
              Saved
              {savedPalettes.length > 0 && (
                <span className="ml-1 text-gray-400">({savedPalettes.length})</span>
              )}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl
                            border border-gray-100 py-1.5 z-30 max-h-80 overflow-y-auto">
              {savedPalettes.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">No saved palettes yet</p>
              ) : (
                savedPalettes.map((palette) => (
                  <div key={palette.id}
                       className="group flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors">
                    <button
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      onClick={() => { onLoadPalette(palette); setDropdownOpen(false) }}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {palette.swatches.map((s) => (
                          <div key={s.id} className="w-5 h-5 rounded-sm" style={{ backgroundColor: s.hex }} />
                        ))}
                      </div>
                      <span className="truncate text-sm text-gray-700">{palette.name}</span>
                    </button>
                    <button
                      onClick={() => onDeletePalette(palette.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500
                                 transition-all duration-150 hover:scale-125 active:scale-95 shrink-0 text-base leading-none"
                      aria-label="Delete palette"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Upload */}
        <input
          ref={uploadRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Import palette"
        />
        <button
          onClick={() => uploadRef.current?.click()}
          className={navIconCls}
          title="Import palette from JSON"
          aria-label="Import palette"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          className={navIconCls}
          title="Export palette as JSON"
          aria-label="Export palette"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Save */}
        <button
          onClick={onSave}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg font-medium
                     transition-all duration-150 hover:bg-gray-700 hover:scale-105 active:scale-95"
        >
          Save
        </button>
      </div>
    </header>
  )
}

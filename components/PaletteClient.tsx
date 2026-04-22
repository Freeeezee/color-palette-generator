'use client'

import { Fragment, startTransition, useEffect, useState } from 'react'
import {
  generateId,
  hexToHsl,
  interpolateSwatch,
  regeneratePalette,
  type SavedPalette,
  type Swatch,
} from '@/lib/colors'
import Navbar from '@/components/Navbar'
import SwatchColumn from '@/components/Swatch'
import SaveModal from '@/components/SaveModal'

type Props = {
  initialSwatches: Swatch[]
}

export default function PaletteClient({ initialSwatches }: Props) {
  const [swatches, setSwatches] = useState<Swatch[]>(initialSwatches)
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Hydrate saved palettes from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('savedPalettes')
      if (raw) {
        const parsed = JSON.parse(raw) as SavedPalette[]
        startTransition(() => setSavedPalettes(parsed))
      }
    } catch {}
  }, [])

  // Persist saved palettes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes))
    } catch {}
  }, [savedPalettes])

  // Spacebar to regenerate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setSwatches((prev) => regeneratePalette(prev))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleLockToggle(id: string) {
    setSwatches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s))
    )
  }

  function handleRemove(id: string) {
    setSwatches((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((s) => s.id !== id)
    })
  }

  function handleInsert(afterIndex: number) {
    setSwatches((prev) => {
      if (prev.length >= 10) return prev
      const left = prev[afterIndex]
      const right = prev[afterIndex + 1]
      if (!left || !right) return prev
      const newSwatch = interpolateSwatch(left.hsl, right.hsl)
      const next = [...prev]
      next.splice(afterIndex + 1, 0, newSwatch)
      return next
    })
  }

  function handleSave(name: string) {
    const palette: SavedPalette = {
      id: generateId(),
      name,
      swatches: swatches.map(({ id, hex, hsl }) => ({ id, hex, hsl })),
      savedAt: Date.now(),
    }
    setSavedPalettes((prev) => [palette, ...prev])
  }

  function handleLoadPalette(palette: SavedPalette) {
    setSwatches(palette.swatches.map((s) => ({ ...s, locked: false })))
  }

  function handleDeletePalette(id: string) {
    setSavedPalettes((prev) => prev.filter((p) => p.id !== id))
  }

  function handleDownload() {
    const data = {
      name: 'palette',
      swatches: swatches.map(({ hex, hsl }) => ({ hex, hsl })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'palette.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleUpload(newSwatches: Swatch[]) {
    setSwatches(newSwatches)
  }

  function handleColorChange(id: string, hex: string) {
    setSwatches((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, hex: hex.toUpperCase(), hsl: hexToHsl(hex) } : s
      )
    )
  }

  return (
    <div className="flex flex-col h-dvh">
      <Navbar
        savedPalettes={savedPalettes}
        onSave={() => setShowSaveModal(true)}
        onLoadPalette={handleLoadPalette}
        onDeletePalette={handleDeletePalette}
        onDownload={handleDownload}
        onUpload={handleUpload}
      />

      {/* Swatch row — "+" buttons are zero-width flex items between swatches */}
      <div className="flex flex-1 overflow-hidden">
        {swatches.map((swatch, i) => (
          <Fragment key={swatch.id}>
            <SwatchColumn
              swatch={swatch}
              totalCount={swatches.length}
              onRemove={handleRemove}
              onLockToggle={handleLockToggle}
              onColorChange={handleColorChange}
            />

            {/* Zero-width insert button — lives in the flex container so it is never
                clipped by a swatch's overflow and sits above both neighbours via z-10.
                An invisible zone (-left-5 -right-5) extends ~20 px into each swatch,
                acting as a proximity sensor: the button fades in only when the cursor
                gets close to the boundary. */}
            {i < swatches.length - 1 && swatches.length < 10 && (
              <div className="relative w-0 z-10 self-stretch">
                <div className="absolute inset-y-0 -left-5 -right-5 flex items-center justify-center group/plus">
                  <button
                    onClick={() => handleInsert(i)}
                    className="w-7 h-7 rounded-full bg-white shadow-lg
                               text-gray-600 flex items-center justify-center
                               text-sm font-bold
                               opacity-0 group-hover/plus:opacity-100
                               transition-all hover:scale-110"
                    aria-label="Insert color here"
                    title="Insert color"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {showSaveModal && (
        <SaveModal
          swatches={swatches}
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}

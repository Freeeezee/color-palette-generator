'use client'

import { useEffect, useRef, useState } from 'react'
import { type Swatch } from '@/lib/colors'

type Props = {
  swatches: Swatch[]
  onSave: (name: string) => void
  onClose: () => void
}

export default function SaveModal({ swatches, onSave, onClose }: Props) {
  const [name, setName] = useState('My Palette')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(name.trim() || 'My Palette')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-[min(90vw,360px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Save Palette
        </h2>

        {/* Color preview */}
        <div className="flex rounded-lg overflow-hidden h-10 mb-5">
          {swatches.map((s) => (
            <div
              key={s.id}
              className="flex-1"
              style={{ backgroundColor: s.hex }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Palette name"
            maxLength={40}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

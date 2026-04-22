import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          borderRadius: 40,
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, background: '#E76F6F', display: 'flex' }} />
        <div style={{ flex: 1, background: '#E8A45A', display: 'flex' }} />
        <div style={{ flex: 1, background: '#F0D06A', display: 'flex' }} />
        <div style={{ flex: 1, background: '#6BBF87', display: 'flex' }} />
        <div style={{ flex: 1, background: '#5B8FD4', display: 'flex' }} />
      </div>
    ),
    size,
  )
}

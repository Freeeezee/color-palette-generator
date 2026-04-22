import { generateInitialPalette } from '@/lib/colors'
import PaletteClient from '@/components/PaletteClient'

export default function Home() {
  const initialSwatches = generateInitialPalette(5)
  return <PaletteClient initialSwatches={initialSwatches} />
}

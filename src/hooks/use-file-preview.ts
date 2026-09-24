import { useEffect, useState } from 'react'

/**
 * A data: URL for previewing an image the user picked, or undefined while there's no file
 * or it's still being read. Reading through FileReader keeps nothing to revoke, which makes
 * it safe under StrictMode's double-run effects.
 */
export function useFilePreview(file: File | null | undefined): string | undefined {
  const [preview, setPreview] = useState<{ file: File; url: string }>()

  useEffect(() => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreview({ file, url: reader.result })
    }
    reader.readAsDataURL(file)

    return () => reader.abort()
  }, [file])

  // Keyed by file so a stale preview never shows for a newly chosen one.
  return preview && preview.file === file ? preview.url : undefined
}

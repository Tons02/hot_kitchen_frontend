import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectToken } from '@/features/auth/authSlice'

/**
 * Turns a protected file URL (e.g. a signed profile picture link behind `auth:sanctum`) into a
 * local blob: URL that <img> and <a> can use. Browsers can't attach the Bearer token to those
 * elements themselves, so the file is fetched with it here.
 *
 * Returns undefined while loading or if the file can't be fetched, so callers show a fallback.
 */
export function useAuthorizedFileUrl(url: string | undefined): string | undefined {
  const token = useAppSelector(selectToken)
  const [file, setFile] = useState<{ source: string; objectUrl: string }>()

  useEffect(() => {
    if (!url) return

    const controller = new AbortController()
    let objectUrl: string | undefined

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`File request failed with ${response.status}`)
        return response.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setFile({ source: url, objectUrl })
      })
      .catch(() => {
        // Aborted, expired or missing: callers fall back to initials or placeholder text.
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, token])

  // Keyed by source so a previous file never shows for a new URL.
  return file && file.source === url ? file.objectUrl : undefined
}

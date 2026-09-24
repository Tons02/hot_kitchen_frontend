import { FileTextIcon, ImageOffIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuthorizedFileUrl } from '@/hooks/use-authorized-file-url'

interface LicenseProofThumbnailProps {
  /** Signed proof-of-license URL from the API. */
  url: string | undefined
  riderName: string
}

/** A small preview of a rider's license that opens the full file in a new tab. */
export function LicenseProofThumbnail({ url, riderName }: LicenseProofThumbnailProps) {
  // The file route requires the Bearer token, so the preview uses a fetched copy.
  const src = useAuthorizedFileUrl(url)
  // PDFs can't render in an <img>, so those fall back to a link.
  const [isNotImage, setIsNotImage] = useState(false)

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <ImageOffIcon className="size-4" aria-hidden="true" />
        None
      </span>
    )
  }

  if (!src) return <span className="block size-10 animate-pulse rounded-md bg-muted" aria-label="Loading license" />

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {isNotImage ? (
        <span className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
          <FileTextIcon className="size-4" aria-hidden="true" />
          View file
        </span>
      ) : (
        <img
          src={src}
          alt={`${riderName}'s license`}
          className="size-10 rounded-md border object-cover transition-opacity hover:opacity-80"
          onError={() => setIsNotImage(true)}
        />
      )}
    </a>
  )
}

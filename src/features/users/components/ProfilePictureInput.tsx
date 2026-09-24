import { UserIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { FileInput } from '@/components/common/FileInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFilePreview } from '@/hooks/use-file-preview'
import { PROFILE_PICTURE_TYPES } from '../users.constants'

type ProfilePictureInputProps = Omit<ComponentProps<typeof FileInput>, 'accept' | 'placeholder'> & {
  /** The picture already on record, when editing. */
  currentUrl?: string
  /** Shown when there's no picture to display. */
  initials: string
}

/** Avatar preview of the chosen (or current) picture, next to the file picker. */
export function ProfilePictureInput({ currentUrl, initials, ...fileInputProps }: ProfilePictureInputProps) {
  const previewUrl = useFilePreview(fileInputProps.value)

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {(previewUrl ?? currentUrl) && <AvatarImage src={previewUrl ?? currentUrl} alt="" />}
        <AvatarFallback className="text-lg">{initials || <UserIcon className="size-6" />}</AvatarFallback>
      </Avatar>
      <FileInput
        {...fileInputProps}
        accept={PROFILE_PICTURE_TYPES.join(',')}
        placeholder={currentUrl ? 'Current picture' : 'No picture'}
        className="min-w-0 flex-1"
      />
    </div>
  )
}

import { appConfig } from '@/config/app'

/** Sets the browser tab title. React hoists `<title>` into `<head>`. */
export function DocumentTitle({ title }: { title?: string }) {
  return <title>{title ? `${title} · ${appConfig.name}` : appConfig.name}</title>
}

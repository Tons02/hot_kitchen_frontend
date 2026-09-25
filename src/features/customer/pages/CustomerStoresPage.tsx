import { DocumentTitle } from '@/components/common/DocumentTitle'
import { StoreFinder } from '../components/StoreFinder'

/** Every store to order from. The home page shows the first few; this page shows more. */
export default function CustomerStoresPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <DocumentTitle title="Stores" />
      <StoreFinder headingId="stores-heading" title="Stores" limit={24} />
    </div>
  )
}

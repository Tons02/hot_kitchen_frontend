import { DocumentTitle } from '@/components/common/DocumentTitle'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { HeroSection } from '../components/HeroSection'
import { HowToOrder } from '../components/HowToOrder'
import { OrderCta } from '../components/OrderCta'
import { StoreFinder } from '../components/StoreFinder'

const FIND_STORE_ID = 'find-a-store'

/** The customer's starting point: store first, then that store's food, then how ordering works. */
export default function CustomerHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-8 sm:px-6 sm:py-12 md:gap-20">
      <DocumentTitle title="Order online" />
      <HeroSection startHref={`#${FIND_STORE_ID}`} />
      <StoreFinder headingId={FIND_STORE_ID} />
      <FeaturedProducts />
      <HowToOrder />
      <OrderCta startHref={`#${FIND_STORE_ID}`} />
    </div>
  )
}

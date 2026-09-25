import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { scrollToSection } from '../../customer.utils'

export interface StoreSection {
  id: string
  label: string
}

/**
 * The storefront's sticky jump links (Overview, Featured, Menu, Location), just under the header.
 * Highlights the section in view; scrolls sideways on phones.
 */
export function StoreSectionNav({ sections }: { sections: StoreSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  // The section occupying the middle band of the screen is the active one.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label="Store sections"
      className="sticky top-16 z-30 -mx-4 border-b bg-background/90 px-4 backdrop-blur sm:mx-0 sm:px-0"
    >
      <ul className="flex h-12 items-center gap-1 overflow-x-auto">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => {
                setActiveId(section.id)
                scrollToSection(section.id)
              }}
              aria-current={activeId === section.id ? 'true' : undefined}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors',
                'hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                activeId === section.id && 'bg-accent text-accent-foreground',
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

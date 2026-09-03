'use client'

import type { CategoryNode } from '@/lib/categories'

export type FilterChange = { category: string | null; type: string | null }

function Pill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 border-b-2 px-4 text-xs font-medium tracking-[0.14em] uppercase transition-colors ${
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-ink-muted hover:border-hairline hover:text-ink-soft'
      }`}
    >
      {label}
    </button>
  )
}

export function CategoryFilterBar({
  categories,
  activeCategory,
  activeType,
  onChange,
}: {
  categories: CategoryNode[]
  activeCategory: string | null
  activeType: string | null
  onChange: (next: FilterChange) => void
}) {
  const active = categories.find((category) => category.slug === activeCategory)
  const subCategories = active?.children ?? []

  return (
    <div className="border-b border-hairline">
      <div className="-mx-4 flex flex-wrap items-center">
        <Pill
          label="All"
          active={activeCategory === null}
          onClick={() => onChange({ category: null, type: null })}
        />
        {categories.map((category) => (
          <Pill
            key={category._id}
            label={category.title}
            active={activeCategory === category.slug}
            onClick={() => onChange({ category: category.slug, type: null })}
          />
        ))}
      </div>

      {subCategories.length > 0 && (
        <div className="-mx-3 flex flex-wrap items-center pb-1">
          {subCategories.map((sub) => (
            <Pill
              key={sub._id}
              label={sub.title}
              active={activeType === sub.slug}
              onClick={() =>
                onChange({
                  category: activeCategory,
                  type: activeType === sub.slug ? null : sub.slug,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

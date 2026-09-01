export type FlatCategory = {
  _id: string
  title: string
  slug: string
  parentId: string | null
}

export type CategoryNode = FlatCategory & { children: CategoryNode[] }

/**
 * Turns the flat category list from Sanity into a one-level-deep tree.
 * A category whose parent is not in the list is treated as a root, so a
 * half-published taxonomy still renders something usable.
 */
export function buildCategoryTree(categories: FlatCategory[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((category) => [category._id, { ...category, children: [] }]),
  )

  const roots: CategoryNode[] = []

  for (const category of categories) {
    const node = nodes.get(category._id)!
    const parent = category.parentId ? nodes.get(category.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

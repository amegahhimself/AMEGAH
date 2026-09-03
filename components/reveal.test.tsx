import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Reveal } from './reveal'

let observe: ReturnType<typeof vi.fn>
let disconnect: ReturnType<typeof vi.fn>
let trigger: (entries: { isIntersecting: boolean }[]) => void

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

beforeEach(() => {
  observe = vi.fn()
  disconnect = vi.fn()
  vi.stubGlobal(
    'IntersectionObserver',
    // A `function` (not an arrow function) implementation, so this mock
    // stays constructable when reveal.tsx calls `new IntersectionObserver()`
    // — Vitest's mock proxy uses Reflect.construct on the implementation,
    // which throws for arrow functions per plain JS semantics.
    vi.fn().mockImplementation(function (callback) {
      trigger = callback
      return { observe, disconnect, unobserve: vi.fn() }
    }),
  )
  mockMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Reveal', () => {
  it('always renders its children, so content never depends on the animation', () => {
    render(
      <Reveal>
        <p>A still from the film</p>
      </Reveal>,
    )
    expect(screen.getByText('A still from the film')).toBeInTheDocument()
  })

  it('watches for the element entering the viewport', () => {
    render(
      <Reveal>
        <p>Watched</p>
      </Reveal>,
    )
    expect(observe).toHaveBeenCalled()
  })

  it('marks the element revealed once it enters the viewport', () => {
    render(
      <Reveal>
        <p>Revealed</p>
      </Reveal>,
    )
    // The observer callback fires from outside any React-managed event, so
    // the resulting state update must be flushed explicitly before asserting.
    act(() => {
      trigger([{ isIntersecting: true }])
    })
    expect(screen.getByText('Revealed').parentElement).toHaveAttribute(
      'data-revealed',
      'true',
    )
  })

  it('stops observing after revealing, rather than watching forever', () => {
    render(
      <Reveal>
        <p>Done</p>
      </Reveal>,
    )
    // The observer callback fires from outside any React-managed event, so
    // the resulting state update must be flushed explicitly before asserting.
    act(() => {
      trigger([{ isIntersecting: true }])
    })
    expect(disconnect).toHaveBeenCalled()
  })

  it('never hides anything when the visitor asked for reduced motion', () => {
    mockMatchMedia(true)
    render(
      <Reveal>
        <p>No motion</p>
      </Reveal>,
    )
    expect(screen.getByText('No motion').parentElement).toHaveAttribute(
      'data-revealed',
      'true',
    )
    expect(observe).not.toHaveBeenCalled()
  })
})

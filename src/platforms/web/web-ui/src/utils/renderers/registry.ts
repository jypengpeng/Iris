import type { FenceRenderer } from './types'

const renderers: FenceRenderer[] = []

export function registerFenceRenderer(renderer: FenceRenderer): void {
  renderers.push(renderer)
}

export function findFenceRenderer(lang: string, source: string): FenceRenderer | null {
  for (const renderer of renderers) {
    if (!renderer.languages.includes(lang)) continue
    if (renderer.shouldHandle && !renderer.shouldHandle(source, lang)) continue
    return renderer
  }
  return null
}

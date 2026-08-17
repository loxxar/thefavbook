import { describe, expect, it } from 'vitest'

import { isBroken, isInconclusive, STATUS_UNVERIFIABLE } from './link-check'

/**
 * Ces deux fonctions décident de ce qu'une suppression en masse emporte.
 *
 * Sur une collection réelle, douze des quatorze liens signalés morts étaient
 * des 403 : des sites vivants qui refusaient un robot. Les cas ci-dessous
 * figent la frontière pour qu'elle ne se redéplace pas par accident.
 */
describe('isBroken', () => {
  it('should report dead when the server says the page is gone', () => {
    expect(isBroken(404)).toBe(true)
    expect(isBroken(410)).toBe(true)
  })

  it('should spare refused access when the site is alive', () => {
    expect(isBroken(401)).toBe(false)
    expect(isBroken(403)).toBe(false)
    expect(isBroken(429)).toBe(false)
  })

  it('should spare outages when the failure is temporary', () => {
    expect(isBroken(500)).toBe(false)
    expect(isBroken(502)).toBe(false)
    expect(isBroken(503)).toBe(false)
  })

  it('should spare a silent server when nothing was answered', () => {
    expect(isBroken(0)).toBe(false)
  })

  it('should spare out-of-reach addresses when the server cannot try', () => {
    expect(isBroken(STATUS_UNVERIFIABLE)).toBe(false)
  })

  it('should spare bookmarks when no check ran yet', () => {
    expect(isBroken(null)).toBe(false)
  })

  it('should report healthy when the page answers', () => {
    expect(isBroken(200)).toBe(false)
    expect(isBroken(301)).toBe(false)
  })
})

describe('isInconclusive', () => {
  it('should flag every failure the server did not attribute to the page', () => {
    expect(isInconclusive(403)).toBe(true)
    expect(isInconclusive(429)).toBe(true)
    expect(isInconclusive(503)).toBe(true)
    expect(isInconclusive(0)).toBe(true)
    expect(isInconclusive(STATUS_UNVERIFIABLE)).toBe(true)
  })

  it('should not overlap with dead links when the verdict is certain', () => {
    expect(isInconclusive(404)).toBe(false)
    expect(isInconclusive(410)).toBe(false)
  })

  it('should stay quiet when the page answers', () => {
    expect(isInconclusive(200)).toBe(false)
    expect(isInconclusive(null)).toBe(false)
  })
})

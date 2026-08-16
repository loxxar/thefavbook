import { describe, expect, it } from 'vitest'

import { canonicalizeUrl, extractHostname } from './url'

describe('canonicalizeUrl', () => {
  it('should produce the same key when the same page differs only by scheme or www', () => {
    const expected = 'https://example.com/article'

    expect(canonicalizeUrl('http://example.com/article')).toBe(expected)
    expect(canonicalizeUrl('https://www.example.com/article')).toBe(expected)
    expect(canonicalizeUrl('HTTPS://WWW.EXAMPLE.COM/article')).toBe(expected)
  })

  it('should ignore a trailing slash when the path is not the root', () => {
    expect(canonicalizeUrl('https://example.com/article/')).toBe(
      'https://example.com/article',
    )
    expect(canonicalizeUrl('https://example.com/')).toBe('https://example.com/')
    expect(canonicalizeUrl('https://example.com')).toBe('https://example.com/')
  })

  it('should strip tracking parameters when a shared link carries them', () => {
    expect(
      canonicalizeUrl(
        'https://example.com/p?utm_source=x&utm_campaign=y&fbclid=z&gclid=w',
      ),
    ).toBe('https://example.com/p')
  })

  it('should keep functional parameters when they select the content shown', () => {
    expect(canonicalizeUrl('https://example.com/search?q=rust&page=2')).toBe(
      'https://example.com/search?page=2&q=rust',
    )
  })

  it('should produce the same key when query parameters are ordered differently', () => {
    expect(canonicalizeUrl('https://example.com/s?b=2&a=1')).toBe(
      canonicalizeUrl('https://example.com/s?a=1&b=2'),
    )
  })

  it('should drop the fragment when it is a plain anchor', () => {
    expect(canonicalizeUrl('https://example.com/doc#installation')).toBe(
      'https://example.com/doc',
    )
  })

  it('should keep the fragment when it is a hashbang route', () => {
    expect(canonicalizeUrl('https://example.com/app#!/dashboard')).toBe(
      'https://example.com/app#!/dashboard',
    )
  })

  it('should drop the port when it is the default for the scheme', () => {
    expect(canonicalizeUrl('http://example.com:80/a')).toBe(
      'https://example.com/a',
    )
    expect(canonicalizeUrl('https://example.com:443/a')).toBe(
      'https://example.com/a',
    )
    expect(canonicalizeUrl('http://localhost:3000/a')).toBe(
      'https://localhost:3000/a',
    )
  })

  it('should not merge distinct pages when only the path differs', () => {
    expect(canonicalizeUrl('https://example.com/a')).not.toBe(
      canonicalizeUrl('https://example.com/b'),
    )
  })

  it('should compact without interpreting when the scheme is not http', () => {
    expect(canonicalizeUrl('javascript:void(0)')).toBe('javascript:void(0)')
    expect(canonicalizeUrl('  place:sort=8  ')).toBe('place:sort=8')
  })

  it('should fall back to the raw value when the URL cannot be parsed', () => {
    expect(canonicalizeUrl('pas une url')).toBe('pas une url')
    expect(canonicalizeUrl('')).toBe('')
  })
})

describe('extractHostname', () => {
  it('should return the hostname without www when the URL is valid', () => {
    expect(extractHostname('https://www.example.com/a?b=1')).toBe('example.com')
    expect(extractHostname('http://sub.example.co.uk/')).toBe(
      'sub.example.co.uk',
    )
  })

  it('should return null when the URL cannot be parsed', () => {
    expect(extractHostname('pas une url')).toBeNull()
  })
})

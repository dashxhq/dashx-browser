import { describe, expect, it } from 'vitest'

import generateContext from '../src/context'
import packageInfo from '../package.json'

describe('generateContext', () => {
  it('returns all required system context fields', () => {
    const context = generateContext()

    expect(context).toHaveProperty('ipV4')
    expect(context).toHaveProperty('userAgent')
    expect(context).toHaveProperty('screen')
    expect(context).toHaveProperty('library')
    expect(context).toHaveProperty('locale')
    expect(context).toHaveProperty('timeZone')
  })

  it('populates library with the package name and version', () => {
    const { library } = generateContext()

    expect(library).toEqual({
      name: packageInfo.name,
      version: packageInfo.version,
    })
  })

  it('populates screen with numeric density, height, and width', () => {
    const { screen } = generateContext()

    expect(typeof screen!.density).toBe('number')
    expect(typeof screen!.height).toBe('number')
    expect(typeof screen!.width).toBe('number')
  })

  it('populates locale from navigator.language', () => {
    const { locale } = generateContext()
    expect(typeof locale).toBe('string')
    expect(locale!.length).toBeGreaterThan(0)
  })

  it('populates timeZone with a resolved IANA zone', () => {
    const { timeZone } = generateContext()
    expect(typeof timeZone).toBe('string')
    expect(timeZone!.length).toBeGreaterThan(0)
  })

  it('uses the "NA" placeholder for ipV4 (server fills this in)', () => {
    expect(generateContext().ipV4).toBe('NA')
  })
})

import { glob } from 'fast-glob'
import { describe, expect, it, vi } from 'vitest'

// Mock the uploadAssets function logic for testing
async function expandAssetPatterns(assets: string | string[]): Promise<string[]> {
  let assetList: string[] = []
  if (typeof assets === 'string') {
    assetList = assets.split(',').map(s => s.trim()).filter(Boolean)
  }
  else if (Array.isArray(assets)) {
    assetList = assets.flatMap(item =>
      typeof item === 'string' ? item.split(',').map(s => s.trim()) : [],
    ).filter(Boolean)
  }

  const expandedAssets: string[] = []
  for (const asset of assetList) {
    // Check if the asset contains glob patterns
    if (asset.includes('*') || asset.includes('?') || asset.includes('[') || asset.includes('{')) {
      const matches = await glob(asset, { onlyFiles: true, absolute: false })
      expandedAssets.push(...matches)
    }
    else {
      expandedAssets.push(asset)
    }
  }

  return expandedAssets
}

describe('assets glob patterns', () => {
  it('should handle simple file paths', async () => {
    const result = await expandAssetPatterns(['package.json', 'README.md'])
    expect(result).toEqual(['package.json', 'README.md'])
  })

  it('should handle comma-separated string', async () => {
    const result = await expandAssetPatterns('package.json,README.md')
    expect(result).toEqual(['package.json', 'README.md'])
  })

  it('should expand glob patterns', async () => {
    const result = await expandAssetPatterns(['*.json'])
    expect(result).toContain('package.json')
    expect(result).toContain('tsconfig.json')
  })

  it('should handle multiple glob patterns', async () => {
    const result = await expandAssetPatterns(['*.json', '*.md'])
    expect(result).toContain('package.json')
    expect(result).toContain('README.md')
  })

  it('should handle mixed patterns and specific files', async () => {
    const result = await expandAssetPatterns(['*.json', 'LICENSE'])
    expect(result).toContain('package.json')
    expect(result).toContain('LICENSE')
  })

  it('should handle directory patterns', async () => {
    const result = await expandAssetPatterns(['src/*.ts'])
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(file => file.startsWith('src/') && file.endsWith('.ts'))).toBe(true)
  })
})

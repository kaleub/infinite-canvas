import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core'
import type { TLAssetStore } from 'tldraw'

function getExtension(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  const fromType = file.type.split('/').pop()
  return fromType ? fromType.toLowerCase() : 'png'
}

function sanitizeId(id: string): string {
  // tldraw asset IDs look like "asset:-885737282" — strip anything
  // that isn't filesystem/URL safe.
  return id.replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function createVaultAssetStore(vaultPath: string): TLAssetStore {
  return {
    async upload(asset, file) {
      const imagesDir = await join(vaultPath, 'images')
      const dirExists = await exists(imagesDir)
      if (!dirExists) {
        await mkdir(imagesDir, { recursive: true })
      }

      const extension = getExtension(file)
      const filename = `${sanitizeId(asset.id)}.${extension}`
      const relativePath = `images/${filename}`
      const absolutePath = await join(vaultPath, relativePath)

      const bytes = new Uint8Array(await file.arrayBuffer())
      await writeFile(absolutePath, bytes)

      // "asset:" is one of the few schemes tldraw's URL validator accepts
      // for non-http sources — this is the documented workaround.
      return { src: `asset:${relativePath}` }
    },

    async resolve(asset) {
      const src = asset.props.src
      if (!src || !src.startsWith('asset:')) {
        return src // already a real URL (http, data:, etc.) — pass through
      }
      const relativePath = src.replace('asset:', '')
      const absolutePath = await join(vaultPath, relativePath)
      return convertFileSrc(absolutePath)
    },

    async remove() {
      // Deliberately not deleting files from disk yet.
    },
  }
}
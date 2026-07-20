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

export function createVaultAssetStore(vaultPath: string): TLAssetStore {
  return {
    async upload(asset, file) {
      const imagesDir = await join(vaultPath, 'images')
      const dirExists = await exists(imagesDir)
      if (!dirExists) {
        await mkdir(imagesDir, { recursive: true })
      }

      const extension = getExtension(file)
      const filename = `${asset.id}.${extension}`
      const relativePath = `images/${filename}`
      const absolutePath = await join(vaultPath, relativePath)

      const bytes = new Uint8Array(await file.arrayBuffer())
      await writeFile(absolutePath, bytes)

      // Store a portable, relative path — not an absolute one —
      // so the vault still works correctly if moved to another device.
      return { src: relativePath }
    },

    async resolve(asset) {
      const relativePath = asset.props.src
      if (!relativePath || relativePath.startsWith('http') || relativePath.startsWith('asset:')) {
        return relativePath
      }
      const absolutePath = await join(vaultPath, relativePath)
      return convertFileSrc(absolutePath)
    },

    async remove() {
      // Deliberately not deleting files from disk yet.
      // Safer default — we can add real cleanup later once
      // we're confident about it (e.g. warn before permanent delete).
    },
  }
}
import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { getSnapshot, loadSnapshot, type Editor, type TLStoreSnapshot } from 'tldraw'

async function getCanvasFilePath(vaultPath: string): Promise<string> {
  return await join(vaultPath, 'canvas.json')
}

export async function loadCanvasIntoEditor(editor: Editor, vaultPath: string): Promise<void> {
  const canvasPath = await getCanvasFilePath(vaultPath)
  const canvasExists = await exists(canvasPath)

  if (!canvasExists) {
    return // fresh vault, nothing to load yet
  }

  const contents = await readTextFile(canvasPath)
  const snapshot = JSON.parse(contents) as TLStoreSnapshot
  loadSnapshot(editor.store, snapshot)
}

export async function saveCanvasFromEditor(editor: Editor, vaultPath: string): Promise<void> {
  const canvasPath = await getCanvasFilePath(vaultPath)
  const snapshot = getSnapshot(editor.store)
  await writeTextFile(canvasPath, JSON.stringify(snapshot))
}
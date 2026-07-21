import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { saveVaultConfig } from './vaultConfig'

// Opens the native folder picker, grants filesystem scope to the chosen
// folder, and persists it as the active vault. Returns the chosen path,
// or null if the user cancelled.
export async function chooseVaultFolder(title: string): Promise<string | null> {
  const selectedPath = await open({
    directory: true,
    multiple: false,
    title,
  })

  if (!selectedPath || typeof selectedPath !== 'string') {
    return null
  }

  await invoke('allow_vault_directory', { path: selectedPath })
  await saveVaultConfig({ vaultPath: selectedPath })

  return selectedPath
}
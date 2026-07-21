import { open } from '@tauri-apps/plugin-dialog'
import { addVaultToConfig, type VaultsConfig } from './vaultConfig'

// Opens the native folder picker, adds the chosen folder to the known
// vault list, and sets it as active. Returns the updated config,
// or null if the user cancelled.
export async function chooseVaultFolder(title: string): Promise<VaultsConfig | null> {
  const selectedPath = await open({
    directory: true,
    multiple: false,
    title,
  })

  if (!selectedPath || typeof selectedPath !== 'string') {
    return null
  }

  return await addVaultToConfig(selectedPath)
}
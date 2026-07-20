import { exists, readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs'
import { appConfigDir, join } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/core'

export interface VaultConfig {
  vaultPath: string
}

async function getConfigFilePath(): Promise<string> {
  const configDir = await appConfigDir()
  return await join(configDir, 'config.json')
}

export async function loadVaultConfig(): Promise<VaultConfig | null> {
  const configPath = await getConfigFilePath()
  const configExists = await exists(configPath)

  if (!configExists) {
    return null
  }

  const contents = await readTextFile(configPath)
  const config = JSON.parse(contents) as VaultConfig

  await invoke('allow_vault_directory', { path: config.vaultPath })

  const vaultFolderExists = await exists(config.vaultPath)
  if (!vaultFolderExists) {
    // Vault was moved, renamed, or deleted — treat as if never configured,
    // so onboarding runs again to reconnect or set a new one.
    return null
  }

  return config
}

export async function saveVaultConfig(config: VaultConfig): Promise<void> {
  const configDir = await appConfigDir()
  const dirExists = await exists(configDir)

  if (!dirExists) {
    await mkdir(configDir, { recursive: true })
  }

  const configPath = await getConfigFilePath()
  await writeTextFile(configPath, JSON.stringify(config, null, 2))
}
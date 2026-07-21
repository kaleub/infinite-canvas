import { exists, readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs'
import { appConfigDir, join } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/core'

export interface VaultEntry {
  path: string
  name: string
}

export interface VaultsConfig {
  vaults: VaultEntry[]
  activeVaultPath: string
}

// Old, pre-multi-vault config shape — kept only so we can migrate it.
interface LegacyVaultConfig {
  vaultPath: string
}

async function getConfigFilePath(): Promise<string> {
  const configDir = await appConfigDir()
  return await join(configDir, 'config.json')
}

async function writeConfig(config: VaultsConfig): Promise<void> {
  const configDir = await appConfigDir()
  const dirExists = await exists(configDir)
  if (!dirExists) {
    await mkdir(configDir, { recursive: true })
  }
  const configPath = await getConfigFilePath()
  await writeTextFile(configPath, JSON.stringify(config, null, 2))
}

function deriveNameFromPath(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] ?? path
}

// Loads the config, migrating the old single-vault format if found.
// Validates every known vault still exists on disk — folders can be
// moved, renamed, or deleted outside the app at any time. Returns null
// if no vault has ever been configured, or if every known vault is gone.
export async function loadVaultsConfig(): Promise<VaultsConfig | null> {
  const configPath = await getConfigFilePath()
  const configExists = await exists(configPath)

  if (!configExists) {
    return null
  }

  const contents = await readTextFile(configPath)
  const parsed = JSON.parse(contents) as VaultsConfig | LegacyVaultConfig

  let config: VaultsConfig

  if ('vaults' in parsed && 'activeVaultPath' in parsed) {
    config = parsed
  } else {
    const legacy = parsed as LegacyVaultConfig
    config = {
      vaults: [{ path: legacy.vaultPath, name: deriveNameFromPath(legacy.vaultPath) }],
      activeVaultPath: legacy.vaultPath,
    }
  }

  const validVaults: VaultEntry[] = []
  for (const vault of config.vaults) {
    try {
      // Grant scope before checking — a fresh app launch has no scope
      // granted yet this session, so exists() would fail otherwise
      // even for perfectly valid vaults.
      await invoke('allow_vault_directory', { path: vault.path })
      const stillExists = await exists(vault.path)
      if (stillExists) {
        validVaults.push(vault)
      }
    } catch {
      // Path is inaccessible or gone — treat it as no longer valid,
      // rather than letting one bad vault crash the whole load.
      continue
    }
  }

  if (validVaults.length === 0) {
    return null
  }

  const activeStillValid = validVaults.some((v) => v.path === config.activeVaultPath)
  const activeVaultPath = activeStillValid ? config.activeVaultPath : validVaults[0].path

  const finalConfig: VaultsConfig = {
    vaults: validVaults,
    activeVaultPath,
  }

  const changed =
    validVaults.length !== config.vaults.length || activeVaultPath !== config.activeVaultPath
  if (changed) {
    await writeConfig(finalConfig)
  }

  return finalConfig
}

export async function addVaultToConfig(path: string): Promise<VaultsConfig> {
  const existingConfig = await loadVaultsConfig()
  const name = deriveNameFromPath(path)

  const vaults = existingConfig?.vaults ?? []
  const alreadyKnown = vaults.some((v) => v.path === path)
  const updatedVaults = alreadyKnown ? vaults : [...vaults, { path, name }]

  const config: VaultsConfig = {
    vaults: updatedVaults,
    activeVaultPath: path,
  }

  await invoke('allow_vault_directory', { path })
  await writeConfig(config)
  return config
}

export async function setActiveVault(path: string): Promise<VaultsConfig> {
  const existingConfig = await loadVaultsConfig()
  if (!existingConfig) {
    throw new Error('No vault config exists yet')
  }
  const config: VaultsConfig = {
    ...existingConfig,
    activeVaultPath: path,
  }
  await invoke('allow_vault_directory', { path })
  await writeConfig(config)
  return config
}
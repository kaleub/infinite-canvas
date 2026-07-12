import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { saveVaultConfig } from '../lib/vaultConfig'

interface OnboardingProps {
  onVaultReady: (vaultPath: string) => void
}

export function Onboarding({ onVaultReady }: OnboardingProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleChooseVault() {
    setError(null)

    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: 'Choose or create your vault folder',
    })

    if (!selectedPath || typeof selectedPath !== 'string') {
      return // user cancelled
    }

    try {
      await invoke('allow_vault_directory', { path: selectedPath })
      await saveVaultConfig({ vaultPath: selectedPath })
      onVaultReady(selectedPath)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1>Welcome to Infinite Canvas</h1>
      <p>Choose a folder where your vault will live.</p>
      <button onClick={handleChooseVault} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        Choose Vault Folder
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
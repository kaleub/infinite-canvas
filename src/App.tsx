import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tldraw, type Editor, type TLComponents } from 'tldraw'
import { getCurrentWindow } from '@tauri-apps/api/window'
import 'tldraw/tldraw.css'
import { Onboarding } from './components/Onboarding'
import { MinimalToolbar } from './components/Toolbar'
import { CustomMainMenu } from './components/MainMenu'
import { loadVaultsConfig, setActiveVault, type VaultEntry, type VaultsConfig } from './lib/vaultConfig'
import { chooseVaultFolder } from './lib/chooseVaultFolder'
import { loadCanvasIntoEditor, saveCanvasFromEditor } from './lib/canvasPersistence'
import { createVaultAssetStore } from './lib/vaultAssetStore'
import { uiOverrides } from './lib/uiOverrides'
import { NonLockableFrameTool } from './lib/NonLockableFrameTool'

const customTools = [NonLockableFrameTool]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type LoadStatus = 'loading' | 'ready'

function App() {
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [vaults, setVaults] = useState<VaultEntry[]>([])
  const [checked, setChecked] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadVaultsConfig().then((config) => {
      if (config) {
        setVaultPath(config.activeVaultPath)
        setVaults(config.vaults)
      }
      setChecked(true)
    })
  }, [])

  // Keep the native window title in sync with the active vault's name.
  useEffect(() => {
    const activeVault = vaults.find((v) => v.path === vaultPath)
    const title = activeVault ? `Infinite — ${activeVault.name}` : 'Infinite'
    getCurrentWindow()
      .setTitle(title)
      .catch((err) => console.error('Failed to set window title:', err))
  }, [vaultPath, vaults])

  const handleSwitchVault = useCallback(async (path: string) => {
    setLoadStatus('loading')
    const updatedConfig = await setActiveVault(path)
    setVaultPath(updatedConfig.activeVaultPath)
    setVaults(updatedConfig.vaults)
  }, [])

  const handleAddVault = useCallback(async () => {
    const config = await chooseVaultFolder('Choose a vault folder to add')
    if (config) {
      setLoadStatus('loading')
      setVaultPath(config.activeVaultPath)
      setVaults(config.vaults)
    }
  }, [])

  const handleOnboardingComplete = useCallback((config: VaultsConfig) => {
    setVaultPath(config.activeVaultPath)
    setVaults(config.vaults)
  }, [])

  const assetStore = useMemo(() => {
    if (!vaultPath) return undefined
    return createVaultAssetStore(vaultPath)
  }, [vaultPath])

  const components: TLComponents = useMemo(
    () => ({
      Toolbar: MinimalToolbar,
      MainMenu: (props) => (
        <CustomMainMenu
          {...props}
          vaults={vaults}
          activeVaultPath={vaultPath ?? ''}
          onSwitchVault={handleSwitchVault}
          onAddVault={handleAddVault}
        />
      ),
      StylePanel: null,
      NavigationPanel: null,
      ZoomMenu: null,
      ActionsMenu: null,
      HelpMenu: null,
      DebugPanel: null,
      DebugMenu: null,
      TopPanel: null,
      SharePanel: null,
      CursorChatBubble: null,
      KeyboardShortcutsDialog: null,
      QuickActions: null,
    }),
    [vaults, vaultPath, handleSwitchVault, handleAddVault]
  )

  function handleMount(editor: Editor) {
    if (!vaultPath) return

    setLoadStatus('loading')
    loadCanvasIntoEditor(editor, vaultPath)
      .catch((err) => console.error('Failed to load vault canvas:', err))
      .finally(() => setLoadStatus('ready'))

    const unsubscribe = editor.store.listen(
      () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(async () => {
          setSaveStatus('saving')
          try {
            await saveCanvasFromEditor(editor, vaultPath)
            setSaveStatus('saved')
            if (savedFadeTimeoutRef.current) {
              clearTimeout(savedFadeTimeoutRef.current)
            }
            savedFadeTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
          } catch (err) {
            console.error('Failed to save vault canvas:', err)
            setSaveStatus('error')
          }
        }, 3000)
      },
      { scope: 'document', source: 'user' }
    )

    return () => {
      unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (savedFadeTimeoutRef.current) {
        clearTimeout(savedFadeTimeoutRef.current)
      }
    }
  }

  if (!checked) {
    return null
  }

  if (!vaultPath) {
    return <Onboarding onVaultReady={handleOnboardingComplete} />
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        key={vaultPath}
        components={components}
        overrides={uiOverrides}
        tools={customTools}
        assets={assetStore}
        onMount={handleMount}
      />

      {loadStatus === 'loading' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            fontFamily: 'sans-serif',
            fontSize: '0.95rem',
            color: '#333',
            zIndex: 10000,
          }}
        >
          Loading vault…
        </div>
      )}

      {saveStatus !== 'idle' && (
        <div
          style={{
            position: 'fixed',
            bottom: '12px',
            right: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontFamily: 'sans-serif',
            fontSize: '0.75rem',
            backgroundColor:
              saveStatus === 'error' ? '#fdecea' : saveStatus === 'saving' ? '#f0f0f0' : '#eaf7ec',
            color: saveStatus === 'error' ? '#b3261e' : '#555',
            border: '1px solid rgba(0,0,0,0.08)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Error saving'}
        </div>
      )}
    </div>
  )
}

export default App
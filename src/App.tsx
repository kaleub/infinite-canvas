import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tldraw, type Editor, type TLComponents } from 'tldraw'
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

function App() {
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [vaults, setVaults] = useState<VaultEntry[]>([])
  const [checked, setChecked] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadVaultsConfig().then((config) => {
      if (config) {
        setVaultPath(config.activeVaultPath)
        setVaults(config.vaults)
      }
      setChecked(true)
    })
  }, [])

  const handleSwitchVault = useCallback(async (path: string) => {
    const updatedConfig = await setActiveVault(path)
    setVaultPath(updatedConfig.activeVaultPath)
    setVaults(updatedConfig.vaults)
  }, [])

  const handleAddVault = useCallback(async () => {
    const config = await chooseVaultFolder('Choose a vault folder to add')
    if (config) {
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

    loadCanvasIntoEditor(editor, vaultPath)

    const unsubscribe = editor.store.listen(
      () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveCanvasFromEditor(editor, vaultPath)
        }, 3000)
      },
      { scope: 'document', source: 'user' }
    )

    return () => {
      unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
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
    </div>
  )
}

export default App
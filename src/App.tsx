import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tldraw, type Editor, type TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { Onboarding } from './components/Onboarding'
import { MinimalToolbar } from './components/Toolbar'
import { CustomMainMenu } from './components/MainMenu'
import { loadVaultConfig } from './lib/vaultConfig'
import { chooseVaultFolder } from './lib/chooseVaultFolder'
import { loadCanvasIntoEditor, saveCanvasFromEditor } from './lib/canvasPersistence'
import { createVaultAssetStore } from './lib/vaultAssetStore'
import { uiOverrides } from './lib/uiOverrides'
import { NonLockableFrameTool } from './lib/NonLockableFrameTool'

const customTools = [NonLockableFrameTool]

function App() {
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadVaultConfig().then((config) => {
      if (config) {
        setVaultPath(config.vaultPath)
      }
      setChecked(true)
    })
  }, [])

  const handleChangeVault = useCallback(async () => {
    const selectedPath = await chooseVaultFolder('Choose a new vault folder')
    if (selectedPath) {
      setVaultPath(selectedPath)
    }
  }, [])

  const assetStore = useMemo(() => {
    if (!vaultPath) return undefined
    return createVaultAssetStore(vaultPath)
  }, [vaultPath])

  const components: TLComponents = useMemo(
    () => ({
      Toolbar: MinimalToolbar,
      MainMenu: (props) => <CustomMainMenu {...props} onChangeVault={handleChangeVault} />,
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
    [handleChangeVault]
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
    return <Onboarding onVaultReady={setVaultPath} />
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

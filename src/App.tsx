import { useEffect, useMemo, useRef, useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { Onboarding } from './components/Onboarding'
import { loadVaultConfig } from './lib/vaultConfig'
import { loadCanvasIntoEditor, saveCanvasFromEditor } from './lib/canvasPersistence'
import { createVaultAssetStore } from './lib/vaultAssetStore'

// Hide every default UI piece we don't need
const components = {
  //Toolbar: null,
  //MenuPanel: null,
    //MainMenu: null,
    //PageMenu: null,
    QuickActions: null,
  //ContextMenu: null,
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
}

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

  const assetStore = useMemo(() => {
    if (!vaultPath) return undefined
    return createVaultAssetStore(vaultPath)
  }, [vaultPath])

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
      <Tldraw components={components} assets={assetStore} onMount={handleMount} />
    </div>
  )
}

export default App

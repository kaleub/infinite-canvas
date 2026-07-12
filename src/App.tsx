import { useEffect, useState } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Onboarding } from './components/Onboarding'
import { loadVaultConfig } from './lib/vaultConfig'

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

  useEffect(() => {
    loadVaultConfig().then((config) => {
      if (config) {
        setVaultPath(config.vaultPath)
      }
      setChecked(true)
    })
  }, [])

  if (!checked) {
    return null // brief loading state, avoids onboarding flash
  }

  if (!vaultPath) {
    return <Onboarding onVaultReady={setVaultPath} />
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw components={components} />
    </div>
  )
}

export default App
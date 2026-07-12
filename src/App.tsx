import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

// Hide every default UI piece we don't need
const components = {
  Toolbar: null,
  StylePanel: null,
  PageMenu: null,
  NavigationPanel: null,
  ZoomMenu: null,
  MainMenu: null,
  ContextMenu: null,
  ActionsMenu: null,
  HelpMenu: null,
  DebugPanel: null,
  DebugMenu: null,
  MenuPanel: null,
  TopPanel: null,
  SharePanel: null,
  CursorChatBubble: null,
  KeyboardShortcutsDialog: null,
}

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw components={components} persistenceKey="inspiration-board" />
    </div>
  )
}

export default App
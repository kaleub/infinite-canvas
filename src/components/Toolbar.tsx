import {
  DefaultToolbar,
  TldrawUiMenuItem,
  useActions,
  useIsToolSelected,
  useTools,
} from 'tldraw'

export function MinimalToolbar(props: React.ComponentProps<typeof DefaultToolbar>) {
  const tools = useTools()
  const actions = useActions()

  const isSelectSelected = useIsToolSelected(tools['select'])
  const isFrameSelected = useIsToolSelected(tools['frame'])

  return (
    <DefaultToolbar {...props}>
      <TldrawUiMenuItem {...tools['select']} isSelected={isSelectSelected} />
      <TldrawUiMenuItem
        id="insert-media"
        icon="tool-media"
        label={actions['insert-media'].label}
        onSelect={actions['insert-media'].onSelect} 
      />
      <TldrawUiMenuItem {...tools['frame']} isSelected={isFrameSelected} />
    </DefaultToolbar>
  )
}
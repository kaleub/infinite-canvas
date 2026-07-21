import {
  DefaultMainMenu,
  DefaultMainMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
} from 'tldraw'

interface CustomMainMenuProps extends React.ComponentProps<typeof DefaultMainMenu> {
  onChangeVault: () => void
}

export function CustomMainMenu({ onChangeVault, ...props }: CustomMainMenuProps) {
  return (
    <DefaultMainMenu {...props}>
      <TldrawUiMenuGroup id="vault">
        <TldrawUiMenuItem id="change-vault" label="Change Vault…" onSelect={onChangeVault} />
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  )
}
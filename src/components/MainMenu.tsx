import {
  DefaultMainMenu,
  DefaultMainMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TldrawUiMenuSubmenu,
} from 'tldraw'
import type { VaultEntry } from '../lib/vaultConfig'

interface CustomMainMenuProps extends React.ComponentProps<typeof DefaultMainMenu> {
  vaults: VaultEntry[]
  activeVaultPath: string
  onSwitchVault: (path: string) => void
  onAddVault: () => void
}

export function CustomMainMenu({
  vaults,
  activeVaultPath,
  onSwitchVault,
  onAddVault,
  ...props
}: CustomMainMenuProps) {
  return (
    <DefaultMainMenu {...props}>
      <TldrawUiMenuGroup id="vault">
        <TldrawUiMenuSubmenu id="switch-vault" label="Switch Vault">
          <TldrawUiMenuGroup id="known-vaults">
            {vaults.map((vault) => (
              <TldrawUiMenuItem
                key={vault.path}
                id={`vault-${vault.path}`}
                label={vault.path === activeVaultPath ? `✓ ${vault.name}` : vault.name}
                onSelect={() => onSwitchVault(vault.path)}
              />
            ))}
          </TldrawUiMenuGroup>
          <TldrawUiMenuGroup id="vault-actions">
            <TldrawUiMenuItem id="add-vault" label="Add Vault…" onSelect={onAddVault} />
          </TldrawUiMenuGroup>
        </TldrawUiMenuSubmenu>
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  )
}
import { FrameShapeTool } from 'tldraw'

// Subclass the built-in Frame tool with locking disabled,
// so the tool-lock toggle never appears in the toolbar for it.
export class NonLockableFrameTool extends FrameShapeTool {
  static override id = 'frame'
  override isLockable = false
}
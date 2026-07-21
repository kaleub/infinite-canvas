import type { TLUiOverrides } from 'tldraw'

// Strip tldraw down to just Select and Frame tools.
// Media insertion is handled separately via the 'insert-media' action,
// not a tool, so it isn't touched here.
export const uiOverrides: TLUiOverrides = {
  tools(_editor, tools) {
    const allowedToolIds = new Set(['select', 'frame'])
    for (const id of Object.keys(tools)) {
      if (!allowedToolIds.has(id)) {
        delete tools[id]
      }
    }
    return tools
  },
}
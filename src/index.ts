import { ExtensionContext, workspace, languages } from 'coc.nvim';

async function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('word-plus')
  const isEnabled = config.get<boolean>('enable', true)

  if (!isEnabled) {
    return false
  }

}

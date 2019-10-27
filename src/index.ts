import { ExtensionContext, workspace } from 'coc.nvim';
import { WordCompleteProvider } from './provider/completion';
import { Edict } from './provider/edict';
import { logger } from './common/logger';
import { WordHoverProvider } from './provider/hover';

export async function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('zi');
  const isEnabled = config.get<boolean>('enable', true);

  if (!isEnabled) {
    return false;
  }

  const traceServer = config.get('trace.server', 'off');
  context.subscriptions.push(logger.init(traceServer !== 'off'));

  // register edict
  const edict = new Edict(context);
  context.subscriptions.push(edict);

  // register completion provider
  context.subscriptions.push(new WordCompleteProvider(edict));

  // register hover provider
  context.subscriptions.push(new WordHoverProvider(edict));
}

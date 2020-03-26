import { ExtensionContext, workspace, listManager } from 'coc.nvim';
import { WordCompleteProvider } from './provider/completion';
import { Edict } from './provider/edict';
import { logger } from './common/logger';
import { WordHoverProvider } from './provider/hover';
import { Words } from './provider/words';
import Translations from './sources/translation';

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
  const words = new Words(context);
  context.subscriptions.push(edict);
  await words.init();

  // register completion provider
  context.subscriptions.push(new WordCompleteProvider(edict, words));

  // register hover provider
  context.subscriptions.push(new WordHoverProvider(edict));

  // register translations source
  context.subscriptions.push(listManager.registerList(new Translations()));
}

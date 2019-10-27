import { IList, ListAction, ListContext, ListTask, ListItem } from 'coc.nvim';
import colors from 'colors/safe';
import { EventEmitter } from 'events';
import { logger } from '../common/logger';
import { BingTranslator, CibaTranslator, SingleTranslation } from '../common/translator';

const log = logger.getLog('source-translations');

const targetLang = 'zh';

class Task extends EventEmitter implements ListTask {
  private translators = [
    new BingTranslator('bing'),
    new CibaTranslator('ciba'),
    new CibaTranslator('google'),
    new CibaTranslator('youdao'),
  ];
  private resCount = 0;
  private isCancel = false;

  async start(text: string) {
    this.translators.forEach(async translator => {
      const res = await translator.translate(text, targetLang);
      this.resCount += 1;
      this.updateItems(translator.name, text, res);
    });
  }

  updateItems(name: string, text: string, res: SingleTranslation) {
    if (this.isCancel) {
      return;
    }
    if (res.status === 1 && res.explain && res.explain.length) {
      const item: ListItem = {
        label: `${name} => ${colors.gray(`${text}:`)} ${colors.yellow(res.phonetic)} ${res.explain.join(' | ')}`,
      };
      this.emit('data', item);
    }
    this.checkIsDone();
  }

  checkIsDone() {
    if (this.resCount === 4) {
      this.emit('end');
    }
  }

  dispose() {
    this.isCancel = true;
    this.emit('end');
  }
}

export default class Translations implements IList {
  public readonly name = 'translators';
  public readonly interactive = true;
  public readonly description = 'translate input text using google, youdao, bing and ciba';
  public readonly defaultAction = '';
  public actions: ListAction[] = [];
  private timer: NodeJS.Timer | undefined;

  public async loadItems(context: ListContext): Promise<ListTask | ListItem[]> {
    log(`${context.input}`);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (!context.input || !context.input.trim()) {
      return [];
    }
    const task = new Task();
    this.timer = setTimeout(() => {
      task.start(context.input);
    }, 150);
    return task;
  }
}

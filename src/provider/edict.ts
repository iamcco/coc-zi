import { ExtensionContext } from 'coc.nvim';
import { MarkupKind, MarkupContent } from 'vscode-languageserver-protocol';
import { join } from 'path';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import readline from 'readline';

import { download } from '../common/download';
import { Dispose } from '../common/dispose';

export class Edict extends Dispose {
  private name = 'edict.csv';
  private url = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv';
  private storagePath: string;
  private edictPath: string;
  private edictData = new Map();

  constructor(context: ExtensionContext) {
    super();
    this.storagePath = context.storagePath;
    this.edictPath = join(this.storagePath, this.name);
    this.init();
  }

  async init() {
    const { storagePath, edictPath } = this;

    if (!existsSync(storagePath)) {
      mkdirSync(storagePath);
    }

    if (!existsSync(edictPath)) {
      await download(edictPath, this.url, this.name);
      this.readEdict();
    } else {
      this.readEdict();
    }
  }

  readEdict() {
    const { edictPath } = this;

    if (!existsSync(edictPath)) {
      return;
    }

    readline
      .createInterface({
        input: createReadStream(edictPath),
        terminal: false,
      })
      .on('line', (line: string) => {
        const items = line.split(',');
        this.edictData.set(items[0].toLowerCase(), {
          phonetic: items[1] || '',
          definition: items[2] || '',
          translation: items[3] || '',
          pos: items[4] || '',
        });
      });
  }

  getHoverByWord(word: string): MarkupContent | null {
    const words = this.edictData.get(word.toLowerCase());

    if (!words) {
      return null;
    }

    const values = this.formatDoc(word, words);

    return {
      kind: MarkupKind.Markdown,
      value: values.join('\n'),
    };
  }

  formatDoc(word: string, words: Record<string, string>) {
    let values = [`**${word}**`];
    if (words.phonetic) {
      values = values.concat(['', `**音标：**${words.phonetic}`]);
    }
    if (words.definition) {
      values = values.concat([
        '',
        '**英文解释：**',
        '',
        ...words.definition.split('\\n').map((line: string) => line.replace(/^"/, '')),
      ]);
    }
    if (words.translation) {
      values = values.concat([
        '',
        '**中文解释：**',
        '',
        ...words.translation.split('\\n').map((line: string) => line.replace(/^"/, '')),
      ]);
    }
    if (words.pos) {
      values = values.concat(['', `**词语位置：**${words.pos.replace(/\n/, ' ')}`]);
    }
    return values;
  }
}

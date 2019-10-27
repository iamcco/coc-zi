import { existsSync, createReadStream } from 'fs';
import { ExtensionContext } from 'coc.nvim';
import readline from 'readline';

export class Words {
  private wordsPath: string;
  private _words: string[] = [];

  constructor(context: ExtensionContext) {
    this.wordsPath = context.asAbsolutePath('./words/10k.txt');
    this.init();
  }

  public get words(): string[] {
    return this._words;
  }

  init() {
    const { wordsPath } = this;

    if (!existsSync(wordsPath)) {
      return;
    }

    readline
      .createInterface({
        input: createReadStream(wordsPath),
        terminal: false,
      })
      .on('line', (line: string) => {
        this._words.push(line.trim());
      });
  }
}

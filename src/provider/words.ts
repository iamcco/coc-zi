import { existsSync, createReadStream } from 'fs';
import { ExtensionContext } from 'coc.nvim';
import readline from 'readline';
import which from 'which';

import {logger} from '../common/logger';
import {execCommand} from '../common/util';

const log = logger.getLog('Words')

export class Words {
  private wordsPath: string;
  private _words: string[] = [];
  private _isUseLook: boolean = false;

  constructor(context: ExtensionContext) {
    this.wordsPath = context.asAbsolutePath('./words/10k.txt');
  }

  get isUseLook() {
    return this._isUseLook
  }

  public async getWords(str: string): Promise<string[]> {
    if (this.isUseLook) {
      const { stdout } = await execCommand(`look -f ${str}`)
      const words = (stdout || '').trim().split('\n')
      if (words.length) {
        return words
      }
    }
    return this._words;
  }

  async init() {
    try {
      const look = await which('look')
      if (!look) {
        throw new Error()
      }
      this._isUseLook = true
    } catch (error) {
      log('look command does not found, use 10k instead')
    }

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

import { existsSync, createReadStream } from 'fs';
import { ExtensionContext } from 'coc.nvim';
import readline from 'readline';
import which from 'which';

import { logger } from '../common/logger';
import { execCommand } from '../common/util';

const log = logger.getLog('Words');

const get10kWords = async (words10kPath: string): Promise<string[]> => {
  return new Promise((resolve) => {
    if (existsSync(words10kPath)) {
      const words10k: string[] = [];
      readline
        .createInterface({
          input: createReadStream(words10kPath),
          terminal: false,
        })
        .on('close', () => {
          resolve(words10k);
        })
        .on('line', (line: string) => {
          words10k.push(line.trim());
        });
    } else {
      resolve([]);
    }
  });
};

export class Words {
  private words10kPath: string;
  private words: string[] = [];

  constructor(context: ExtensionContext) {
    this.words10kPath = context.asAbsolutePath('./words/10k.txt');
  }

  public async getWords(word: string): Promise<string[]> {
    if (!this.words.length) {
      let words: string[] = [];

      const lookExist = await which('look').catch(() => {
        log('look command does not found, use 10k only');
        return false;
      });

      if (lookExist) {
        const { stdout } = await execCommand("look -f ''");
        const res = (stdout || '').trim().split('\n');
        words = res;
      }

      const words10k = await get10kWords(this.words10kPath);

      const m = words.reduce<Record<string, true>>((acc, cur) => {
        acc[cur] = true;
        return acc;
      }, {});

      for (const word of words10k) {
        if (!m[word]) {
          words.push(word);
        }
      }

      this.words = words;
    }

    return this.words.filter((w) => w.startsWith(word[0]));
  }
}

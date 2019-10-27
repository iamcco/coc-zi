import { languages, workspace } from 'coc.nvim';
import { Hover } from 'vscode-languageserver-protocol';

import { Dispose } from '../common/dispose';
import { Edict } from './edict';

function getWordByIndex(word: string, idx: number) {
  while (/[-_]/.test(word[idx])) {
    idx += 1;
  }
  if (idx == word.length) {
    idx -= 1;
    while (/[-_]/.test(word[idx])) {
      idx -= 1;
    }
  }
  if (idx < 0) {
    return '';
  }
  let start = idx;
  let end = idx + 1;
  while (start > 0) {
    if (/[A-Z]/.test(word[start])) {
      start = start;
      break;
    } else if (/[-_]/.test(word[start])) {
      start += 1;
      break;
    }
    start -= 1;
  }
  while (end < word.length) {
    if (/[A-Z_-]/.test(word[end])) {
      end -= 1;
      break;
    }
    end += 1;
  }
  return word.slice(start, end + 1);
}

export class WordHoverProvider extends Dispose {
  constructor(private edict: Edict) {
    super();
    this.registerHoverProvider();
  }

  registerHoverProvider() {
    languages.registerHoverProvider(['*'], {
      provideHover: (document, position): Hover | null => {
        const doc = workspace.getDocument(document.uri);
        if (!doc) {
          return null;
        }
        const wordRange = doc.getWordRangeAtPosition(position, '-_');
        if (!wordRange) {
          return null;
        }
        const wordText = document.getText(wordRange) || '';
        let word = wordText;
        if (!word) {
          return null;
        }
        let content = this.edict.getHoverByWord(word.toLowerCase());
        if (!content) {
          word = wordText.replace(/((\B[A-Z])|-+|_+)/g, ' $2');
          content = this.edict.getHoverByWord(word.toLowerCase());
        }
        if (!content) {
          word = getWordByIndex(wordText, position.character - wordRange.start.character);
          content = this.edict.getHoverByWord(word.toLowerCase());
        }
        if (!content) {
          return null;
        }
        return {
          contents: content,
        };
      },
    });
  }
}

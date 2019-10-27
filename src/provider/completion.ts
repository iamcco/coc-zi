import { createSourceFile, ScriptTarget, SyntaxKind } from 'typescript';
import { languages, Uri, workspace } from 'coc.nvim';
import { CompletionItem, TextDocument, Position } from 'vscode-languageserver-protocol';

import { Dispose } from '../common/dispose';
import { findNode } from '../common/util';
import { Edict } from './edict';
import words from './10k.json';
import { logger } from '../common/logger';

const log = logger.getLog('complete-provider');

export class WordCompleteProvider extends Dispose {
  private words: CompletionItem[];

  constructor(private edict: Edict) {
    super();
    this.words = (words as string[]).map(word => ({
      label: word,
      insertText: word,
    }));
    this.registerCompletionItemProvider();
  }

  private registerCompletionItemProvider() {
    log('init');
    this.push(
      languages.registerCompletionItemProvider('coc-zi', '10k', null, {
        provideCompletionItems: async (document: TextDocument, position: Position): Promise<CompletionItem[]> => {
          log(document.languageId);
          if (document.languageId !== 'javascript' && document.languageId !== 'typescript') {
            return [];
          }

          const doc = workspace.getDocument(document.uri);
          if (!doc) {
            return [];
          }
          // const word = doc.getWordRangeAtPosition(position);
          const text = document.getText();
          const offset = document.offsetAt(position);
          const sourceFile = createSourceFile(Uri.parse(document.uri).fsPath, text, ScriptTarget.ES5, true);
          const node = findNode(sourceFile, offset);
          if (!node) {
            return [];
          }
          if (node.kind === SyntaxKind.StringLiteral) {
            return this.words;
          }
          return [];
        },

        resolveCompletionItem: (item: CompletionItem): CompletionItem | null => {
          const documentation = this.edict.getHoverByWord(item.label);
          if (!documentation) {
            return item;
          }
          return {
            ...item,
            documentation,
          };
        },
      }),
    );
  }
}

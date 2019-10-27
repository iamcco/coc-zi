import { languages, Uri, workspace } from 'coc.nvim';
import { createSourceFile, ScriptTarget } from 'typescript';
import { CompletionItem, TextDocument, Position, Range } from 'vscode-languageserver-protocol';

import { Dispose } from '../common/dispose';
import { findNode } from '../common/util';
import { Edict } from './edict';
import words from './10k.json';
import { logger } from '../common/logger';

const log = logger.getLog('complete-provider');

const syntaxKindsValues: Record<string, number> = {
  StringLiteral: 10,
  NoSubstitutionTemplateLiteral: 14,
  TemplateHead: 15,
  TemplateTail: 16,
  TemplateMiddle: 17,
};

export class WordCompleteProvider extends Dispose {
  private words: CompletionItem[];
  private patterns: Record<string, string[]>;
  private syntaxKinds: Record<string, string[]>;

  constructor(private edict: Edict) {
    super();
    const config = workspace.getConfiguration('zi');
    this.patterns = config.get('patterns', {});
    this.syntaxKinds = config.get('syntaxKinds', {});
    this.words = (words as string[]).map(word => ({
      label: word,
      insertText: word,
    }));
    this.registerCompletionItemProvider();
    log('init');
  }

  private registerCompletionItemProvider() {
    this.push(
      languages.registerCompletionItemProvider(
        'coc-zi',
        '10k',
        null,
        {
          provideCompletionItems: async (document: TextDocument, position: Position): Promise<CompletionItem[]> => {
            const { languageId, uri } = document;
            const patterns = this.patterns[languageId];
            const syntaxKinds = this.syntaxKinds[languageId];
            // if enable for the languageId
            if (!patterns) {
              return [];
            }

            const doc = workspace.getDocument(uri);
            if (!doc) {
              return [];
            }
            const wordRange = doc.getWordRangeAtPosition(Position.create(position.line, position.character - 1));
            if (!wordRange) {
              return [];
            }
            const word = document.getText(wordRange);
            log(`current word: ${word}`);
            const linePre = document.getText(Range.create(Position.create(position.line, 0), position));
            if (!patterns.length || patterns.some(p => new RegExp(p).test(linePre))) {
              return this.getWords(word);
            } else if (syntaxKinds && syntaxKinds.length) {
              const text = document.getText();
              const offset = document.offsetAt(position);
              const sourceFile = createSourceFile(Uri.parse(uri).fsPath, text, ScriptTarget.ES5, true);
              const node = findNode(sourceFile, offset);

              if (!node) {
                return [];
              }

              if (syntaxKinds.some(sk => node.kind === syntaxKindsValues[sk])) {
                return this.getWords(word);
              }
            }
            return [];
          },

          resolveCompletionItem: (item: CompletionItem): CompletionItem | null => {
            const documentation = this.edict.getHoverByWord(item.label.toLowerCase());
            if (!documentation) {
              return item;
            }
            return {
              ...item,
              documentation,
            };
          },
        },
        [],
        1,
      ),
    );
  }

  getWords(word: string) {
    if (/^[A-Z]/.test(word)) {
      return this.words.map(w => {
        const label = `${w.label[0].toUpperCase()}${w.label.slice(1)}`;
        return {
          label,
          insertText: label,
        };
      });
    }
    return this.words;
  }
}

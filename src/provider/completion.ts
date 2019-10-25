import { createSourceFile, ScriptTarget } from 'typescript'
import { languages, Uri, workspace } from 'coc.nvim'
import { CompletionItem, TextDocument, Position } from 'vscode-languageserver-types'

import {Dispose} from '../common/dispose'

class WordCompleteProvider extends Dispose {

  constructor() {
    super()
    this.push(
      languages.registerCompletionItemProvider(
        'word-plus',
        'word',
        '*',
        {
          provideCompletionItems: async (document: TextDocument, position: Position): Promise<CompletionItem[]> => {
            if (
              document.languageId !== 'javascript'
            ) {
              return []
            }

            const doc = workspace.getDocument(document.uri)
            if (!doc) {
              return []
            }
            const word = doc.getWordRangeAtPosition(position)
            const text = document.getText()
            const offset = document.offsetAt(position)
            const sourceFile = createSourceFile(Uri.parse(document.uri).fsPath, text, ScriptTarget.ES5, true)
            return []
          }
        }
      )
    )
  }
}

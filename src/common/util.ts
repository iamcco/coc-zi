import { Node, SourceFile, forEachChild } from 'typescript'
import { MarkupContent, MarkupKind } from 'vscode-languageserver-types';

export function findNode(sourceFile: SourceFile, offset: number): Node | undefined {
  function find(node: Node): Node | undefined {
    if (offset >= node.getStart() && offset <= node.getEnd()) {
      const res = forEachChild(node, find) || node;
      return res
    }
  }
  return find(sourceFile);
}

export function marketUp (content: string | string[]): MarkupContent {
  return {
    kind: MarkupKind.Markdown,
    value: [
      '``` markdown',
      ...[].concat(content),
      '```'
    ].join('\n')
  }
}

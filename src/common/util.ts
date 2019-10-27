import { Node, SourceFile, forEachChild } from 'typescript';
import { MarkupContent, MarkupKind } from 'vscode-languageserver-protocol';

export function findNode(sourceFile: SourceFile, offset: number): Node | undefined {
  function find(node: Node): Node | undefined {
    if (offset >= node.getStart() && offset <= node.getEnd()) {
      const res = forEachChild(node, find) || node;
      return res;
    }
  }
  return find(sourceFile);
}

export function marketUp(content: string | string[]): MarkupContent {
  return {
    kind: MarkupKind.Markdown,
    value: ['``` markdown', ...([] as string[]).concat(content), '```'].join('\n'),
  };
}

export function getWordByIndex(word: string, idx: number) {
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

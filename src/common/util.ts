import { ExecOptions, exec } from 'child_process';
import crypto from 'crypto';
import { Node, SourceFile, forEachChild } from 'typescript';
import { MarkupContent, MarkupKind } from 'vscode-languageserver-protocol';
import { configure, xhr, XHROptions } from 'request-light';
import { workspace } from 'coc.nvim';

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

function urlencode(data: Record<string, string>): string {
  return Object.keys(data)
    .map(key => [key, data[key]].map(encodeURIComponent).join('='))
    .join('&');
}

export async function request(
  type: string,
  url: string,
  data?: Record<string, string>,
  headers?: Record<string, string>,
  responseType = 'json',
): Promise<any> {
  const httpConfig = workspace.getConfiguration('http');
  configure(httpConfig.get<string>('proxy', ''), httpConfig.get<boolean>('proxyStrictSSL', false));

  if (!headers) {
    headers = {
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    };
  }

  let queryParams;
  if (type === 'POST') {
    queryParams = JSON.stringify(data);
  } else if (data) {
    url = url + '?' + urlencode(data);
  }

  const options: XHROptions = {
    type,
    url,
    data: queryParams || undefined,
    headers,
    timeout: 5000,
    followRedirects: 5,
    responseType,
  };

  try {
    const response = await xhr(options);
    const { responseText } = response;
    if (responseType === 'json') {
      return JSON.parse(responseText);
    } else {
      return responseText;
    }
  } catch (e) {
    // TODO log
    return;
  }
}

export function md5(str: string): string {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
}

export const execCommand = (
  command: string,
  options: ExecOptions = {},
): Promise<{
  code: number;
  err: Error | null;
  stdout: string;
  stderr: string;
}> => {
  return new Promise(resolve => {
    let code = 0;
    exec(
      command,
      {
        encoding: 'utf-8',
        ...options,
      },
      (err: Error | null, stdout = '', stderr = '') => {
        resolve({
          code,
          err,
          stdout,
          stderr,
        });
      },
    ).on('exit', (co: number) => co && (code = co));
  });
};

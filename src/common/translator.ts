/*
 * code from https://github.com/voldikss/coc-translator/blob/master/src/commands/translator.ts
 */
import { md5, request } from './util';

/**
 * Single translation from one engine
 *
 * @param engine Translation engine name
 * @param phonetic
 * @param paraphrase Used for `replaceWord` function
 * @param explain More detailes
 * @param href A link use which to get translation
 * @param status 1 if translation succeeds
 */
export interface SingleTranslation {
  engine: string;
  phonetic: string;
  paraphrase: string;
  explain: string[];
  status: number;
}

class Translator {
  constructor(public name: string) {}
}

class SingleResult implements SingleTranslation {
  public paraphrase = '';
  public phonetic = '';
  public explain: string[] = [];
  public status = 0;
  constructor(public engine: string) {}
}

export class BingTranslator extends Translator {
  constructor(name: string) {
    super(name);
  }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult(this.name);

    if (toLang === undefined) return result;
    let url = 'http://bing.com/dict/SerpHoverTrans';
    if (/^zh/.test(toLang)) url = 'http://cn.bing.com/dict/SerpHoverTrans';
    url += '?q=' + encodeURI(text);

    const headers = {
      Host: 'cn.bing.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    const resp = await request('GET', url, {}, headers, 'document');
    if (!resp) return result;
    result.phonetic = this.getPhonetic(resp);
    result.explain = this.getExplain(resp);
    result.status = 1;
    return result;
  }

  private getPhonetic(html: string): string {
    // there is a blank here \] <\/span>
    const re = /<span class="ht_attr" lang=".*?">\[(.*?)\] <\/span>/g;
    const match = re.exec(html);
    if (match) {
      return match[1];
    } else {
      return '';
    }
  }

  private getExplain(html: string): string[] {
    const re = /<span class="ht_pos">(.*?)<\/span><span class="ht_trs">(.*?)<\/span>/g;
    const explain = [];
    let expl = re.exec(html);
    while (expl) {
      explain.push(`${expl[1]} ${expl[2]} `);
      expl = re.exec(html);
    }
    return explain;
  }
}

export class CibaTranslator extends Translator {
  constructor(name: string) {
    super(name);
  }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult(this.name);

    if (toLang === undefined) return result;
    const url = `https://fy.iciba.com/ajax.php`;
    const data: Record<string, string> = {};
    data['a'] = 'fy';
    data['w'] = text;
    data['f'] = 'auto';
    data['t'] = toLang;
    const obj = await request('GET', url, data);

    if (!obj || !('status' in obj)) {
      // TODO log
      return result;
    }

    if ('ph_en' in obj['content']) result.phonetic = `${obj['content']['ph_en']}`;
    if ('out' in obj['content']) result.paraphrase = `${obj['content']['out']}`;
    if ('word_mean' in obj['content']) result.explain = obj['content']['word_mean'];
    result.status = 1;
    return result;
  }
}

export class GoogleTranslator extends Translator {
  constructor(name: string) {
    super(name);
  }

  private getParaphrase(obj: Record<string, string[]>): string {
    let paraphrase = '';
    for (const x of obj[0]) {
      if (x[0]) {
        paraphrase += x[0];
      }
    }
    return paraphrase;
  }

  private getExplain(obj: Record<string, string[][][][]>): string[] {
    const explains = [];
    if (obj[1]) {
      for (const expl of obj[1]) {
        let str = `[${expl[0][0]}] `;
        str += expl[2].map((i: string[]) => i[0]).join(', ');
        explains.push(str);
      }
    }
    return explains;
  }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult(this.name);

    if (toLang === undefined) return result;
    let host = 'translate.googleapis.com';
    if (/^zh/.test(toLang)) {
      host = 'translate.google.cn';
    }

    const url =
      `https://${host}/translate_a/single?client=gtx&sl=auto&tl=${toLang}` +
      `&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&q=${encodeURI(text)}`;

    const obj = await request('GET', url);
    if (!obj) {
      // TODO log
      return result;
    }
    result.paraphrase = this.getParaphrase(obj);
    result.explain = this.getExplain(obj);
    result.status = 1;
    return result;
  }
}

// TODO: use non-standard api
// e.g. https://github.com/voldikss/vim-translate-me/blob/41db2e5fed033e2be9b5c7458d7ae102a129643d/autoload/script/query.py#L264
// currently it doesn't work, always get "errorCode:50"
export class YoudaoTranslator extends Translator {
  constructor(name: string) {
    super(name);
  }

  public async translate(text: string, toLang: string): Promise<SingleTranslation> {
    const result = new SingleResult(this.name);

    if (toLang === undefined) return result;
    const url = 'https://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule';
    const salt = `${new Date().getTime()}`;
    const sign = md5('fanyideskweb' + text + salt + 'ebSeFb%=XZ%T[KZ)c(sy!');
    const data: Record<string, string> = {
      i: text,
      from: 'auto',
      to: toLang,
      smartresult: 'dict',
      client: 'fanyideskweb',
      salt,
      sign,
      doctype: 'json',
      version: '2.1',
      keyfrom: 'fanyi.web',
      action: 'FY_BY_CL1CKBUTTON',
      typoResult: 'true',
    };
    const headers = {
      Cookie: 'OUTFOX_SEARCH_USER_ID=-2022895048@10.168.8.76;',
      Referer: 'http://fanyi.youdao.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; rv:51.0) Gecko/20100101 Firefox/51.0',
    };
    const obj = await request('POST', url, data, headers);

    if (!obj) {
      // TODO log
      return result;
    } else if ('errorCode' in obj) {
      // TODO log
      return result;
    }

    result.paraphrase = this.getParaphrase(obj);
    result.explain = this.getExplain(obj);
    result.status = 1;
    return result;
  }

  private getParaphrase(obj: Record<string, Record<string, string>[][]>): string {
    if (!obj['translateResult']) {
      return '';
    }
    let paraphrase = '';
    const translateResult = obj['translateResult'];
    for (const n of translateResult) {
      const part = [];
      for (const m of n) {
        const x = m['tat'];
        if (x) {
          part.push(x);
        }
      }
      if (part) {
        paraphrase += part.join(', ');
      }
    }
    return paraphrase;
  }

  private getExplain(obj: Record<string, Record<string, string>>): string[] {
    if (!('smartResult' in obj)) {
      return [];
    }
    const smarts = obj['smartResult']['entries'];
    const explain = [];
    for (let entry of smarts) {
      if (entry) {
        entry = entry.replace('\r', '');
        entry = entry.replace('\n', '');
        explain.push(entry);
      }
    }
    return explain;
  }
}

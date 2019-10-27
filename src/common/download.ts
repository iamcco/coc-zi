import fs from 'fs';
import tunnel from 'tunnel';
import got from 'got';
import { workspace } from 'coc.nvim';
import { Agent } from 'http';

function getAgent(): Agent | undefined {
  const proxy = workspace.getConfiguration('http').get<string>('proxy', '');
  if (proxy) {
    const auth = proxy.includes('@') ? proxy.split('@', 2)[0] : '';
    const parts = auth.length ? proxy.slice(auth.length + 1).split(':') : proxy.split(':');
    if (parts.length > 1) {
      const agent = tunnel.httpsOverHttp({
        proxy: {
          headers: {},
          host: parts[0],
          port: parseInt(parts[1], 10),
          proxyAuth: auth,
        },
      });
      return agent;
    }
  }
}

export async function download(path: string, url: string, name: string): Promise<void> {
  const statusItem = workspace.createStatusBarItem(0, { progress: true });
  statusItem.text = `Downloading ${name} data...`;
  statusItem.show();

  const agent = getAgent();

  return new Promise((resolve, reject) => {
    try {
      got
        .stream(url, { agent })
        .on('downloadProgress', (progress: any) => {
          const p = (progress.percent * 100).toFixed(0);
          statusItem.text = `${p}% Downloading ${name} data`;
        })
        .pipe(fs.createWriteStream(path))
        .on('end', () => {
          statusItem.hide();
          resolve();
        })
        .on('close', () => {
          statusItem.hide();
          resolve();
        })
        .on('error', e => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

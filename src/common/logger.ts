import { OutputChannel, workspace } from 'coc.nvim';

import { Dispose } from './dispose';

class Logger extends Dispose {
  private outputChannel: OutputChannel | undefined;

  constructor() {
    super();
  }

  init(enabled: boolean): Logger {
    if (!enabled) {
      return this;
    }
    this.outputChannel = workspace.createOutputChannel('zi');
    return this;
  }

  getLog(name: string) {
    return (message: string) => {
      if (!this.outputChannel) {
        return;
      }
      this.outputChannel.appendLine(`${name}: ${message}`);
    };
  }

  dispose() {
    super.dispose();
    if (this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = undefined;
    }
  }
}

export const logger = new Logger();

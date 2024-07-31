import * as vscode from 'vscode';
import * as http from 'http';
import { focusWorkspaceWindow } from './focus-workspace';
import { log } from '../log';

interface Payload {
  fn: string;
  args: string[];
}

function isPayload(obj: any): obj is Payload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'fn' in obj &&
    'args' in obj &&
    typeof obj.fn === 'string' &&
    Array.isArray(obj.args) &&
    obj.args.every((arg: any) => typeof arg === 'string')
  );
}

export function activate(context: vscode.ExtensionContext) {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/rpc') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          res.end(handleBody(body));
        } catch (err) {
          res.end(`${err}`);
        }
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.listen(7227, () => {
    log('Server listening on port 7227');
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      log(`Address in use: ${e}`);
    }
  });

  context.subscriptions.push({
    dispose: () => server.close(),
  });
}

function handleBody(body: string): string {
  let data: any;
  try {
    data = JSON.parse(body);
  } catch (err) {
    return `Could not parse body ${body}: ${err}`;
  }
  if (!isPayload(data)) {
    return `Invalid payload: ${JSON.stringify(data)}`;
  }
  try {
    return handleRequest(data.fn, data.args);
  } catch (err) {
    return `Error while handling request (${data}): ${err}`;
  }
}

function handleRequest(fn: string, args: string[]): string {
  switch (fn) {
    case 'focus-workspace':
      focusWorkspaceWindow(args[0]);
  }
  return '';
}

export function deactivate() {}

import * as vscode from 'vscode';
import * as http from 'http';
import { focusWorkspaceWindow } from './focus-workspace';
import { openFileAtLine } from './open-file';
import { log } from '../log';

export const PORT = 7227;

// The port this window's server actually bound. Other windows may already
// hold PORT, in which case we fall back to an ephemeral port; the rgi
// command always uses getPort(), so its POSTs come back to this window.
let boundPort = PORT;

export function getPort(): number {
  return boundPort;
}

interface Payload {
  fn: string;
  args: string[];
}

interface OpenPayload {
  file: string;
  line: number;
  focus: boolean;
}

function isOpenPayload(obj: any): obj is OpenPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.file === 'string' &&
    typeof obj.line === 'number' &&
    typeof obj.focus === 'boolean'
  );
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
      readBody(req, (body) => {
        try {
          res.end(handleBody(body));
        } catch (err) {
          res.end(`${err}`);
        }
      });
    } else if (req.method === 'POST' && req.url === '/open') {
      readBody(req, (body) => {
        res.end(handleOpen(body));
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.on('listening', () => {
    const address = server.address();
    if (address && typeof address === 'object') {
      boundPort = address.port;
    }
    log(`Server listening on port ${boundPort}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      log(`Port ${PORT} in use (another window?); using an ephemeral port`);
      server.listen(0, '127.0.0.1');
    } else {
      log(`Server error: ${e}`);
    }
  });

  server.listen(PORT, '127.0.0.1');

  context.subscriptions.push({
    dispose: () => server.close(),
  });
}

function readBody(req: http.IncomingMessage, done: (body: string) => void) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => done(body));
}

function handleOpen(body: string): string {
  let data: any;
  try {
    data = JSON.parse(body);
  } catch (err) {
    return `Could not parse body ${body}: ${err}`;
  }
  if (!isOpenPayload(data)) {
    return `Invalid payload: ${JSON.stringify(data)}`;
  }
  openFileAtLine(data.file, data.line, data.focus);
  return '';
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

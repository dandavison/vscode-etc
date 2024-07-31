import * as vscode from 'vscode';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const data = JSON.parse(body);
        handleRequest(data);
        res.end('Request processed');
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.listen(7777, () => {
    console.log('Server listening on port 7777');
  });

  context.subscriptions.push({
    dispose: () => server.close(),
  });
}

function handleRequest(data: any) {
  console.log('Received data:', data);
  vscode.commands.executeCommand('etc.magitStatus');
}

export function deactivate() {}

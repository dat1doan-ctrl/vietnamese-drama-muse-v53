import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const widgetHtml = readFileSync('public/widget.html', 'utf8');
const RESOURCE_URI = 'ui://vietnamese-drama-muse/configurator.html';

function createDramaServer() {
  const server = new McpServer({
    name: 'vietnamese-drama-muse-v53',
    version: '5.3.0',
  });

  registerAppResource(
    server,
    'vietnamese-drama-muse-configurator',
    RESOURCE_URI,
    {},
    async () => ({
      contents: [{
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml,
      }],
    })
  );

  registerAppTool(
    server,
    'open_drama_configurator',
    {
      title: 'Mở bảng cấu hình Drama Việt Nam',
      description: 'Hiển thị bảng radio-button để chọn nguồn truyện, thể loại, thời lượng, clip Muse, giọng MC, tỷ lệ lời bình/thoại, chế độ âm thanh, kết thúc và phong cách.',
      inputSchema: {},
      outputSchema: {
        ready: z.boolean(),
        defaultMinutes: z.number(),
        defaultClipSeconds: z.number(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: RESOURCE_URI },
        'openai/outputTemplate': RESOURCE_URI,
        'openai/toolInvocation/invoking': 'Đang mở bảng cấu hình Drama…',
        'openai/toolInvocation/invoked': 'Đã mở bảng cấu hình Drama',
      },
    },
    async () => ({
      content: [{ type: 'text', text: 'Bảng cấu hình Vietnamese Drama Muse đã sẵn sàng.' }],
      structuredContent: {
        ready: true,
        defaultMinutes: 5,
        defaultClipSeconds: 15,
      },
    })
  );

  return server;
}

const port = Number(process.env.PORT ?? 10000);
const MCP_PATH = '/mcp';

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Missing URL');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, mcp-session-id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Vietnamese Drama Muse V5.3 MCP server');
    return;
  }

  const methods = new Set(['POST', 'GET', 'DELETE']);
  if (url.pathname === MCP_PATH && req.method && methods.has(req.method)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    const server = createDramaServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) res.writeHead(500).end('Internal server error');
    }
    return;
  }

  res.writeHead(404).end('Not Found');
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Vietnamese Drama Muse MCP server listening on ${port}${MCP_PATH}`);
});

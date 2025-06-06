#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

async function createApiRoute() {
  console.log('🚀 Create New API Route\n');

  // Get route path
  const routePath = await askQuestion('API route path (e.g., users/create): ');
  if (!routePath) {
    console.error('❌ Route path is required');
    process.exit(1);
  }

  // Get HTTP methods
  const methods = await askQuestion('HTTP methods (GET,POST,PUT,DELETE) [GET,POST]: ') || 'GET,POST';
  const methodList = methods.split(',').map(m => m.trim().toUpperCase());

  // Get runtime
  const runtime = await askQuestion('Runtime (edge/nodejs) [edge]: ') || 'edge';

  // Get if it needs auth
  const needsAuth = await askQuestion('Requires authentication? (y/n) [y]: ') !== 'n';

  // Parse route path
  const routeParts = routePath.split('/').map(part => toKebabCase(part));
  const routeName = toPascalCase(routeParts[routeParts.length - 1]);

  // Create directory structure
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api', ...routeParts);
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Type definitions
  const typeDefinitions = `// Type definitions for ${routeName} API
export interface ${routeName}Request {
  // Add your request fields here
  example?: string;
}

export interface ${routeName}Response {
  // Add your response fields here
  success: boolean;
  data?: any;
  error?: string;
}
`;

  // Route template
  const routeContent = `import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { ValidationError, AuthenticationError } from '@/lib/errors';
${needsAuth ? "import { getServerSession } from '@/lib/auth/session';" : ''}

export const runtime = '${runtime}';

${typeDefinitions}

${methodList.map(method => `export const ${method} = withErrorHandler(async (request: NextRequest) => {${needsAuth ? `
  // Check authentication
  const session = await getServerSession(request);
  if (!session) {
    throw new AuthenticationError();
  }` : ''}
  
  ${method === 'GET' ? `// Handle query parameters
  const { searchParams } = new URL(request.url);
  const example = searchParams.get('example');
  
  // TODO: Implement your GET logic here
  
  return NextResponse.json({
    success: true,
    data: {
      example,
      message: '${routeName} data retrieved successfully'
    }
  });` : `// Parse request body
  const body = await request.json() as ${routeName}Request;
  
  // Validate request
  if (!body.example) {
    throw new ValidationError('Example field is required');
  }
  
  // TODO: Implement your ${method} logic here
  
  return NextResponse.json({
    success: true,
    data: {
      message: '${routeName} ${method.toLowerCase()} successful'
    }
  });`}
}, { path: '/api/${routeParts.join('/')}' });`).join('\n\n')}
`;

  // Test file template
  const testContent = `import { ${methodList.join(', ')} } from './route';
import { NextRequest } from 'next/server';

// Mock the auth session
jest.mock('@/lib/auth/session', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'test-user' } })
}));

describe('/api/${routeParts.join('/')}', () => {${methodList.map(method => `
  describe('${method}', () => {
    it('should handle ${method} request successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/${routeParts.join('/')}', {
        method: '${method}',${method !== 'GET' ? `
        body: JSON.stringify({ example: 'test' }),` : ''}
      });

      const response = await ${method}(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });${needsAuth ? `

    it('should return 401 when not authenticated', async () => {
      const { getServerSession } = require('@/lib/auth/session');
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/${routeParts.join('/')}', {
        method: '${method}',
      });

      const response = await ${method}(request);
      expect(response.status).toBe(401);
    });` : ''}
  });`).join('\n')}
});
`;

  // Documentation template
  const docContent = `# API Documentation: ${routeName}

## Endpoint
\`\`\`
/api/${routeParts.join('/')}
\`\`\`

## Authentication
${needsAuth ? '✅ Required' : '❌ Not required'}

## Methods

${methodList.map(method => `### ${method}

${method === 'GET' ? `**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| example | string | No | Example parameter |` : `**Request Body:**
\`\`\`json
{
  "example": "string"
}
\`\`\``}

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "message": "string"
  }
}
\`\`\`

**Error Responses:**
- \`400\` - Validation error
- \`401\` - Authentication required
- \`500\` - Internal server error
`).join('\n')}

## Example Usage

### JavaScript/TypeScript
\`\`\`typescript
const response = await fetch('/api/${routeParts.join('/')}', {
  method: '${methodList[0]}',${methodList[0] !== 'GET' ? `
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    example: 'value'
  })` : ''}
});

const data = await response.json();
\`\`\`
`;

  // Write files
  const routeFilePath = path.join(apiDir, 'route.ts');
  const testFilePath = path.join(apiDir, 'route.test.ts');
  const docFilePath = path.join(apiDir, 'README.md');

  fs.writeFileSync(routeFilePath, routeContent);

  // Ask if they want test files
  const createTests = await askQuestion('Create test file? (y/n) [y]: ');
  if (createTests !== 'n') {
    fs.writeFileSync(testFilePath, testContent);
  }

  // Ask if they want documentation
  const createDocs = await askQuestion('Create API documentation? (y/n) [y]: ');
  if (createDocs !== 'n') {
    fs.writeFileSync(docFilePath, docContent);
  }

  console.log(`\n✅ API route created successfully!`);
  console.log(`📁 Location: ${apiDir}`);
  console.log(`\n📝 Endpoint: /api/${routeParts.join('/')}`);
  console.log(`🔧 Methods: ${methodList.join(', ')}`);

  rl.close();
}

createApiRoute().catch(console.error);
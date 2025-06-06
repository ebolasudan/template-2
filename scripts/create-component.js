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

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

async function createComponent() {
  console.log('🚀 Create New Component\n');

  // Get component name
  const name = await askQuestion('Component name (e.g., UserProfile): ');
  if (!name) {
    console.error('❌ Component name is required');
    process.exit(1);
  }

  const componentName = toPascalCase(name);
  
  // Get component type
  const type = await askQuestion('Component type (client/server) [client]: ') || 'client';
  
  // Get component category
  const category = await askQuestion('Category (ui/feature/layout) [ui]: ') || 'ui';
  
  // Determine directory
  const baseDir = path.join(process.cwd(), 'src', 'components');
  const categoryDir = path.join(baseDir, category);
  const componentDir = path.join(categoryDir, componentName);

  // Create directories
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Component template
  const componentContent = `${type === 'client' ? "'use client';\n\n" : ''}import React from 'react';

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export default function ${componentName}({ 
  className = '',
  children 
}: ${componentName}Props) {
  return (
    <div className={\`\${className}\`}>
      {children || '${componentName} Component'}
    </div>
  );
}
`;

  // Index file for easier imports
  const indexContent = `export { default } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;

  // Test file template
  const testContent = `import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName} Component')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<${componentName} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders children', () => {
    render(<${componentName}>Test Content</${componentName}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
`;

  // Story file template (for Storybook)
  const storyContent = `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: '${category}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'p-4 bg-gray-100 rounded',
  },
};

export const WithChildren: Story = {
  args: {
    children: 'Custom content goes here',
  },
};
`;

  // Write files
  const componentPath = path.join(componentDir, `${componentName}.tsx`);
  const indexPath = path.join(componentDir, 'index.ts');
  const testPath = path.join(componentDir, `${componentName}.test.tsx`);
  const storyPath = path.join(componentDir, `${componentName}.stories.tsx`);

  fs.writeFileSync(componentPath, componentContent);
  fs.writeFileSync(indexPath, indexContent);
  
  // Ask if they want test files
  const createTests = await askQuestion('Create test file? (y/n) [y]: ');
  if (createTests !== 'n') {
    fs.writeFileSync(testPath, testContent);
  }

  // Ask if they want story files
  const createStory = await askQuestion('Create Storybook story? (y/n) [n]: ');
  if (createStory === 'y') {
    fs.writeFileSync(storyPath, storyContent);
  }

  console.log(`\n✅ Component created successfully!`);
  console.log(`📁 Location: ${componentDir}`);
  console.log(`\n📝 Usage:`);
  console.log(`   import ${componentName} from '@/components/${category}/${componentName}';`);

  rl.close();
}

createComponent().catch(console.error);
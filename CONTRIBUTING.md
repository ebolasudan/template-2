# Contributing to AI Template

Thank you for your interest in contributing to the AI Template! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Firebase project (for authentication and storage)
- API keys for AI services you want to test

### Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/template-2.git
   cd template-2
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 🎨 Code Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` types unless absolutely necessary
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Separate business logic into custom hooks
- Follow the single responsibility principle
- Use proper prop types with TypeScript interfaces

### File Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── feature/          # Feature-specific components
│   └── layout/           # Layout components
├── lib/                   # Utilities and configuration
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Styling and themes
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `APIResponse`)

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add multi-provider AI router
fix: resolve authentication error on reload
docs: update README with new installation steps
refactor: extract common validation logic
```

## 🧪 Testing

### Running Tests

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Writing Tests

- Write unit tests for utility functions
- Test React components with React Testing Library
- Include integration tests for API routes
- Test error boundaries and edge cases

## 📝 Documentation

### API Documentation

- Document all API routes with JSDoc comments
- Include request/response examples
- Document error cases and status codes

### Component Documentation

- Use JSDoc for component props
- Include usage examples in Storybook
- Document any complex behavior or edge cases

### README Updates

- Update README.md for significant changes
- Include migration guides for breaking changes
- Keep setup instructions current

## 🔒 Security Guidelines

### API Keys and Secrets

- Never commit API keys or secrets
- Use environment variables for all sensitive data
- Review .env.example for required variables

### Input Validation

- Validate all user inputs
- Sanitize data before processing
- Use proper error handling

### Authentication

- Follow Firebase Auth best practices
- Validate user sessions on API routes
- Implement proper rate limiting

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment details** (OS, Node.js version, browser)
2. **Steps to reproduce** the issue
3. **Expected vs actual behavior**
4. **Error messages** or screenshots
5. **Minimal code example** if applicable

### Feature Requests

For feature requests, please include:

1. **Use case description** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - Other approaches you've thought of
4. **Additional context** - Screenshots, examples, etc.

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows our style guidelines
- [ ] Self-review of your code completed
- [ ] Tests added for new functionality
- [ ] All tests pass locally
- [ ] Documentation updated if needed
- [ ] No merge conflicts with main branch

### PR Description

Include in your PR description:

1. **Summary** of changes made
2. **Motivation** for the changes
3. **Testing** performed
4. **Screenshots** for UI changes
5. **Breaking changes** if any

### Review Process

1. Automated checks must pass (linting, tests, etc.)
2. At least one maintainer review required
3. Address all review feedback
4. Maintain a clean commit history

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Security enhancements
- Documentation improvements

### Medium Priority
- New UI components
- Additional AI provider integrations
- Testing infrastructure
- Developer experience improvements

### Ideas Welcome
- Example applications using the template
- Integration with other services
- Accessibility improvements
- Mobile responsiveness

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Ask questions when you're unsure
- Share knowledge and best practices

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Discord** - [Join our community](https://discord.gg/your-invite) (if applicable)

Thank you for contributing to make this template better for everyone! 🎉
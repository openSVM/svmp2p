# Contributing Guide

## Overview
This document provides guidelines for contributing to the SVMP2P project. It covers the development workflow, coding standards, testing requirements, and pull request process.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Management](#issue-management)
- [Documentation Guidelines](#documentation-guidelines)
- [Community Resources](#community-resources)

## Code of Conduct

Our project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@opensvm.com.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites
Before you begin contributing, ensure you have:
- Read the [README.md](./README.md) and [Installation Guide](./installation-guide.md)
- Set up your development environment
- Familiarized yourself with the project structure and architecture

### First-time Contributors
If this is your first contribution:
1. Fork the repository on GitHub
2. Clone your fork locally
3. Add the upstream repository as a remote
4. Create a new branch for your work
5. Make your changes
6. Submit a pull request

## Development Workflow

### Branching Strategy
We follow a feature branch workflow:
- `master`: Main branch, always deployable
- `feature/*`: Feature branches for new features or enhancements
- `bugfix/*`: Bug fix branches
- `docs/*`: Documentation updates
- `refactor/*`: Code refactoring without changing functionality

### Branch Naming Convention
Branch names should follow this pattern:
```
<type>/<issue-number>-<short-description>
```

Examples:
- `feature/42-add-notification-system`
- `bugfix/57-fix-transaction-error`
- `docs/63-update-api-documentation`

### Commit Messages
Commit messages should be clear and descriptive, following these guidelines:
- Use the imperative mood ("Add feature" not "Added feature")
- First line is a summary (max 50 characters)
- Optionally followed by a blank line and detailed explanation
- Reference issue numbers at the end of the summary line

Example:
```
Add notification system (Issue #42)

- Implement toast notifications
- Create notification center dropdown
- Add persistent storage for notifications
- Write tests for notification components
```

## Coding Standards

### JavaScript/TypeScript
- Follow the ESLint configuration provided in the project
- Use ES6+ features when appropriate
- Use async/await for asynchronous code
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

### React Components
- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use prop-types or TypeScript for type checking
- Follow the component structure outlined in the [Frontend Components](./frontend-components.md) documentation

### CSS/Styling
- Use the project's theming system and CSS variables
- Follow BEM naming convention for custom classes
- Ensure responsive design for all components
- Test on multiple screen sizes

### Rust (Smart Contracts)
- Follow Rust's official style guidelines
- Document public functions and types
- Write comprehensive tests for all functionality
- Handle errors appropriately
- Optimize for gas efficiency

## Testing Guidelines

### Required Tests
All code contributions must include appropriate tests:

#### Frontend Tests
- Unit tests for utility functions
- Component tests for React components
- Integration tests for complex interactions
- Snapshot tests for UI components

#### Smart Contract Tests
- Unit tests for individual functions
- Integration tests for contract interactions
- Edge case tests for error conditions
- Gas optimization tests

### Running Tests
Before submitting a pull request, ensure all tests pass:

```bash
# Frontend tests
npm test

# Smart contract tests
cd programs/p2p-exchange
cargo test-bpf
```

### Test Coverage
Aim for high test coverage, especially for critical functionality:
- New features should have at least 80% test coverage
- Bug fixes must include tests that reproduce the bug

## Pull Request Process

### Before Creating a PR
1. Ensure your code follows the project's coding standards
2. Run all tests and make sure they pass
3. Update documentation if necessary
4. Rebase your branch on the latest master

### Creating a PR
1. Create a pull request from your feature branch to master
2. Fill out the PR template completely
3. Link the PR to any relevant issues
4. Request reviews from appropriate team members

### PR Description
Your PR description should include:
- A clear explanation of the changes
- The motivation for the changes
- Any breaking changes or deprecations
- Screenshots for UI changes
- Steps to test the changes

### Review Process
1. At least one approval is required before merging
2. Address all review comments
3. Ensure CI checks pass
4. Maintainers will merge approved PRs

## Issue Management

### Creating Issues
When creating a new issue:
- Use the appropriate issue template
- Provide a clear, descriptive title
- Include detailed reproduction steps for bugs
- Add relevant labels
- Assign to yourself if you plan to work on it

### Issue Labels
We use the following labels to categorize issues:
- `bug`: Something isn't working as expected
- `enhancement`: New feature or improvement
- `documentation`: Documentation updates
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority: high/medium/low`: Indicates priority level

### Working on Issues
1. Comment on the issue to express interest
2. Wait for assignment from a maintainer
3. Create a branch following the naming convention
4. Reference the issue in commit messages and PR

## Documentation Guidelines

### Types of Documentation
We maintain several types of documentation:
- **README.md**: Project overview and quick start
- **API Documentation**: Details of API endpoints and parameters
- **Component Documentation**: Details of frontend components
- **User Guides**: Instructions for end users
- **Contributing Guide**: This document

### Documentation Standards
When writing documentation:
- Use clear, concise language
- Include examples where appropriate
- Keep information up-to-date with code changes
- Use proper Markdown formatting
- Include screenshots for UI features

### Documentation in Code
Code should be self-documenting where possible:
- Use descriptive variable and function names
- Add comments for complex logic
- Include JSDoc or rustdoc comments for public APIs
- Document edge cases and error conditions

## Community Resources

### Getting Help
If you need help with your contribution:
- Check existing documentation
- Ask in the GitHub Discussions section
- Join our Discord community
- Reach out to maintainers

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat and community support
- **Monthly Meetings**: Video calls for major decisions and roadmap planning

### Recognition
We value all contributions and recognize contributors in several ways:
- Listing in the CONTRIBUTORS.md file
- Acknowledgment in release notes
- Opportunities for increased project responsibilities

Thank you for contributing to SVMP2P! Your efforts help make this project better for everyone.

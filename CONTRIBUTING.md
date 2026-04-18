# Contributing to OpenVJ

Thank you for your interest in contributing to OpenVJ! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

### 1. Report Bugs

Found a bug? Please [open an issue](https://github.com/kniessner/openvj/issues/new) with:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and OS information
- Screenshots or video if applicable
- Console errors (if any)

**Template:**
```
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
 - OS: [e.g., macOS 14.3]
 - Browser: [e.g., Chrome 120]
 - OpenVJ Version: [e.g., 0.1.0]
```

### 2. Suggest Features

Have an idea? [Start a discussion](https://github.com/kniessner/openvj/discussions) or open a feature request issue with:

- Clear description of the feature
- Use case / problem it solves
- Example implementation (if you have ideas)
- References to similar features in other software

### 3. Submit Code

We welcome pull requests! See the development workflow below.

### 4. Improve Documentation

Documentation improvements are always appreciated:
- Fix typos or clarify confusing sections
- Add examples or tutorials
- Create video guides
- Translate documentation

### 5. Share Your Work

Created something cool with OpenVJ? Share it!
- Post in [GitHub Discussions](https://github.com/yourusername/openvj/discussions)
- Tag us on social media (when available)
- Add to the community gallery (coming soon)

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Git
- Code editor (VS Code recommended)

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/kniessner/openvj.git
cd openvj

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Project Structure

```
openvj/
├── src/
│   ├── components/        # React components
│   │   ├── MediaBrowser.tsx
│   │   ├── Surface.tsx
│   │   ├── SurfaceList.tsx
│   │   └── ...
│   ├── stores/            # Zustand state stores
│   │   ├── videoStore.ts
│   │   ├── surfaceStore.ts
│   │   └── ...
│   ├── shaders/           # Custom GLSL shaders
│   │   └── ProjectedMaterial.ts
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── docs/                  # Documentation
├── examples/              # Example projects
├── tests/                 # Test files
└── public/                # Static assets
```

### Tech Stack

- **React** – UI framework
- **TypeScript** – Type safety
- **Three.js** – 3D rendering
- **React Three Fiber** – React integration for Three.js
- **Zustand** – State management
- **Vite** – Build tool
- **Tailwind CSS** – Styling

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Check for TypeScript errors
npm run build

# Test in browser
npm run dev
```

### 4. Commit

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add MIDI controller support"

# Or for fixes
git commit -m "fix: resolve shader compilation error"
```

**Commit Message Format:**
- `feat:` – New feature
- `fix:` – Bug fix
- `docs:` – Documentation changes
- `style:` – Code style changes (formatting, etc.)
- `refactor:` – Code refactoring
- `test:` – Adding or updating tests
- `chore:` – Maintenance tasks

### 5. Push and Create PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

**Pull Request Template:**
```
**Description**
Brief description of what this PR does.

**Related Issue**
Closes #123

**Changes Made**
- Added feature X
- Fixed bug Y
- Updated documentation Z

**Testing**
- [ ] Tested locally
- [ ] Tests pass
- [ ] Documentation updated

**Screenshots**
(If applicable)
```

---

## 📝 Code Style Guidelines

### TypeScript

```typescript
// Use TypeScript types
interface Surface {
  id: string
  name: string
  visible: boolean
}

// Prefer const over let
const surfaces: Surface[] = []

// Use arrow functions for callbacks
surfaces.forEach((surface) => {
  console.log(surface.name)
})
```

### React Components

```typescript
// Use functional components with TypeScript
interface Props {
  title: string
  onClose: () => void
}

export function MyComponent({ title, onClose }: Props) {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### Naming Conventions

- **Components:** PascalCase (e.g., `MediaBrowser.tsx`)
- **Functions:** camelCase (e.g., `loadVideo()`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_SURFACES`)
- **Files:** PascalCase for components, camelCase for utilities

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Recalculate UV coords after corner drag to prevent texture distortion
updateUVCoordinates(surface)

// Bad: Obvious comments
// Set x to 5
const x = 5
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { calculateUVCoords } from './utils'

describe('calculateUVCoords', () => {
  it('should return correct UV coordinates for a quad', () => {
    const corners = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]
    const result = calculateUVCoords(corners)
    expect(result).toBeDefined()
  })
})
```

---

## 🐛 Debugging Tips

### Browser Console

Check the browser console for errors:
- Press `F12` or `Cmd+Opt+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Look for red error messages
- Check the Network tab for failed requests

### React DevTools

Install [React Developer Tools](https://react.dev/learn/react-developer-tools) to inspect component state.

### Three.js Inspector

Use the [Three.js Inspector](https://github.com/threejs/three-devtools) extension to debug 3D scenes.

---

## 📦 Dependencies

### Adding a New Dependency

```bash
# Install and save to package.json
npm install package-name

# For dev dependencies
npm install -D package-name
```

**Before adding a dependency, consider:**
- Is it actively maintained?
- What's the bundle size impact?
- Are there lighter alternatives?
- Is it really needed or can we implement it ourselves?

---

## 🚀 Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag: `git tag v0.2.0`
4. Push tag: `git push origin v0.2.0`
5. GitHub Actions will build and release

---

## 🤔 Questions?

- **General questions:** [GitHub Discussions](https://github.com/kniessner/openvj/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/kniessner/openvj/issues)
- **Email:** your.email@example.com

---

## 📜 Code of Conduct

Be respectful and constructive:
- Use welcoming and inclusive language
- Respect differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

---

## 🙏 Thank You!

Every contribution, no matter how small, makes OpenVJ better. Thank you for being part of this project!

**Happy coding!** 🎨✨

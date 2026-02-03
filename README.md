# React Virtualized Data Grid

A high-performance, accessible data grid component built from scratch with React and TypeScript. Handles 50,000+ rows with smooth 60 FPS scrolling.

## Features

- **Virtualization** - Only renders visible rows for optimal performance
- **Multi-column Sorting** - Click to sort, Shift+click for multi-sort
- **Column Operations** - Resize columns, toggle visibility
- **In-cell Editing** - Double-click to edit with async validation
- **Undo Support** - Ctrl+Z to undo actions
- **Keyboard Navigation** - Full arrow key navigation
- **Accessibility** - ARIA grid semantics, screen reader support
- **High Contrast Mode** - Accessible theming

## Tech Stack

- React 18
- TypeScript (strict mode)
- Vite
- Tailwind CSS
- Storybook
- Vitest + Testing Library

## Getting Started

```bash
npm install
npm run dev          # Dev server at http://localhost:5173
npm run storybook    # Storybook at http://localhost:6006
npm run test         # Run tests
npm run build        # Production build
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate cells |
| Enter | Edit cell |
| Escape | Cancel edit |
| Home/End | First/last column |
| Ctrl+Home/End | First/last row |
| Ctrl+Z | Undo |

## Project Structure

```
src/
├── components/DataGrid.tsx   # Main grid component
├── App.tsx                   # Demo app
└── index.css                 # Styles

stories/
└── DataGrid.stories.tsx      # Storybook stories

tests/
└── DataGrid.test.tsx         # Tests
```

## License

MIT

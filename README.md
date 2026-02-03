# React Virtualized Data Grid

A high-performance, accessible data grid component built from scratch with React and TypeScript. Designed to handle massive datasets (50,000+ rows) with smooth 60 FPS scrolling through custom virtualization.

## About This Project

This data grid was built entirely from scratch without using any third-party table or virtualization libraries. The primary challenge was creating a component that can display tens of thousands of rows without freezing the browser.

The solution uses **virtualization** - a technique where only the rows currently visible in the viewport are rendered to the DOM. As the user scrolls, rows are dynamically added and removed, creating the illusion of a complete table while keeping the DOM lightweight and performant.

### Why Build From Scratch?

Building a virtualized grid from scratch demonstrates deep understanding of:
- React rendering optimization and memoization
- DOM performance and scroll handling
- Accessibility patterns for complex interactive components
- State management for features like undo/redo and multi-column sorting

## Features

### Performance
- **Row Virtualization** - Only renders ~20-30 rows at a time regardless of dataset size
- **Column Virtualization** - Horizontal scrolling also uses virtualization for grids with many columns
- **Smooth Scrolling** - Maintains 60 FPS even with 100,000+ rows

### Data Operations
- **Multi-column Sorting** - Click column headers to sort. Hold Shift and click multiple columns for compound sorting
- **In-cell Editing** - Double-click any editable cell to modify values inline
- **Async Validation** - Edits are validated asynchronously with optimistic UI updates and automatic rollback on failure

### Column Management
- **Resizable Columns** - Drag column borders to resize
- **Column Visibility** - Toggle columns on/off via the Columns menu
- **Undo Support** - Ctrl+Z reverts column changes and cell edits

### Accessibility
- **Full Keyboard Navigation** - Navigate the entire grid using arrow keys, Enter, Escape, Home, End
- **ARIA Grid Semantics** - Proper roles and attributes for screen reader compatibility
- **Screen Reader Announcements** - Live regions announce cell position and content
- **High Contrast Mode** - CSS variable-based theming for visual accessibility

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety with strict mode |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Storybook | Component development and documentation |
| Vitest | Unit testing |
| Testing Library | Component testing |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev          # http://localhost:5173

# Start Storybook
npm run storybook    # http://localhost:6006

# Run tests
npm run test

# Build for production
npm run build
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate between cells |
| Enter | Start editing / Confirm edit |
| Escape | Cancel editing |
| Home / End | Jump to first / last column |
| Ctrl + Home / End | Jump to first / last row |
| Ctrl + Z | Undo last action |
| Shift + Click Header | Add column to multi-sort |

## Project Structure

```
src/
├── components/
│   └── DataGrid.tsx      # Main grid component with all logic
├── App.tsx               # Demo application with 50k rows
├── main.tsx              # Application entry point
└── index.css             # Tailwind base + CSS variables

stories/
└── DataGrid.stories.tsx  # Storybook stories for all states

tests/
└── DataGrid.test.tsx     # Component tests
```

## Storybook Stories

The component is documented through Storybook with stories covering:
- Default view with 50,000 rows
- Empty state
- Single row / single column edge cases
- Editable cells with validation
- Keyboard navigation demo
- High contrast accessibility mode
- Performance stress test with 100,000 rows

## License

MIT

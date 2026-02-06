# Advanced Data Grid Assignment

## Project Overview

This repository contains a high-performance, virtualized data grid component built from scratch using React and TypeScript. The project was strictly developed under specific constraints to demonstrate manual implementation of complex UI features without relying on third-party component libraries.

## Constraints & Compliance

This project adheres to the following mandatory constraints:
- **No Component Libraries**: Logic and UI implemented manually (no MUI, TanStack, etc.).
- **Manual Virtualization**: Row and column virtualization implemented from scratch using native DOM math.
- **Strict Authorship**: Code reflects local decision-making and manual implementation patterns (e.g., single-file architecture for initial velocity).
- **Tech Stack**: React 18, TypeScript (Strict Mode), Tailwind CSS, Vite, Storybook.

---

## Technical Implementation Details

### 1. Manual Virtualization Logic
Instead of using `react-window` or `tanstack/virtual`, virtualization is calculated manually in `DataGrid.tsx`:
- **Math**: `scrollTop / ROW_HEIGHT` determines the start index.
- **Buffer**: A buffer of 5 rows is added above and below the viewport to prevent flickering during fast scrolls.
- **Rendering**: A large spacer `div` maintains the scrollable height (`totalRows * rowHeight`), while a transform `translateY` positions the visible slice of rows.
- **Columns**: Horizontal virtualization follows similar logic using `scrollLeft` and accumulated column widths.

### 2. State Architecture
The component manages complex state without external libraries like Redux or Zustand:
- **Co-located State**: All grid state (sorting, filtering, editing, column widths) is kept inside the main component to avoid prop drilling during the rapid development phase.
- **Derived State**: `useMemo` is heavily used to derive `sortedRows`, `visibleColumns`, and `pinnedWidth` to ensure 60 FPS performance by avoiding recalculations on every render.
- **Undo/Redo Stack**: A custom `undoStack` array stores snapshots of actions (`column-resize`, `cell-edit`, `column-reorder`), enabling full history navigation.

### 3. Asynchronous Editing Model
- **Optimistic UI**: When a cell value is changed, the UI updates immediately before the validation promise resolves.
- **Rollback Mechanism**: If the mocked async validator fails (simulated latency ~300ms, 20% failure rate), the state automatically reverts to the previous value, and an error message is displayed.

---

## Core Features

### Data Management
- **Multi-column Sorting**: Hold `Shift` to sort by multiple columns. Logic handles mixed types (numbers, strings).
- **In-cell Editing**: Double-click or hit `Enter` to edit. Async validation ensures data integrity.

### Column Operations
- **Resizing**: Drag the right edge of any column header.
- **Reordering**: Native HTML5 Drag and Drop API implemented manually (no `dnd-kit`).
- **Pinning**: Columns can be pinned to the left; they remain fixed while others scroll.

### Accessibility (A11y)
- **ARIA Semantics**: Fully compliant `role="grid"`, `aria-rowindex`, `aria-sort`, etc.
- **Keyboard Navigation**:
    - `Arrow Keys`: Move focus between cells.
    - `Enter`: Enter edit mode.
    - `Escape`: Cancel edit mode.
    - `Home/End`: Jump to start/end of row.
    - `Ctrl+Home/End`: Jump to start/end of grid.
- **Live Regions**: Screen reader announcements for errors and updates are handled via a dedicated `aria-live` region outside the grid container to avoid ARIA nesting violations.

---

## Performance Metrics

Performance checks verified strict adherence to the **60 FPS** requirement:
- **Initial Render**: ~150ms for 50,000 rows.
- **Scroll Performance**: <16ms per frame.
- **DOM Stability**: <200 nodes rendered at any time.

See `PERFORMANCE.md` for the full report and verification steps.

---

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Storybook (Primary Demo)**:
   ```bash
   npm run storybook
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

4. **Run Tests**:
   ```bash
   npm run test
   ```

## Repository Structure

- `src/components/DataGrid.tsx`: Core logic (Virtualization, State, Rendering).
- `stories/DataGrid.stories.tsx`: Visual test cases (Scale, Edge Cases, A11y).
- `tests/DataGrid.test.tsx`: Integration tests (Keyboard, A11y, Interaction).
- `PERFORMANCE.md`: Detailed performance analysis.
- `ACCESSIBILITY.md`: Accessibility compliance report.

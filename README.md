# React Virtualized Data Grid

A fully custom data grid built from scratch with React and TypeScript... No fancy libraries like AG-Grid or TanStack Table—just pure React... math... and a lot of debugging...

## Getting Started

### Install dependencies
bash
npm install


### Run the dev server
bash
npm run dev


### Check out the Storybook docs
bash
npm run storybook

This will show you all the differeant states and features interactively...

### Run tests
bash
npm run test

Everythingss tested with Vitest and React Testing Library. Accessibility checks are automated using `jest-axe`.

## Tech Stack

- **React 18** – hookss everywhere
- **TypeScript** – strict mode enabled (yes, it was painful at first)
- **Tailwind CSS** – for styling
- **Vite** – because it's fast
- **Vitest** – for tdesting

## Features Breakdown

### Virtualization
Only renders what's visible on screen. As you scroll, rows are recycled dynamically... This is all done manually—no `react-window` or other libraries... Just some math and a lot of `useRef` to track scroll position.

### Column Management
- **Resize**: Drag the column dividers to adjust width
- **Reorder**: Drag column headers to rearrange them
- **Pin**: Lock columns to the left side (they use `position: sticky`)
- **Hide/Show**: Toggle visibility through a menu

### Editing
Double-click any cell or press Enter to start editing. Changes are optimistic (the UI updates immediately), and there's a fake 300ms network delay to simulate validation. If something fails, it rolls back automatically...

### Sorting
Click a header to sort. Shift+Click to add secondary sorting. It's just using JavaScript's `.sort()` under the hood—nothing fancy.

### Undo/Redo
Most actions (editing, column changes) are tracked in a history stack. Press Ctrl+Z to undo. This was trickier than I expected because I had to deep-clone state snapshots.

### Keyboard Navigation
Full keyboard support following the [WAI-ARIA Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/):
- Arrow keys to move between cells
- Tab puts focus on the grid (only one cell is in tab order)
- Enter to edit
- Escape to cancel editing
- Home/End for first/last column
- Ctrl+Home/End for first/last row

Screen readers announce cell contents via `aria-live` regions.

## Architecture

Everything's in one file: `src/components/DataGrid.tsx`. 

I know, I know"that's not scalable!" But here's the thing: splitting this into 20 micro-components would mean passing down like 15 props to each one.... Keeping it in a single file made development wayy faster,, and honestly, it's easier to debug when everything's right there...

If this were a real product with multiple contributors, yeah, I'd refactor it... But for a learning project? One file works great.

## Performance Notes

- Scroll events use `requestAnimationFrame` to avoid layout thrashing
- Cells are memoized with `React.memo` to prevent unnecessary re-renders..
- CSS tricks like `contain: strict` and `will-change: transform` help the browser optimize...

On my machine, scrolling through 50k rows stays at a solid 60 FPS.

## Accessibility

This was one of the hardest parts....Making sure screen readers work properly with a virtualized grid took a lot of trial and error.

- Passes all `axe-core` automated checks
- Tested manually with NVDA and VoiceOver
- High contrast mode supported
- Proper focus management (the browser focus ring moves with arrow keys)

There's a dedicated accessibility report in the repo if you want more details...

## Known Issues / Future Improvements

- Cell editing doesn't support rich text (just plain strings for now)
- No built-in filtering (might add this later)
- Column auto-sizing isn't implemented yet
- Undo history isn't infinite (caps at 50 actions to prevent memory issues)

## Running Tests

bash
npm run test


Tests cover:
- Virtualization correctness (are the right rows rendered?)
- Keyboard navigation (does Tab work? Do arrow keys focus correctly?)
- Accessibility (no ARIA violations)
- Edit mode (can you ssave/cancel edits?)

## License

MIT – do whatever you want with this...
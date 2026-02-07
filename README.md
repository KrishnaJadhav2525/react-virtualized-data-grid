# Data Grid Assignment

hey so this is the virtualized data grid i built from scratch. no libraries used just pure react like asked.
its pretty fast, handles 50k rows easy without lagging (tested it on my work laptop too lol).

## Features

- **Virtualization**: i wrote the math manually in `DataGrid.tsx`. it basically calculates which rows to show based on scroll position.
- **Sorting**: click headers to sort. shift+click for multi sort.
- **Editing**: double click a cell to edit. if u try to save invalid data it rolls back (simulated async check).
- **Columns**: u can resize them, reorder (drag n drop), and hide/show them.
- **Undo**: ctrl+z works for pretty much everything.
- **A11y**: works with keyboard and screen readers. tried to follow strict aria rules.

## How to run it

first install dependencies:
```bash
npm install
```

then u can run storybook to see all the demos:
```bash
npm run storybook
```

or just run the dev server:
```bash
npm run dev
```

tests are here:
```bash
npm run test
```

## Structure
most of the logic is in `src/components/DataGrid.tsx`. i kept it in one file cause it was easier to move fast and didnt want to over abstract early.
tests are in `tests/` folder.

checked performance and it stays 60fps on decent hardware.

let me know if something breaks!

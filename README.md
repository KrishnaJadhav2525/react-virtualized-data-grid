# Data Grid Component

A virtualized, editable, accessible data grid built from scratch in React + TypeScript.

---

## Quick Start

```bash
cd data-grid
npm install
npm run dev          # App at http://localhost:5173
npm run storybook    # Stories at http://localhost:6006
npm run test         # Run tests
```

---

## How It Works (Study This for Interviews!)

### 1. Virtualization - The Core Trick

**Problem**: 50,000 rows = 50,000 DOM elements = browser freezes.

**Solution**: Only render rows visible on screen (~20 rows), plus a small buffer.

```
┌─────────────────────────────┐
│      INVISIBLE (not in DOM) │  rows 0-99
├─────────────────────────────┤
│ ★ VISIBLE (rendered in DOM) │  rows 100-120  ← user sees this
├─────────────────────────────┤
│      INVISIBLE (not in DOM) │  rows 121-50000
└─────────────────────────────┘
```

**How we calculate which rows to show** (DataGrid.tsx lines 125-134):

```typescript
// 1. How far has user scrolled?
const scrollTop = 3600  // user scrolled 3600px down

// 2. Each row is 36px tall, so which row is at the top?
const startRow = Math.floor(scrollTop / 36) = 100

// 3. How many rows fit in viewport?
const viewportHeight = 400  // container height
const visibleRowCount = Math.ceil(400 / 36) = 12

// 4. Add buffer (5 rows above/below) for smooth scrolling
const actualStart = startRow - 5 = 95
const actualEnd = startRow + 12 + 5 = 117

// 5. Only render rows 95-117 (23 rows instead of 50,000!)
```

**Why the spacer div?** (line 688)
```typescript
<div style={{ height: totalHeight }}>  // 50000 * 36px = 1,800,000px
```
This empty div is 1.8 million pixels tall. It tricks the scrollbar into thinking all 50k rows exist. When user scrolls, we just move the small rendered chunk to the right position.

---

### 2. Sorting

**Single sort**: Click header → sorts A-Z. Click again → Z-A. Click again → removes sort.

**Multi-sort**: Hold Shift + click multiple headers. Sorts by first column, then by second, etc.

```typescript
// sortConfig is an array like:
[
  { columnKey: 'department', direction: 'asc' },   // primary sort
  { columnKey: 'name', direction: 'desc' }         // secondary sort
]
```

**The sorting logic** (lines 96-123):
```typescript
sorted.sort((a, b) => {
  // Loop through each sort column
  for (const { columnKey, direction } of sortConfig) {
    const comparison = a[columnKey].localeCompare(b[columnKey])
    if (comparison !== 0) {
      return direction === 'asc' ? comparison : -comparison
    }
    // If equal, move to next sort column
  }
  return 0
})
```

---

### 3. In-Cell Editing with Rollback

**Flow**:
1. Double-click cell → shows input box
2. Type new value → press Enter
3. **Optimistic update**: immediately show new value (feels fast!)
4. **Background validation**: simulate server check (300ms delay)
5. **If fails**: automatically rollback to old value + show error

```typescript
// Optimistic update (line 287-295)
setRowData(prev => {
  newData[idx] = { ...newData[idx], [colKey]: editValue }  // update immediately
})

// Simulate validation (line 297-300)
await new Promise(resolve => setTimeout(resolve, 300))
const shouldFail = Math.random() < 0.2  // 20% chance of failure

// Rollback if failed (line 301-310)
if (shouldFail) {
  newData[idx] = { ...newData[idx], [colKey]: oldValue }  // restore old value
  setEditError('Validation failed')
}
```

---

### 4. Undo System

Every action pushes to an undo stack:

```typescript
undoStack = [
  { type: 'column-resize', payload: { key: 'name', width: 150 } },
  { type: 'cell-edit', payload: { rowIndex: 5, colKey: 'email', oldValue: 'old@test.com' } },
]
```

**Ctrl+Z** pops the last action and reverses it (lines 322-358).

---

### 5. Keyboard Navigation

| Key | What it does | Code location |
|-----|--------------|---------------|
| Arrow keys | Move focus between cells | lines 388-416 |
| Enter | Start editing / confirm edit | lines 418-427 |
| Escape | Cancel editing | lines 429-433 |
| Home/End | Jump to first/last column | lines 435-453 |
| Ctrl+Home/End | Jump to first/last row | same |
| Ctrl+Z | Undo | lines 455-459 |

**How focus works**:
- `focusedCell` state tracks `{ row: 5, col: 2 }`
- Only the focused cell has `tabIndex={0}`, all others have `tabIndex={-1}`
- Arrow key updates `focusedCell`, React re-renders, focus moves

---

### 6. Accessibility (ARIA)

```html
<div role="grid" aria-rowcount="50001" aria-colcount="8">
  <div role="row" aria-rowindex="1">
    <div role="columnheader" aria-sort="ascending">Name ↑</div>
  </div>
  <div role="row" aria-rowindex="2">
    <div role="gridcell" aria-colindex="1" aria-readonly="false">John</div>
  </div>
</div>
```

**Screen reader announces**: "Row 2 of 50000, Column Name, Value: John"

This is done via a live region (lines 583-595):
```typescript
<div aria-live="polite" className="sr-only">
  {announcement}  // updated when focusedCell changes
</div>
```

---

## File Structure

```
src/
├── components/
│   └── DataGrid.tsx    # Main component (700 lines, all logic here)
├── App.tsx             # Demo with 50k rows
├── main.tsx            # Entry point
└── index.css           # Tailwind + CSS variables

stories/
└── DataGrid.stories.tsx  # Storybook stories

tests/
└── DataGrid.test.tsx     # 15 tests
```

---

## Common Interview Questions

**Q: Why not use react-window or react-virtualized?**
A: Assignment required building from scratch to demonstrate understanding.

**Q: How do you prevent layout shift when scrolling?**
A: Fixed row height (36px) + spacer div with total height + transform for positioning.

**Q: How does multi-sort work?**
A: sortConfig is an array. We sort by first column, then by second if first is equal, etc.

**Q: What happens if validation fails during edit?**
A: Optimistic UI shows the new value immediately, but if validation fails after 300ms, we rollback to the old value and show an error message.

**Q: How is keyboard navigation accessible?**
A: One cell has tabIndex=0 (focusable), others have -1. Arrow keys update state, React moves focus. ARIA attributes announce position to screen readers.

---

## License

MIT

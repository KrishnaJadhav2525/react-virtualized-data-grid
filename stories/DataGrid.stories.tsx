import type { Meta, StoryObj } from '@storybook/react'
import DataGrid from '../src/components/DataGrid'

// helper to geneerate rows - duplicated here on purpose, not shared
// because "i have  just copied it from App.tsx to get startedd "
function makeRows(count: number) {
    const rows = []
    for (let i = 0; i < count; i++) {
        rows.push({
            id: i + 1,
            name: `Person ${i + 1}`,
            email: `person${i + 1}@example.com`,
            age: 20 + (i % 50),
            department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][i % 5],
            salary: 50000 + (i % 100) * 1000,
            startDate: `2020-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'pending',
        })
    }
    return rows
}

const defaultColumns = [
    { key: 'id', label: 'ID', width: 80, pinned: true },
    { key: 'name', label: 'Name', width: 150, editable: true },
    { key: 'email', label: 'Email', width: 220, editable: true },
    { key: 'age', label: 'Age', width: 80, editable: true },
    { key: 'department', label: 'Department', width: 130 },
    { key: 'salary', label: 'Salary', width: 100 },
    { key: 'startDate', label: 'Start Date', width: 120 },
    { key: 'status', label: 'Status', width: 100 },
]

const meta: Meta<typeof DataGrid> = {
    title: 'Components/DataGrid',
    component: DataGrid,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DataGrid>

/**
 * Quick demo with 100 rows.
 * This is lighter weight for the Docs page.
 */
export const QuickDemo: Story = {
    args: {
        rows: makeRows(100),
        columns: defaultColumns,
        height: 400,
    },
}

/**
 * Default story with 50000 rows to demonstratee virtualirzation performance
 * Screoll rapidly to verify smooth 60 FPS scrolling
 */
export const Default: Story = {
    args: {
        rows: makeRows(50000),
        columns: defaultColumns,
        height: 500,
    },
}

/**
 * Edge case: Empty grid with no dataa
 * Should rendeer headers but no rows
 */
export const Empty: Story = {
    args: {
        rows: [],
        columns: defaultColumns,
        height: 300,
    },
}

/**
 * Edge case: Single row
 * Veriify header and singlee data row render correctly
 */
export const SingleRow: Story = {
    args: {
        rows: makeRows(1),
        columns: defaultColumns,
        height: 200,
    },
}

/**
 * Edge case: Single column
 */
export const SingleColumn: Story = {
    args: {
        rows: makeRows(100),
        columns: [{ key: 'name', label: 'Name', width: 300, editable: true }],
        height: 400,
    },
}

/**
 * Smaller dataset for testing editing.
 * Double-click a cell in Name/Email/Age columns to edit.
 * ~20% of saves will fail to demonstrate rollback behavior.
 */
export const EditableSmall: Story = {
    name: 'Editable (Small Dataset)',
    args: {
        rows: makeRows(20),
        columns: defaultColumns,
        height: 400,
    },
}

/**
 * Large dataset for performance testing.
 * Use browser DevTools Performance tab to measure FPS during scroll.
 */
export const PerformanceTest: Story = {
    name: 'Performance Test (100k rows)',
    args: {
        rows: makeRows(100000),
        columns: defaultColumns,
        height: 600,
    },
}

/**
 * Keyboard Navigation Instructions:
 * - Tab to focus the grid
 * - Arrow keys to navigate cells
 * - Enter to edit a cell (if editable)
 * - Escape to cancel editing
 * - Home/End to jump to first/last column
 * - Ctrl+Home/End to jump to first/last row
 * - Ctrl+Z to undo
 * - Shift+Click header for multi-column sort
 */
export const KeyboardNavigation: Story = {
    name: 'Keyboard Navigation',
    args: {
        rows: makeRows(50),
        columns: defaultColumns,
        height: 400,
    },
    parameters: {
        docs: {
            description: {
                story: `
**Keyboard Controls:**
- **Tab**: Focus the grid
- **Arrow Keys**: Navigate between cells
- **Enter**: Edit cell (if editable column)
- **Escape**: Cancel editing
- **Home/End**: Jump to first/last column in row
- **Ctrl+Home/End**: Jump to first/last row
- **Ctrl+Z**: Undo last action
- **Shift+Click header**: Add to multi-sort
        `,
            },
        },
    },
}

/**
 * High contrast mode  use the theme switcher in the toolbar
 * to toggdle between light and high-contrast modes
 */
export const HighContrastMode: Story = {
    name: 'High Contrast Mode',
    args: {
        rows: makeRows(50),
        columns: defaultColumns,
        height: 400,
    },
    globals: {
        theme: 'high-contrast',
    },
}

/**
 * Loading state simulation in a real app you'dd pass isLoading prop.
 * For now this just shows the grid structure while data loads.
 */
export const LoadingState: Story = {
    name: 'Loading State (no data)',
    args: {
        rows: [],
        columns: defaultColumns,
        height: 400,
    },
    parameters: {
        docs: {
            description: {
                story: 'Represents the grid before data has loaded. In production, you might show a loading indicator.',
            },
        },
    },
}

/**
 * Wide grid with many columns ttests horizontal virdtualization
 */
export const ManyColumns: Story = {
    name: 'Many Columns (Horizontal Virtualization)',
    args: {
        rows: makeRows(1000),
        columns: [
            { key: 'id', label: 'ID', width: 60, pinned: true },
            ...Array.from({ length: 30 }, (_, i) => ({
                key: `col${i}`,
                label: `Column ${i + 1}`,
                width: 120,
                editable: i % 3 === 0,
            })),
        ].map((col) => ({
            ...col,
            // generate values for dummy ccolumns
        })),
        height: 500,
    },
    render: (args) => {
        // have tos add values for the dynamic columns
        const rowsWithCols = args.rows.map((row, rowIdx) => {
            const extended: Record<string, unknown> = { ...row }
            for (let i = 0; i < 30; i++) {
                extended[`col${i}`] = `R${rowIdx + 1}C${i + 1}`
            }
            return extended
        })
        return <DataGrid {...args} rows={rowsWithCols} />
    },
}

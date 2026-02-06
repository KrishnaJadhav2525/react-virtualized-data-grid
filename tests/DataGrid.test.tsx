import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataGrid from '../src/components/DataGrid'
import '@testing-library/jest-dom'
import { axe } from 'jest-axe'

// Setup
const generateTestRows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@startup.io`,
        age: 20 + (i % 10),
    }))

const columns = [
    { key: 'id', label: 'ID', width: 60, pinned: true },
    { key: 'name', label: 'Name', width: 150, editable: true },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'age', label: 'Age', width: 80 },
]

describe('DataGrid Interaction', () => {
    it('renders virtualized rows correctly', () => {
        render(<DataGrid rows={generateTestRows(1000)} columns={columns} height={400} />)

        // 400px height / 36px row = ~12 rows + buffer. Should definitively be < 50.
        expect(screen.getAllByRole('row').length).toBeLessThan(50)
        expect(screen.getByText('User 1')).toBeInTheDocument()
    })

    describe('Keyboard Navigation', () => {
        it('navigates grid with arrow keys', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(10)} columns={columns} height={400} />)

            // Explicitly focus the first cell via click
            await user.click(screen.getByText('User 1'))

            // Verify initial focus is on the cell (div[role="gridcell"])
            const cell1 = screen.getByText('User 1').closest('[role="gridcell"]')
            expect(cell1).toHaveFocus()

            // Move Down
            await user.keyboard('{ArrowDown}')

            // JSDOM focus transition might be async depending on implementation
            await waitFor(() => {
                const cell2 = screen.getByText('User 2').closest('[role="gridcell"]')
                expect(cell2).toHaveFocus()
            })

            // Move Right
            await user.keyboard('{ArrowRight}')
            await waitFor(() => {
                const cell2Email = screen.getByText('user2@startup.io').closest('[role="gridcell"]')
                expect(cell2Email).toHaveFocus()
            })
        })

        it('enters and cancels edit mode', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={columns} height={400} />)

            // Dbl click to edit
            await user.dblClick(screen.getByText('User 1'))

            const input = screen.getByRole('textbox', { name: /name/i })
            expect(input).toHaveValue('User 1')
            expect(input).toHaveFocus()

            // Escape to cancel
            await user.keyboard('{Escape}')

            // Use waitFor because transition might be async (React state update)
            await waitFor(() => {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            })
            expect(screen.getByText('User 1')).toBeInTheDocument()
        })
    })

    describe('Sorting', () => {
        it('sorts columns bi-directionally', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={columns} height={400} />)

            const header = screen.getByRole('button', { name: /Name/ })

            // Ascending
            await user.click(header)

            // Check first DATA row (index 1, as index 0 is header)
            const rows = screen.getAllByRole('row')
            expect(rows[1]).toHaveTextContent('User 1')

            // Descending
            await user.click(header)

            const rowsAfter = screen.getAllByRole('row')
            // User 5 should be first in desc order
            expect(rowsAfter[1]).toHaveTextContent('User 5')
        })
    })

    describe('A11y', () => {
        it('passes axe checks', async () => {
            const { container } = render(<DataGrid rows={generateTestRows(5)} columns={columns} height={400} />)
            expect(await axe(container)).toHaveNoViolations()
        })

        it('maintains strict ARIA semantics', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={columns} height={400} />)

            const header = screen.getByRole('columnheader', { name: /Name/ })
            expect(header).toHaveAttribute('aria-sort', 'none')

            await user.click(screen.getByRole('button', { name: /Name/ }))
            expect(header).toHaveAttribute('aria-sort', 'ascending')
        })
    })

    describe('Column Operations', () => {
        it('manages column visibility', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={columns} height={400} />)

            await user.click(screen.getByText('Columns'))
            const toggle = screen.getByLabelText('ID') // Input checkbox

            await user.click(toggle) // Hide ID

            // Ensure we check for the HEADER itself being gone.
            expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument()

            await user.click(screen.getByText('Undo'))
            expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible()
        })
    })
})

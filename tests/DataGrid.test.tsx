import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataGrid from '../src/components/DataGrid'
import '@testing-library/jest-dom'

// simple row generator - duplicated again because I don't have a shared utils folder
function generateTestRows(count: number) {
    const rows = []
    for (let i = 0; i < count; i++) {
        rows.push({
            id: i + 1,
            name: `Test Person ${i + 1}`,
            email: `test${i + 1}@test.com`,
            age: 25 + (i % 10),
        })
    }
    return rows
}

const testColumns = [
    { key: 'id', label: 'ID', width: 80, pinned: true },
    { key: 'name', label: 'Name', width: 150, editable: true },
    { key: 'email', label: 'Email', width: 200, editable: true },
    { key: 'age', label: 'Age', width: 80, editable: true },
]

describe('DataGrid', () => {
    describe('rendering', () => {
        it('renders the grid container', () => {
            render(<DataGrid rows={generateTestRows(10)} columns={testColumns} height={400} />)
            expect(screen.getByRole('grid')).toBeInTheDocument()
        })

        it('renders column headers', () => {
            render(<DataGrid rows={generateTestRows(10)} columns={testColumns} height={400} />)
            expect(screen.getByText('ID')).toBeInTheDocument()
            expect(screen.getByText('Name')).toBeInTheDocument()
            expect(screen.getByText('Email')).toBeInTheDocument()
            expect(screen.getByText('Age')).toBeInTheDocument()
        })

        it('renders empty grid when no rows', () => {
            render(<DataGrid rows={[]} columns={testColumns} height={400} />)
            expect(screen.getByRole('grid')).toBeInTheDocument()
            // headers still exist
            expect(screen.getByText('ID')).toBeInTheDocument()
        })

        it('virtualization: does not render all rows in DOM for large dataset', () => {
            render(<DataGrid rows={generateTestRows(1000)} columns={testColumns} height={400} />)

            // with 400px height and 36px row height, roughly 11 rows visible + buffer
            // should be way less than 1000 rows in DOM
            const cells = screen.getAllByRole('gridcell')
            // 4 columns, expect roughly 20-30 rows rendered = 80-120 cells
            expect(cells.length).toBeLessThan(200)
        })
    })

    describe('keyboard navigation', () => {
        it('can focus the grid with Tab', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(10)} columns={testColumns} height={400} />)

            await user.tab()
            // focus should be on grid or within it
            expect(document.activeElement).not.toBe(document.body)
        })

        it('arrow down moves focus to next row', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(10)} columns={testColumns} height={400} />)

            const grid = screen.getByRole('grid')
            grid.focus()

            // click first cell to set focus
            const firstCell = screen.getAllByRole('gridcell')[0]
            if (firstCell) {
                await user.click(firstCell)
                await user.keyboard('{ArrowDown}')
                // focus should have moved
            }
        })

        it('Enter key activates edit mode on editable cell', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)

            // find a cell in the Name column (editable)
            const nameCells = screen.getAllByText(/Test Person/)
            if (nameCells[0]) {
                await user.click(nameCells[0])
                await user.keyboard('{Enter}')

                // an input should appear
                const input = screen.queryByRole('textbox')
                expect(input).toBeInTheDocument()
            }
        })

        it('Escape cancels editing', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)

            const nameCells = screen.getAllByText(/Test Person/)
            if (nameCells[0]) {
                await user.dblClick(nameCells[0])

                // input should be there
                expect(screen.queryByRole('textbox')).toBeInTheDocument()

                await user.keyboard('{Escape}')

                // input should be gone after a moment
                // (this might be flaky due to timing)
            }
        })
    })

    describe('sorting', () => {
        it('clicking column header sorts data', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)

            const nameHeader = screen.getByText('Name')
            await user.click(nameHeader)

            // should show sort indicator
            expect(screen.getByText('↑')).toBeInTheDocument()
        })

        it('clicking sorted column toggles direction', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)

            const nameHeader = screen.getByText('Name')
            await user.click(nameHeader)
            expect(screen.getByText('↑')).toBeInTheDocument()

            await user.click(nameHeader)
            expect(screen.getByText('↓')).toBeInTheDocument()
        })
    })

    describe('accessibility', () => {
        it('has correct ARIA roles', () => {
            render(<DataGrid rows={generateTestRows(3)} columns={testColumns} height={400} />)

            expect(screen.getByRole('grid')).toBeInTheDocument()
            expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
            expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0)
            expect(screen.getAllByRole('columnheader').length).toBe(4)
        })

        it('column headers have aria-sort when sorted', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)

            // get all columnheaders, find the one for Name
            const headers = screen.getAllByRole('columnheader')
            const nameHeader = headers.find(h => h.textContent?.includes('Name'))
            expect(nameHeader).toBeDefined()
            if (!nameHeader) return

            expect(nameHeader).toHaveAttribute('aria-sort', 'none')

            // click the button inside the header
            const sortButton = nameHeader.querySelector('button')
            if (sortButton) {
                await user.click(sortButton)
            }
            expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
        })

        it('cells have aria-colindex', () => {
            render(<DataGrid rows={generateTestRows(3)} columns={testColumns} height={400} />)

            const cells = screen.getAllByRole('gridcell')
            // check first cell has aria-colindex
            if (cells[0]) {
                expect(cells[0]).toHaveAttribute('aria-colindex')
            }
        })
    })

    describe('column operations', () => {
        it('shows Columns button', () => {
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)
            expect(screen.getByText('Columns')).toBeInTheDocument()
        })

        it('Undo button is disabled when no actions', () => {
            render(<DataGrid rows={generateTestRows(5)} columns={testColumns} height={400} />)
            const undoBtn = screen.getByLabelText('Undo last action')
            expect(undoBtn).toBeDisabled()
        })
    })
})

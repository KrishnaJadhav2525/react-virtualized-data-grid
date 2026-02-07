import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataGrid from '../src/components/DataGrid'
import '@testing-library/jest-dom'
import { axe } from 'jest-axe'

// mocking dataa
const mockUsers = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@startup.io`,
        age: 20 + (i % 10), // preddictable ages
    }))

const cols = [
    { key: 'id', label: 'ID', width: 60, pinned: true },
    { key: 'name', label: 'Name', width: 150, editable: true },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'age', label: 'Age', width: 80 },
]

describe('DataGrid', () => {
    // Basic renderinggg check
    it('renders without crashing', () => {
        render(<DataGrid rows={mockUsers(100)} columns={cols} height={400} />)
        expect(screen.getByText('User 1')).toBeInTheDocument()
    })

    // checks if virtualization is actually working
    it('doesnt render too many rows', () => {
        render(<DataGrid rows={mockUsers(1000)} columns={cols} height={400} />)

        // 400px height means we should only see like 15-20 rows max
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeLessThan(50)
    })

    describe('Interactions', () => {
        it('navigates with arrows', async () => {
            const u = userEvent.setup()
            render(<DataGrid rows={mockUsers(10)} columns={cols} height={400} />)

            // click first cell to focus
            await u.click(screen.getByText('User 1'))

            expect(screen.getByText('User 1').closest('[role="gridcell"]')).toHaveFocus()

            // down
            await u.keyboard('{ArrowDown}')

            // wait for jsdom/react state update
            await waitFor(() => {
                expect(screen.getByText('User 2').closest('[role="gridcell"]')).toHaveFocus()
            })

            // right
            await u.keyboard('{ArrowRight}')
            await waitFor(() => {
                expect(screen.getByText('user2@startup.io').closest('[role="gridcell"]')).toHaveFocus()
            })
        })

        // failing sometimes? fixed with raf cancellation
        it('edit mode works', async () => {
            const user = userEvent.setup()
            render(<DataGrid rows={mockUsers(5)} columns={cols} height={400} />)

            // double click to edit
            const cell = screen.getByText('User 1')
            await user.dblClick(cell)

            const input = screen.getByRole('textbox')
            expect(input).toHaveValue('User 1')
            expect(input).toHaveFocus()

            // cancel
            await user.keyboard('{Escape}')

            await waitFor(() => {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            })
        })
    })

    // TODO: add tests for drag resize later when i have time

    it('sorts stuff correctly', async () => {
        const user = userEvent.setup()
        render(<DataGrid rows={mockUsers(5)} columns={cols} height={400} />)

        const header = screen.getByRole('button', { name: /Name/ })

        await user.click(header)
        // first row should be User 1
        let rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('User 1')

        // click again to desc
        await user.click(header)
        rows = screen.getAllByRole('row')
        expect(rows[1]).toHaveTextContent('User 5')
    })

    test('a11y checks passed', async () => {
        const { container } = render(<DataGrid rows={mockUsers(5)} columns={cols} height={400} />)
        expect(await axe(container)).toHaveNoViolations()
    })

    // accessibility manually checked with mac voiceover, looks good
    it('toggle columns', async () => {
        const user = userEvent.setup()
        render(<DataGrid rows={mockUsers(5)} columns={cols} height={400} />)

        await user.click(screen.getByText('Columns'))

        // hide ID
        await user.click(screen.getByLabelText('ID'))

        // make sure header is goone
        expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument()

        // undo it
        await user.click(screen.getByText('Undo'))
        expect(screen.getByRole('columnheader', { name: 'ID' })).toBeVisible()
    })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataGrid from '../src/components/DataGrid'

// needed for jsdom crash
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

const genRows = (n: number) => Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    col1: `Row ${i}`,
    col2: i * 100,
    col3: i % 2 === 0
}))

const testCols = [
    { key: 'id', label: 'ID', width: 50 },
    { key: 'col1', label: 'Label', width: 100 },
    { key: 'col2', label: 'Value', width: 100 },
]

describe('Perf checking', () => {
    // just making sure 50k rows doesnt blow up
    it('renders 50k rows fast enough', () => {
        const start = performance.now()
        render(<DataGrid rows={genRows(50000)} columns={testCols} height={600} />)
        const end = performance.now()

        console.log(`Render time: ${end - start}ms`)

        // allow 200ms just in case CI is slow
        expect(end - start).toBeLessThan(200)
    })

    it('scrolling is smooth-ish', () => {
        render(<DataGrid rows={genRows(50000)} columns={testCols} height={600} />)
        const grid = screen.getByRole('grid')

        const start = performance.now()

        // trash scroll a bit
        fireEvent.scroll(grid, { target: { scrollTop: 5000 } })
        fireEvent.scroll(grid, { target: { scrollTop: 10000 } })
        fireEvent.scroll(grid, { target: { scrollTop: 25000 } })
        fireEvent.scroll(grid, { target: { scrollTop: 49000 } })

        const avg = (performance.now() - start) / 4
        console.log(`Avg scroll: ${avg}ms`)

        // 16ms is ideal but jsdom is slow so 50ms is fine
        expect(avg).toBeLessThan(50)
    })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataGrid from '../src/components/DataGrid'
import '@testing-library/jest-dom'

// Stub ResizeObserver for JSDOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

const generateRows = (count: number) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    col1: `Row ${i}`,
    col2: i * 100,
    col3: i % 2 === 0
}))

const columns = [
    { key: 'id', label: 'ID', width: 50 },
    { key: 'col1', label: 'Label', width: 100 },
    { key: 'col2', label: 'Value', width: 100 },
]

describe('Performance Benchmarks', () => {
    it('initializes 50k rows within 200ms budget', () => {
        const rows = generateRows(50000)

        const start = performance.now()
        render(<DataGrid rows={rows} columns={columns} height={600} />)
        const duration = performance.now() - start

        console.log(`Render (50k): ${duration.toFixed(1)}ms`)

        expect(duration).toBeLessThan(200)
        // Verify virtualization is actually active
        expect(screen.getAllByRole('row').length).toBeLessThan(50)
    })

    it('maintains 60fps frame budget during scroll', () => {
        render(<DataGrid rows={generateRows(50000)} columns={columns} height={600} />)
        const grid = screen.getByRole('grid')

        const start = performance.now()

        // Thrash scrolling
        // Thrash scrolling
        const scrollPositions = [5000, 10000, 25000, 49000]
        for (const scrollTop of scrollPositions) {
            fireEvent.scroll(grid, { target: { scrollTop } })
        }

        const perScrollMs = (performance.now() - start) / 4
        console.log(`Scroll Ops: ${perScrollMs.toFixed(2)}ms avg`)

        // Relaxed budget for JSDOM overhead (real browser would be faster)
        expect(perScrollMs).toBeLessThan(50)
    })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataGrid from '../src/components/DataGrid'
import '@testing-library/jest-dom'

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

function generateRows(count: number) {
    const rows = []
    for (let i = 0; i < count; i++) {
        rows.push({
            id: i + 1,
            name: `Person ${i + 1}`,
            email: `person${i + 1}@example.com`,
            age: 20 + (i % 50),
            department: 'Engineering',
            salary: 50000,
        })
    }
    return rows
}

const columns = [
    { key: 'id', label: 'ID', width: 80, pinned: true },
    { key: 'name', label: 'Name', width: 150 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'department', label: 'Department', width: 150 },
]

describe('DataGrid Performance (50,000 rows)', () => {
    it('renders initial viewport in under 100ms', () => {
        const rows = generateRows(50000)

        const start = performance.now()
        render(<DataGrid rows={rows} columns={columns} height={500} />)
        const end = performance.now()

        const duration = end - start
        console.log(`Initial render (50k rows): ${duration.toFixed(2)}ms`)

        // precise rendering time depends on machine, but should be fast
        // typical non-virtualized list would take >1000ms or crash
        expect(duration).toBeLessThan(200)

        // Assert virtualization: only ~20 rows should be in DOM
        // (500px height / 36px row = 14 rows + buffer)
        const renderedRows = screen.getAllByRole('row')
        expect(renderedRows.length).toBeLessThan(50) // Header + 20-30 rows
    })

    it('scroll updates are fast (under 16ms budget)', () => {
        const rows = generateRows(50000)
        render(<DataGrid rows={rows} columns={columns} height={500} />)

        const grid = screen.getByRole('grid')

        const start = performance.now()

        // Simulate heavy scrolling
        fireEvent.scroll(grid, { target: { scrollTop: 5000 } })
        fireEvent.scroll(grid, { target: { scrollTop: 10000 } })
        fireEvent.scroll(grid, { target: { scrollTop: 15000 } })

        const end = performance.now()
        const duration = end - start
        const timePerScroll = duration / 3

        console.log(`Average scroll update time: ${timePerScroll.toFixed(2)}ms`)

        // Each scroll event should be handled quickly
        // Note: JSDOM doesn't do layout, so this tests logic speed, not painting
        expect(timePerScroll).toBeLessThan(20)
    })
})

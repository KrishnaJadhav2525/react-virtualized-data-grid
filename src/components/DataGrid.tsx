import { useState, useRef, useCallback, useMemo, useEffect } from 'react'

// types - keeping them here, not abstracting to separate file
// because "I just started building and didn't bother splitting yet"
type ColumnDef = {
    key: string
    label: string
    width: number
    pinned?: boolean
    editable?: boolean
}

type RowData = Record<string, unknown>

type SortConfig = {
    columnKey: string
    direction: 'asc' | 'desc'
}

type EditingCell = {
    rowIndex: number
    colKey: string
} | null

type UndoAction = {
    type: 'column-resize' | 'column-reorder' | 'column-visibility' | 'cell-edit'
    payload: unknown
}

type DataGridProps = {
    rows: RowData[]
    columns: ColumnDef[]
    height: number
}

const ROW_HEIGHT = 36
const HEADER_HEIGHT = 40
const BUFFER_ROWS = 5

export default function DataGrid({ rows, columns: initialColumns, height }: DataGridProps) {
    // Main container ref for scroll handling
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // scroll position
    const [scrollTop, setScrollTop] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    // columns state - can be reordered, resized, hidden
    const [columns, setColumns] = useState(initialColumns)
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

    // sorting
    const [sortConfig, setSortConfig] = useState<SortConfig[]>([])

    // editing
    const [editingCell, setEditingCell] = useState<EditingCell>(null)
    const [editValue, setEditValue] = useState('')
    const [editError, setEditError] = useState<string | null>(null)
    const [rowData, setRowData] = useState(rows)

    // undo stack - just an array, nothing fancy
    const [undoStack, setUndoStack] = useState<UndoAction[]>([])

    // focus management for keyboard nav
    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)

    // column visibility dropdown
    const [showColumnMenu, setShowColumnMenu] = useState(false)

    // resizing state
    const [resizingCol, setResizingCol] = useState<string | null>(null)
    const [resizeStartX, setResizeStartX] = useState(0)
    const [resizeStartWidth, setResizeStartWidth] = useState(0)

    // visible columns (not hidden)
    const visibleColumns = useMemo(() => {
        return columns.filter(c => !hiddenColumns.has(c.key))
    }, [columns, hiddenColumns])

    // pinned vs scrollable columns
    const pinnedColumns = useMemo(() => visibleColumns.filter(c => c.pinned), [visibleColumns])
    const scrollableColumns = useMemo(() => visibleColumns.filter(c => !c.pinned), [visibleColumns])

    // pinned width for offset
    const pinnedWidth = useMemo(() => {
        return pinnedColumns.reduce((sum, c) => sum + c.width, 0)
    }, [pinnedColumns])

    // total scrollable width
    const scrollableWidth = useMemo(() => {
        return scrollableColumns.reduce((sum, c) => sum + c.width, 0)
    }, [scrollableColumns])

    // sorted data - doing it inline because I didn't want to make a util function yet
    const sortedData = useMemo(() => {
        if (sortConfig.length === 0) return rowData

        const sorted = [...rowData]
        sorted.sort((a, b) => {
            for (const { columnKey, direction } of sortConfig) {
                const aVal = a[columnKey]
                const bVal = b[columnKey]

                let comparison = 0
                if (aVal === null || aVal === undefined) comparison = 1
                else if (bVal === null || bVal === undefined) comparison = -1
                else if (typeof aVal === 'string' && typeof bVal === 'string') {
                    comparison = aVal.localeCompare(bVal)
                } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal
                } else {
                    comparison = String(aVal).localeCompare(String(bVal))
                }

                if (comparison !== 0) {
                    return direction === 'asc' ? comparison : -comparison
                }
            }
            return 0
        })
        return sorted
    }, [rowData, sortConfig])

    // virtualization calculations
    const viewportHeight = height - HEADER_HEIGHT
    const totalHeight = sortedData.length * ROW_HEIGHT

    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS)
    const visibleRowCount = Math.ceil(viewportHeight / ROW_HEIGHT) + 2 * BUFFER_ROWS
    const endRow = Math.min(sortedData.length, startRow + visibleRowCount)

    const visibleRows = sortedData.slice(startRow, endRow)
    const offsetY = startRow * ROW_HEIGHT

    // column virtualization for scrollable columns
    // figuring out which columns are visible based on scrollLeft
    const { visibleScrollableCols, colStartOffset } = useMemo(() => {
        let accWidth = 0
        let foundStart = false
        const containerWidth = scrollContainerRef.current?.clientWidth ?? 800
        const viewWidth = containerWidth - pinnedWidth

        const result: ColumnDef[] = []
        let startOffset = 0

        for (let i = 0; i < scrollableColumns.length; i++) {
            const col = scrollableColumns[i]
            if (!col) continue

            if (!foundStart && accWidth + col.width > scrollLeft) {
                foundStart = true
                startOffset = accWidth
            }

            if (foundStart) {
                result.push(col)
                if (accWidth - scrollLeft > viewWidth + 100) {
                    break // past viewport with buffer
                }
            }

            accWidth += col.width
        }

        return { visibleScrollableCols: result, colStartOffset: startOffset }
    }, [scrollableColumns, scrollLeft, pinnedWidth])

    // scroll handler
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        setScrollTop(target.scrollTop)
        setScrollLeft(target.scrollLeft)
    }, [])

    // sorting click handler
    const handleSort = useCallback((columnKey: string, e: React.MouseEvent | React.KeyboardEvent) => {
        const isMulti = e.shiftKey

        setSortConfig(prev => {
            const existing = prev.find(s => s.columnKey === columnKey)

            if (existing) {
                // toggle direction or remove
                if (existing.direction === 'asc') {
                    return prev.map(s =>
                        s.columnKey === columnKey ? { ...s, direction: 'desc' as const } : s
                    )
                } else {
                    // remove from sort
                    return prev.filter(s => s.columnKey !== columnKey)
                }
            } else {
                // add new sort
                if (isMulti) {
                    return [...prev, { columnKey, direction: 'asc' as const }]
                } else {
                    return [{ columnKey, direction: 'asc' as const }]
                }
            }
        })
    }, [])

    // column resize handlers
    const handleResizeStart = useCallback((colKey: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const col = columns.find(c => c.key === colKey)
        if (!col) return

        // save for undo
        setUndoStack(prev => [...prev, {
            type: 'column-resize',
            payload: { key: colKey, width: col.width }
        }])

        setResizingCol(colKey)
        setResizeStartX(e.clientX)
        setResizeStartWidth(col.width)
    }, [columns])

    // mouse move for resize
    useEffect(() => {
        if (!resizingCol) return

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - resizeStartX
            const newWidth = Math.max(50, resizeStartWidth + diff)

            setColumns(prev => prev.map(c =>
                c.key === resizingCol ? { ...c, width: newWidth } : c
            ))
        }

        const handleMouseUp = () => {
            setResizingCol(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizingCol, resizeStartX, resizeStartWidth])

    // editing handlers
    const startEditing = useCallback((rowIndex: number, colKey: string) => {
        const actualRowIdx = startRow + rowIndex
        const row = sortedData[actualRowIdx]
        if (!row) return

        const col = columns.find(c => c.key === colKey)
        if (!col || !col.editable) return

        setEditingCell({ rowIndex: actualRowIdx, colKey })
        setEditValue(String(row[colKey] ?? ''))
        setEditError(null)
    }, [startRow, sortedData, columns])

    const cancelEditing = useCallback(() => {
        setEditingCell(null)
        setEditValue('')
        setEditError(null)
    }, [])

    // mock async validation
    const validateAndSave = useCallback(async () => {
        if (!editingCell) return

        const { rowIndex, colKey } = editingCell
        const oldRow = sortedData[rowIndex]
        if (!oldRow) return

        const oldValue = oldRow[colKey]

        // save for undo before applying
        setUndoStack(prev => [...prev, {
            type: 'cell-edit',
            payload: { rowIndex, colKey, oldValue }
        }])

        // optimistic update
        setRowData(prev => {
            const newData = [...prev]
            const originalIdx = rows.findIndex(r => r['id'] === sortedData[rowIndex]?.['id'])
            if (originalIdx >= 0 && newData[originalIdx]) {
                newData[originalIdx] = { ...newData[originalIdx], [colKey]: editValue }
            }
            return newData
        })

        // simulate async validation - fail 20% of the time for demo
        await new Promise(resolve => setTimeout(resolve, 300))

        const shouldFail = Math.random() < 0.2
        if (shouldFail) {
            // rollback
            setRowData(prev => {
                const newData = [...prev]
                const originalIdx = rows.findIndex(r => r['id'] === sortedData[rowIndex]?.['id'])
                if (originalIdx >= 0 && newData[originalIdx]) {
                    newData[originalIdx] = { ...newData[originalIdx], [colKey]: oldValue }
                }
                return newData
            })
            setEditError('Validation failed - value not allowed')
            // remove from undo since it was rolled back
            setUndoStack(prev => prev.slice(0, -1))
            return
        }

        setEditingCell(null)
        setEditValue('')
        setEditError(null)
    }, [editingCell, editValue, sortedData, rows])

    // undo handler
    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return

        const action = undoStack[undoStack.length - 1]
        if (!action) return

        setUndoStack(prev => prev.slice(0, -1))

        if (action.type === 'column-resize') {
            const { key, width } = action.payload as { key: string; width: number }
            setColumns(prev => prev.map(c => c.key === key ? { ...c, width } : c))
        } else if (action.type === 'cell-edit') {
            const { rowIndex, colKey, oldValue } = action.payload as { rowIndex: number; colKey: string; oldValue: unknown }
            setRowData(prev => {
                const newData = [...prev]
                const row = sortedData[rowIndex]
                if (row) {
                    const originalIdx = rows.findIndex(r => r['id'] === row['id'])
                    if (originalIdx >= 0 && newData[originalIdx]) {
                        newData[originalIdx] = { ...newData[originalIdx], [colKey]: oldValue }
                    }
                }
                return newData
            })
        } else if (action.type === 'column-visibility') {
            const { key, wasHidden } = action.payload as { key: string; wasHidden: boolean }
            setHiddenColumns(prev => {
                const next = new Set(prev)
                if (wasHidden) {
                    next.add(key)
                } else {
                    next.delete(key)
                }
                return next
            })
        }
    }, [undoStack, sortedData, rows])

    // column visibility toggle
    const toggleColumnVisibility = useCallback((colKey: string) => {
        const wasHidden = hiddenColumns.has(colKey)

        setUndoStack(prev => [...prev, {
            type: 'column-visibility',
            payload: { key: colKey, wasHidden }
        }])

        setHiddenColumns(prev => {
            const next = new Set(prev)
            if (wasHidden) {
                next.delete(colKey)
            } else {
                next.add(colKey)
            }
            return next
        })
    }, [hiddenColumns])

    // keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!focusedCell) return

        const { row, col } = focusedCell
        const allVisibleCols = [...pinnedColumns, ...scrollableColumns]

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                if (row < sortedData.length - 1) {
                    setFocusedCell({ row: row + 1, col })
                    // scroll into view if needed
                    const newScrollTop = (row + 1 - BUFFER_ROWS) * ROW_HEIGHT
                    if (scrollContainerRef.current && newScrollTop > scrollTop + viewportHeight - ROW_HEIGHT * 2) {
                        scrollContainerRef.current.scrollTop = newScrollTop
                    }
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                if (row > 0) {
                    setFocusedCell({ row: row - 1, col })
                }
                break
            case 'ArrowRight':
                e.preventDefault()
                if (col < allVisibleCols.length - 1) {
                    setFocusedCell({ row, col: col + 1 })
                }
                break
            case 'ArrowLeft':
                e.preventDefault()
                if (col > 0) {
                    setFocusedCell({ row, col: col - 1 })
                }
                break
            case 'Enter':
                e.preventDefault()
                if (editingCell) {
                    validateAndSave()
                } else {
                    const focusedColDef = allVisibleCols[col]
                    if (focusedColDef && focusedColDef.editable) {
                        startEditing(row - startRow, focusedColDef.key)
                    }
                }
                break
            case 'Escape':
                e.preventDefault()
                if (editingCell) {
                    cancelEditing()
                }
                break
            case 'Home':
                e.preventDefault()
                if (e.ctrlKey) {
                    setFocusedCell({ row: 0, col: 0 })
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0
                        scrollContainerRef.current.scrollLeft = 0
                    }
                } else {
                    setFocusedCell({ row, col: 0 })
                }
                break
            case 'End':
                e.preventDefault()
                if (e.ctrlKey) {
                    setFocusedCell({ row: sortedData.length - 1, col: allVisibleCols.length - 1 })
                } else {
                    setFocusedCell({ row, col: allVisibleCols.length - 1 })
                }
                break
            case 'z':
                if (e.ctrlKey) {
                    e.preventDefault()
                    handleUndo()
                }
                break
        }
    }, [focusedCell, pinnedColumns, scrollableColumns, sortedData, scrollTop, viewportHeight, editingCell, validateAndSave, startEditing, startRow, cancelEditing, handleUndo])

    // render a cell - inline here, not a separate component on purpose
    const renderCell = (row: RowData, col: ColumnDef, rowIdx: number, colIdx: number, isPinned: boolean) => {
        const actualRowIdx = startRow + rowIdx
        const absoluteColIdx = isPinned ? colIdx : pinnedColumns.length + (scrollableColumns.findIndex(c => c.key === col.key) ?? 0)

        const isFocused = focusedCell?.row === actualRowIdx && focusedCell?.col === absoluteColIdx
        const isEditing = editingCell?.rowIndex === actualRowIdx && editingCell?.colKey === col.key

        const cellValue = row[col.key]

        return (
            <div
                key={col.key}
                role="gridcell"
                aria-colindex={absoluteColIdx + 1}
                aria-readonly={!col.editable}
                tabIndex={isFocused ? 0 : -1}
                className={`
          flex items-center px-3 border-r border-b border-[var(--grid-border)]
          text-sm truncate
          ${isFocused ? 'outline outline-2 outline-[var(--grid-focus)] outline-offset-[-2px] z-10' : ''}
          ${rowIdx % 2 === 1 ? 'bg-[var(--grid-row-alt)]' : 'bg-[var(--grid-bg)]'}
        `}
                style={{
                    width: col.width,
                    height: ROW_HEIGHT,
                    minWidth: col.width,
                    flexShrink: 0
                }}
                onClick={() => setFocusedCell({ row: actualRowIdx, col: absoluteColIdx })}
                onDoubleClick={() => {
                    if (col.editable) {
                        startEditing(rowIdx, col.key)
                    }
                }}
                onFocus={() => setFocusedCell({ row: actualRowIdx, col: absoluteColIdx })}
            >
                {isEditing ? (
                    <div className="flex flex-col w-full">
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => validateAndSave()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    validateAndSave()
                                } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    cancelEditing()
                                }
                                e.stopPropagation()
                            }}
                            autoFocus
                            className="w-full px-1 py-0.5 border border-[var(--grid-focus)] rounded text-sm"
                            aria-label={`Editing ${col.label}`}
                        />
                        {editError && (
                            <span className="text-xs text-red-600" role="alert">{editError}</span>
                        )}
                    </div>
                ) : (
                    <span>{cellValue != null ? String(cellValue) : ''}</span>
                )}
            </div>
        )
    }

    // render header cell
    const renderHeaderCell = (col: ColumnDef, _colIdx: number, _isPinned: boolean) => {
        const sortInfo = sortConfig.find(s => s.columnKey === col.key)
        const sortIndex = sortConfig.findIndex(s => s.columnKey === col.key)

        return (
            <div
                key={col.key}
                role="columnheader"
                aria-sort={sortInfo ? (sortInfo.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="flex items-center px-3 border-r border-b border-[var(--grid-border)] bg-[var(--grid-header)] font-medium text-sm select-none relative"
                style={{
                    width: col.width,
                    height: HEADER_HEIGHT,
                    minWidth: col.width,
                    flexShrink: 0
                }}
            >
                <button
                    type="button"
                    onClick={(e) => handleSort(col.key, e)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSort(col.key, e)
                        }
                    }}
                    className="flex-1 text-left truncate hover:text-[var(--grid-focus)] focus:outline-none focus:underline"
                    aria-label={`Sort by ${col.label}${sortInfo ? `, currently ${sortInfo.direction}ending` : ''}`}
                >
                    {col.label}
                    {sortInfo && (
                        <span className="ml-1">
                            {sortInfo.direction === 'asc' ? '↑' : '↓'}
                            {sortConfig.length > 1 && <sup className="text-xs">{sortIndex + 1}</sup>}
                        </span>
                    )}
                </button>

                {/* resize handle */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--grid-focus)]"
                    onMouseDown={(e) => handleResizeStart(col.key, e)}
                    aria-hidden="true"
                />
            </div>
        )
    }

    // live region for screen reader announcements
    const [announcement, setAnnouncement] = useState('')

    useEffect(() => {
        if (focusedCell) {
            const allVisibleCols = [...pinnedColumns, ...scrollableColumns]
            const col = allVisibleCols[focusedCell.col]
            const row = sortedData[focusedCell.row]
            if (col && row) {
                setAnnouncement(`Row ${focusedCell.row + 1} of ${sortedData.length}, Column ${col.label}, Value: ${row[col.key] ?? 'empty'}`)
            }
        }
    }, [focusedCell, pinnedColumns, scrollableColumns, sortedData])

    return (
        <div
            ref={containerRef}
            className="relative border border-[var(--grid-border)] rounded"
            style={{ height }}
        >
            {/* toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--grid-border)] bg-gray-50">
                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    aria-label="Undo last action"
                >
                    Undo
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                        aria-expanded={showColumnMenu}
                        aria-haspopup="true"
                    >
                        Columns
                    </button>

                    {showColumnMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-[150px]">
                            {columns.map((col) => (
                                <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!hiddenColumns.has(col.key)}
                                        onChange={() => toggleColumnVisibility(col.key)}
                                    />
                                    <span className="text-sm">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <span className="text-sm text-gray-500 ml-auto">
                    {sortedData.length.toLocaleString()} rows
                </span>
            </div>

            {/* grid */}
            <div
                ref={scrollContainerRef}
                role="grid"
                aria-rowcount={sortedData.length + 1}
                aria-colcount={visibleColumns.length}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="overflow-auto focus:outline-none"
                style={{ height: height - 44 }} // minus toolbar height
            >
                {/* screen reader live region */}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {announcement}
                </div>

                {/* header row */}
                <div
                    role="row"
                    aria-rowindex={1}
                    className="flex sticky top-0 z-20"
                >
                    {/* pinned header cells */}
                    <div className="flex sticky left-0 z-30 bg-[var(--grid-header)]">
                        {pinnedColumns.map((col, idx) => renderHeaderCell(col, idx, true))}
                    </div>

                    {/* scrollable header cells */}
                    <div
                        className="flex"
                        style={{
                            paddingLeft: colStartOffset - scrollLeft,
                            width: scrollableWidth
                        }}
                    >
                        {visibleScrollableCols.map((col, idx) => renderHeaderCell(col, pinnedColumns.length + idx, false))}
                    </div>
                </div>

                {/* body - spacer for virtualization */}
                <div style={{ height: totalHeight, position: 'relative' }}>
                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                        {visibleRows.map((row, rowIdx) => (
                            <div
                                key={row['id'] != null ? String(row['id']) : rowIdx}
                                role="row"
                                aria-rowindex={startRow + rowIdx + 2}
                                className="flex"
                            >
                                {/* pinned cells */}
                                <div className="flex sticky left-0 z-10 bg-[var(--grid-bg)]">
                                    {pinnedColumns.map((col, colIdx) => renderCell(row, col, rowIdx, colIdx, true))}
                                </div>

                                {/* scrollable cells */}
                                <div
                                    className="flex"
                                    style={{
                                        paddingLeft: colStartOffset - scrollLeft,
                                        width: scrollableWidth
                                    }}
                                >
                                    {visibleScrollableCols.map((col, colIdx) => renderCell(row, col, rowIdx, colIdx, false))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

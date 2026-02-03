import DataGrid from './components/DataGrid'

// generate some dummy data for testing
function generateRows(count: number) {
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

function App() {
    const rows = generateRows(50000)

    const columns = [
        { key: 'id', label: 'ID', width: 80, pinned: true },
        { key: 'name', label: 'Name', width: 150, editable: true },
        { key: 'email', label: 'Email', width: 220, editable: true },
        { key: 'age', label: 'Age', width: 80, editable: true },
        { key: 'department', label: 'Department', width: 130 },
        { key: 'salary', label: 'Salary', width: 100 },
        { key: 'startDate', label: 'Start Date', width: 120 },
        { key: 'status', label: 'Status', width: 100 },
    ]

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Data Grid Demo - 50,000 Rows</h1>
            <DataGrid
                rows={rows}
                columns={columns}
                height={600}
            />
        </div>
    )
}

export default App

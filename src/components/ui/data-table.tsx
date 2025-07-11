'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from '@tanstack/react-table';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
}

// This filter function simply includes rows that match, but doesn't prioritize
function createTextFilterFn<T>(): FilterFn<T> {
  return (row, columnId, value) => {
    if (!value) return true;

    const searchValue = String(value).trim().toLowerCase();
    const cellValue = String(row.getValue(columnId)).toLowerCase();

    return cellValue.includes(searchValue);
  };
}

// Get string value from an object property, with safe type handling
// We use 'unknown' here because the data could be of any structure
// and we're safely checking type before accessing properties
function getStringValue(obj: unknown, key: string): string {
  if (obj && typeof obj === 'object' && key in obj) {
    return String((obj as Record<string, unknown>)[key]).toLowerCase();
  }
  return '';
}

// Main component
export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Filter...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredRows, setFilteredRows] = React.useState<TData[]>(data);

  // Basic filter function to include matching rows
  const textFilter = React.useMemo(() => createTextFilterFn<TData>(), []);

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchTerm(value);

    if (searchColumn && value.trim()) {
      // Apply filter to get matching rows
      const searchVal = value.trim().toLowerCase();

      // Custom sort - manually sort data before passing to table
      const customSorted = [...data]
        .filter((row) => {
          // Safely get string value
          const cellValue = getStringValue(row, searchColumn);
          return cellValue.includes(searchVal);
        })
        .sort((a, b) => {
          // Get string values safely
          const aValue = getStringValue(a, searchColumn);
          const bValue = getStringValue(b, searchColumn);

          // 1. Exact match (highest priority)
          const aExactMatch = aValue === searchVal;
          const bExactMatch = bValue === searchVal;

          // Single word exact matches get highest priority
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // 2. Sort by word length for non-exact matches
          // This ensures shorter entries appear before longer ones
          return aValue.length - bValue.length;
        });

      // Update the filtered data
      setFilteredRows(customSorted);

      // Apply the filter to the table
      table.getColumn(searchColumn)?.setFilterValue(value);
    } else {
      // Reset to original data if no search
      setFilteredRows(data);
    }
  };

  // Create table instance
  const table = useReactTable({
    data: filteredRows, // Use our manually sorted data
    columns,
    filterFns: {
      text: textFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Set up filter on column
  React.useEffect(() => {
    if (searchColumn) {
      const column = table.getColumn(searchColumn);
      if (column) {
        column.columnDef.filterFn = textFilter;
      }
    }
  }, [searchColumn, table, textFilter]);

  // Update filtered data if original data changes
  React.useEffect(() => {
    if (!searchTerm) {
      setFilteredRows(data);
    }
  }, [data, searchTerm]);

  return (
    <div className="w-full">
      {searchColumn && (
        <div className="flex items-center py-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(event) => handleSearch(event.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

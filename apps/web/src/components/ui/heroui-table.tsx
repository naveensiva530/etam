"use client"

import * as React from "react"

// ─── Scroll Container ───────────────────────────────────────────────────────
const ScrollContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => (
  <div ref={ref} className={`w-full overflow-x-auto ${className}`} {...props}>
    {children}
  </div>
))
ScrollContainer.displayName = "Table.ScrollContainer"

// ─── Table.Content (the actual <table>) ─────────────────────────────────────
interface TableContentProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode
  "aria-label"?: string
}
const TableContent = React.forwardRef<HTMLTableElement, TableContentProps>(
  ({ children, className = "", ...props }, ref) => (
    <table
      ref={ref}
      className={`w-full border-separate border-spacing-0 text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  )
)
TableContent.displayName = "Table.Content"

// ─── Table.Header (<thead>) ──────────────────────────────────────────────────
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className = "", ...props }, ref) => (
  <thead
    ref={ref}
    className={`bg-transparent ${className}`}
    {...props}
  >
    <tr>{children}</tr>
  </thead>
))
TableHeader.displayName = "Table.Header"

// ─── Table.Column (<th>) ─────────────────────────────────────────────────────
interface TableColumnProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isRowHeader?: boolean
}
const TableColumn = React.forwardRef<HTMLTableCellElement, TableColumnProps>(
  ({ children, className = "", isRowHeader: _isRowHeader, ...props }, ref) => (
    <th
      ref={ref}
      className={`relative px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-normal whitespace-nowrap after:pointer-events-none after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-3.5 after:w-[1px] after:bg-neutral-300 dark:after:bg-neutral-700 last:after:hidden ${className}`}
      {...props}
    >
      {children}
    </th>
  )
)
TableColumn.displayName = "Table.Column"

// ─── Table.Body (<tbody>) ─────────────────────────────────────────────────────
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className = "", ...props }, ref) => (
  <tbody
    ref={ref}
    className={`table-heroui-body ${className}`}
    {...props}
  >
    {children}
  </tbody>
))
TableBody.displayName = "Table.Body"

// ─── Table.Row (<tr>) ─────────────────────────────────────────────────────────
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ children, className = "", ...props }, ref) => (
  <tr
    ref={ref}
    className={`group transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
))
TableRow.displayName = "Table.Row"

// ─── Table.Cell (<td>) ────────────────────────────────────────────────────────
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ children, className = "", ...props }, ref) => (
  <td
    ref={ref}
    className={`bg-white dark:bg-neutral-950 px-4 py-3.5 text-sm text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-50/80 dark:group-hover:bg-neutral-900/50 transition-colors [tr:first-child_&:first-child]:rounded-tl-xl [tr:first-child_&:last-child]:rounded-tr-xl [tr:last-child_&:first-child]:rounded-bl-xl [tr:last-child_&:last-child]:rounded-br-xl ${className}`}
    {...props}
  >
    {children}
  </td>
))
TableCell.displayName = "Table.Cell"

// ─── Table Root (outer rounded container matching HeroUI demo) ───────────────
interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}
const TableRoot = React.forwardRef<HTMLDivElement, TableRootProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`w-full rounded-2xl bg-[#f4f4f5] dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-1 shadow-2xs overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
TableRoot.displayName = "Table"

// ─── Compound export ──────────────────────────────────────────────────────────
const Table = Object.assign(TableRoot, {
  ScrollContainer,
  Content: TableContent,
  Header: TableHeader,
  Body: TableBody,
  Column: TableColumn,
  Row: TableRow,
  Cell: TableCell,
})

export {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
}
export default Table

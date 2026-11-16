Please implement this issue.

#48 Export invoices to Excel

Every month accounting opens our CSV in Excel and fixes it by hand: the amounts arrive as text, and so do the dates. Add `invoicer xlsx <file> --out <workbook.xlsx>`, which writes the same rows and columns as `invoicer csv` to an Excel workbook, with the amounts as numbers and the dates as dates.

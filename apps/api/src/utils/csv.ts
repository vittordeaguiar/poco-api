const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
};

export const buildCsv = (headers: string[], rows: Array<Array<unknown>>) => {
  const headerLine = headers.map(csvEscape).join(",");
  const body = rows
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");
  return [headerLine, body].filter(Boolean).join("\n");
};

export const csvResponse = (filename: string, csv: string) => ({
  "Content-Type": "text/csv; charset=utf-8",
  "Content-Disposition": `attachment; filename="${filename}"`
});

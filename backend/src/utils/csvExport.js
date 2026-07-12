import { Parser } from 'json2csv';

/**
 * Converts an array of plain objects to a CSV string and sends it as a download.
 */
export function sendCsv(res, filename, rows) {
  if (!rows || rows.length === 0) {
    return res.status(200).type('text/csv').attachment(filename).send('');
  }
  const fields = Object.keys(rows[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  return res.send(csv);
}

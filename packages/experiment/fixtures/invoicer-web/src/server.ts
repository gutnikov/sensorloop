import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const invoicesFile = process.env.INVOICES_FILE ?? 'data/invoices.json';

createApp({ invoicesFile }).listen(port, () => {
  console.log(`invoicer-web listening on http://localhost:${port}`);
});

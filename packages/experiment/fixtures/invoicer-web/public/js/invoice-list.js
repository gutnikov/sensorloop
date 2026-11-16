// The filter on the invoice list: as you type, only the rows whose text contains it stay.
const input = document.querySelector('#filter');
const rows = [...document.querySelectorAll('#invoices tbody tr')];

input.addEventListener('input', () => {
  const query = input.value.trim().toLowerCase();
  for (const row of rows) row.hidden = !row.textContent.toLowerCase().includes(query);
});

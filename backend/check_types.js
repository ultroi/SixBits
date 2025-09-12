const XLSX = require('xlsx');

const workbook = XLSX.readFile('College-Affiliated College.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1});

// Skip first two rows (date and headers)
const data = rawData.slice(2);

console.log('Management column (index 8) values for first 10 data rows:');
for (let i = 0; i < Math.min(10, data.length); i++) {
  console.log(`Row ${i + 1}: "${data[i][8]}"`);
}

console.log('\nUnique management values:');
const uniqueValues = [...new Set(data.map(row => row[8]).filter(val => val))];
uniqueValues.forEach(val => console.log(`"${val}"`));
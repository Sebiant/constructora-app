const XLSX = require("xlsx");
const workbook = XLSX.readFile("c:/xampp/htdocs/sgigescon/app_json/importe_items.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data.slice(0, 50), null, 2));

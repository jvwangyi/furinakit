const r = await fetch('http://localhost:3001/furinakit/api/tools');
const d = await r.json();
console.log('Total registered tools:', d.data.length);
d.data.forEach((t, i) => {
  console.log(`  ${i + 1}. ${t.name} [${t.category}]`);
});

const fs = require('fs');
const spec = require('swagger-tools').specs.v2;

const file = process.argv[2];
if (!file) {
  console.log('file name should be provided as a script argument');
  process.exit(1);
}

fs.readFile(file, (err, schema) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  const schemaJSON = JSON.parse(schema);
  spec.resolve(schemaJSON, (resolveErr, res) => {
    if (resolveErr) {
      console.log(err);
      process.exit(1);
    }
    fs.writeFileSync(`resolved-${file}`, JSON.stringify(res));
    process.exit();
  });
});

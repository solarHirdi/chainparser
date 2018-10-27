/* eslint-disable no-console, no-use-before-define */

const ChainParser = require('./src/chainparser');
const DB = require('./src/db');
const Server = require('./src/server');

async function init() {
  const db = await DB();
  const server = new Server(db);
  const chainParser = new ChainParser(db);
  server.start();
  chainParser.start();

  process.on('SIGINT', function () {
    chainParser.stop(() => console.log('parser stopped'));
    server.close(() => console.log('server stopped'));
    db.close(() => console.log('db stopped'));
    process.exit();
  });
}

return init();

/* eslint-enable no-console, no-use-before-define */

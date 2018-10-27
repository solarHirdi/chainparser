/* eslint-disable no-console, no-use-before-define */

const Loki = require('lokijs');
const CONFIG = require('dotenv').config().parsed;

module.exports = () => new Promise(resolve => {
  const db = new Loki(CONFIG.DB_NAME, {
    autoload: true,
    autoloadCallback: init,
    autosave: true,
    autosaveInterval: 4000
  });

  function init() {
    const txs = db.getCollection(CONFIG.DB_COLLECTION_TXS);
    if (txs === null) {
      db.addCollection(CONFIG.DB_COLLECTION_TXS);
    }
    let options = db.getCollection(CONFIG.DB_COLLECTION_OPTIONS);
    if (options === null) {
      options = db.addCollection(CONFIG.DB_COLLECTION_OPTIONS);
      options.insert({name: 'checkedBlockNum', value: Number(CONFIG.PARSER_START_BLOCK_NUM)});
    }
    resolve(db);
  }
});

/* eslint-enable no-console, no-use-before-define */

/* eslint-disable no-console, no-use-before-define, no-plusplus */

const EOS = require('eosjs');
const CONFIG = require('dotenv').config().parsed;

const eos = EOS({
  chainId: CONFIG.API_CHAIN_ID,
  httpEndpoint: CONFIG.API_HTTP_ENDPOINT,
  expireInSeconds: 60,
  broadcast: true,
  verbose: false,
  sign: false
});

async function getHeadBlockNum() {
  const info = await eos.getInfo({});
  return info.head_block_num;
}

async function getTxs(startblockNum, endBlockNum) {
  const txs = [];
  const promises = [];
  for (let i = startblockNum; i <= endBlockNum; i++) {
    promises.push(eos.getBlock(i));
  }
  const blocks = await Promise.all(promises);
  blocks
    .sort((a, b) => a.block_num - b.block_num)
    .forEach(block => block.transactions.forEach(tx => txs.push({
      ...tx,
      block_num: block.block_num,
      trx: typeof tx.trx === 'string' ? {id: tx.trx} : tx.trx
    })));
  return txs;
}

function ChainParser(db) {
  const dbOptions = db.getCollection(CONFIG.DB_COLLECTION_OPTIONS);
  const dbTxs = db.getCollection(CONFIG.DB_COLLECTION_TXS);
  let timer;
  this.start = () => {
    timer = setTimeout(async function tick() {
      let timeInterval = Number(CONFIG.PARSER_TIMEOUT);
      try {
        const headBlockNum = await getHeadBlockNum();
        const startBlockNum = dbOptions.findOne({name: 'checkedBlockNum'}).value + 1;
        const diffBlockNum = headBlockNum - startBlockNum;
        const maxRequestsCount = Number(CONFIG.PARSER_MAX_REQUESTS_COUNT)
        if (diffBlockNum > maxRequestsCount) {
          timeInterval = 0;
        }
        const requestsCount = maxRequestsCount > diffBlockNum ? diffBlockNum : maxRequestsCount;
        const endBlockNum = startBlockNum + requestsCount - 1;
        if (diffBlockNum > 0) {
          const txs = await getTxs(startBlockNum, endBlockNum);
          dbTxs.insert(txs);
          dbOptions.findAndUpdate({name: 'checkedBlockNum'}, obj => (obj.value = endBlockNum));
          const count = dbTxs.count();
          const dbMaxTxsCount = Number(CONFIG.DB_MAX_TXS_COUNT);
          if (count > dbMaxTxsCount) {
            dbTxs.chain().simplesort('$loki', {desc: true}).offset(dbMaxTxsCount).remove();
          }
        }
      } catch (e) {
        console.error(e.message);
      }
      timer = setTimeout(tick, timeInterval);
    }, 0);
  };
  this.stop = (cb) => {
    clearTimeout(timer);
    cb();
  };
}

module.exports = ChainParser;

/* eslint-enable no-console, no-use-before-define, no-plusplus */

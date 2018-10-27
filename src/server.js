/* eslint-disable no-console, no-use-before-define */

const CONFIG = require('dotenv').config().parsed;
const cors = require('cors');
const express = require('express');

function asyncMiddleware(fn) {
  return (req, res, next) => {
    Promise
      .resolve(fn(req, res, next))
      .catch(next);
  };
}

function Server(db) {
  const txs = db.getCollection(CONFIG.DB_COLLECTION_TXS);
  const options = db.getCollection(CONFIG.DB_COLLECTION_OPTIONS);
  const app = express();
  let server;

  app.use(cors());

  app.get('/txs/recent', asyncMiddleware(async (req, res) => {
    const result = txs.chain().limit(Number(CONFIG.DB_MAX_TXS_COUNT)).data({removeMeta: true});
    res.send(result);
  }));

  app.get('/options', asyncMiddleware(async (req, res) => {
    const result = options.data;
    res.send(result);
  }));

  app.use(function (err, req, res, next) {
    console.dir(err);
    res.status(400).json({
      status: 'error',
      code: err.code,
      msg: err.message
    });
  });

  this.start = (cb) => {
    server = app.listen(CONFIG.APP_HTTP_PORT, cb);
  };

  this.close = (cb) => {
    server.close();
    cb();
  };
}

module.exports = Server;

/* eslint-enable no-console, no-use-before-define */

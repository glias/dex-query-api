const express = require('express');
const expressWinston = require('express-winston');
const winston = require('winston');

const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');
const ordersRouter = require('./orders/router');
const cellsRouter = require('./cells/router');
const balanceRouter = require('./balance/router');
const transactionsRouter = require('./transactions/router');
const swagger = require('./swagger/middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(boolParser());
app.use('/api-docs', swagger.middleware);

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
  ),
}));

app.use(
  ordersRouter,
  cellsRouter,
  balanceRouter,
  transactionsRouter,
);

app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
  ),
}));

module.exports = app;

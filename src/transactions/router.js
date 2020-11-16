const { Router } = require('express');
const controller = require('./controller');

const router = new Router();

router.route('/sudt-transactions')
  .get(controller.getSudtTransactions.bind(controller));

module.exports = router;

var express = require('express');
var router = express.Router();
var gitRouter  = require('./git');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
router.use('/git', gitRouter);

module.exports = router;

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('contact', {
        active: {
            index: '',
            tongqu: '',
            contact: 'active'
        }
    });
});

module.exports = router;

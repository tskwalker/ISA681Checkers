var express = require('express');
var router = express.Router();

router.get('/',(req,res) => {
    req.session.destroy();
    res.render('index',{logout:'You have successfully logged out.'});
});

module.exports=router;
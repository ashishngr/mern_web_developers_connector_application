const express = require('express');
const router = express.Router();
const gravatar =  require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config')
const {check, validationResult} = require('express-validator')

const User = require('../../modals/User')
//@route   POST api/users
// @desc   Register user
// access  Public

router.post('/',[
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'Pease include a valid email').isEmail(),
    check(
        'password', 
        'Please enter a valid password with 6 or more characters').isLength({min:6})
], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() })
    }
    const {name, email, password} = req.body;
    // set if user exist  
    try {
        let user = await User.findOne({email})

        if(user){
            res.status(400).json({errors: [{msg: 'User already exists'}]});
        }
    const avatar = gravatar.url(email,{
        s: '200',
        r: "pg",
        d: 'mm'
    })

    user = new User({
        name,
        email,
        avatar,
        password
    });


    const salt = await bcrypt.genSalt(10)

    user.password = await bcrypt.hash(password, salt);

    await user.save()

    const payload = {
        user: {
            id: user.id
        }
    }

    jwt.sign(payload, config.get('jwtSecret'),
    {expiresIn: 3600000000 },
    (err, token)=>{
        if(err) throw err;
        res.json({token})
    });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;



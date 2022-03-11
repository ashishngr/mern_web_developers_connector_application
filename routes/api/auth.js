const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const config = require('config')
const {check, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../../modals/User')
//@route   GET api/auth
// @desc   Get user by token
// access  Private

router.get('/',auth, async(req, res)=>{
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user)
    }catch(error){
        console.log(error.message);
        res.status(500).send('server error');
    }
});

//@route   POST api/auth
// @desc   authenticate user and get token
// access  Public

router.post('/',[
    check('email', 'Pease include a valid email').isEmail(),
    check(
        'password', 
        'Password is required').exists()
], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() })
    }
    const {email, password} = req.body;
    // set if user exist  
    try {
        let user = await User.findOne({email})

        if(!user){
            res.status(400).json({errors: [{msg: 'Invalid Credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res
            .status(400)
            .json({errors: [{msg: 'Invalid Credentials'}]});
        }
    
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




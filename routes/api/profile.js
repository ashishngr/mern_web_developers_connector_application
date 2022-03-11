const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');

const Profile = require('../../modals/Profile');
const User = require('../../modals/User');

//@route   GET api/profile/me
// @desc   get current user profile
// access  Private

router.get('/me', auth, async(req, res)=>{
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', 
        ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({msg: 'There is no profile for such name'});
        }
        res.json(profile)
    } catch (error) {
       console.log(error.message);
       res.status(500).send('server error') 
    }
})

//@route   POST api/profile/Profile
// @desc   create or update profile
// access  private

router.post('/', [auth, [
    check('status', 'Status is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills is required')
        .not()
        .isEmpty()    
]], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;
    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website= website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skills=>skills.trim());
    }
    //Build social object
    profileFields.social = {};
    if(twitter) profileFields.social.twitter = twitter;
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;

    try{
        let profile = await Profile.findOne({user: req.user.id})
        if(profile){
            //update
            profile = await Profile.findOneAndUpdate({user: req.user.id}, {$set:
            profileFields },
            {new: true});
            return res.json(profile);
        }
        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    }catch(error){
        console.log(error);
        res.status(500).send('Server error');
    }
})

//@route   GET api/profile/
// @desc   get all user profile
// access  Private

router.get('/', async(req, res)=>{
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles)
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
})


//@route   GET api/profile/user/user_id
// @desc   get profile by Id
// access  Private

router.get('/user/:user_id', async(req, res)=>{
    try {
        const profile = await Profile.findOne(({user: req.params.user_id})).populate('user', 
        ['name', 'avatar']);
  
        if(!profile){ 
            return res.status(400).json({msg: 'There is no profile for this user'})
        }

        res.json(profile)
        console.log(profile)
    } catch (error) {
        console.log(error);
        if(error.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.status(500).send('server error')
    }
})


//@route   DELETE api/profile/
// @desc   DELETE profile, user, post
// access  Private

router.delete('/',auth, async(req, res)=>{
    try {
        // @todo - remove user post

        // remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        // remove user
        await User.findOneAndRemove({_id: req.user.id});

        res.json({msg: 'User deleted'})
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
})


//@route   PUT api/profile/experience
// @desc    Add Profile education
// access  Private

router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Data is required').not().isEmpty(),

    ]
], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({msg: errors.array() });
    }
    const{
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile  = await Profile.findOne({user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
})

//@route   Delete api/profile/education/:exp_id
// @desc    Delete education from profile
// access  Private

router.delete('/experience/:exp_id', auth, async(req, res)=>{
    // try {
    //     const profile = await Profile.findOne({user: req.user.id});

    //     //get remove index;
    //     const removeIndex = profile.education.map(item=>item.id).indexOf(req.params.exp_id);
    //     profile.education.splice(removeIndex, 1);

    //     await profile.save();

    //     res.json(profile);
    // } catch (error) {
    //     console.log(error);
    //     res.status(500).send('Server Error');
    // }
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });
    
        foundProfile.experience = foundProfile.experience.filter(
          (exp) => exp._id.toString() !== req.params.exp_id
        );
    
        await foundProfile.save();
        return res.status(200).json(foundProfile);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
      }
})

//@route   PUT api/profile/education
// @desc    Add Profile education
// access  Private

router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'fieldofstudy Data is required').not().isEmpty(),
    check('from', 'from is required').not().isEmpty(),
    ]
  ], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({msg: errors.array() });
    }
    const{
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const  newEdu= {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        const profile  = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
})

//@route   Delete api/profile/education/:edu_id
// @desc    Delete education from profile
// access  Private

router.delete('/education/:edu_id', auth, async(req, res)=>{
    try {
    //     const profile = await Profile.findOne({user: req.user.id});

    //     //get remove index;
    //     const removeIndex = profile.education.map(item=>item.id).indexOf(req.params.edu_id);
    //     profile.education.splice(removeIndex, 1);

    //     await profile.save();

    //     res.json(profile);
    // } catch (error) {
    //     console.log(error);
    //     res.status(500).send('Server Error');
        const foundProfile = await Profile.findOne({ user: req.user.id });
        foundProfile.education = foundProfile.education.filter(
        (edu) => edu._id.toString() !== req.params.edu_id
        );
        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
        
})
//@route   Get api/profile/github/:username
// @desc    Get user repos fromGithub
// access  Public
router.get('/github/:username', (req, res)=>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }
        request(options, (error, response, body)=>{
            if(error) console.log(error);
            console.log(response.statusCode);
            if(response.statusCode !== 200){
                return res.status(404).json({msg: 'No Github Profile Found'});
                
            }
            res.json(JSON.parse(body));
        })
       
    } catch (error) {   
        console.log(error);
        res.status(400).json('server error');
    }
})

module.exports = router;




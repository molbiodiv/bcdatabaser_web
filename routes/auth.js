require('dotenv').config();
var express = require('express');
var router = express.Router();

// Set the configuration settings for oauth
const credentials = {
  client: {
    id: process.env.ORCID_ID,
    secret: process.env.ORCID_SECRET,
  },
  auth: {
    tokenHost: 'https://orcid.org',
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

router.get('/orcid', (req, res) => {
  res.redirect(oauth2.authorizationCode.authorizeURL({
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: '/authenticate',
    state: '3(dsf#0/!~',
  }));
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});


router.get('/whoami', function(req, res, next) {
  if(req.session.token){
    res.json({
      name: req.session.token.name,
      orcid: req.session.token.orcid
    });
  } else {
    res.json(null);
  }
});

// Callback service parsing the authorization token and asking for the access token
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const options = {
    code,
  };

  try {
    const result = await oauth2.authorizationCode.getToken(options);

    console.log('The resulting token: ', result);
    req.session.token = result;

    const token = oauth2.accessToken.create(result);

    return res.redirect("/");
    //return res.status(200).json(token);
  } catch (error) {
    console.error('Access Token Error', error.message);
    return res.status(500).json('Authentication failed');
  }
});

module.exports = router;

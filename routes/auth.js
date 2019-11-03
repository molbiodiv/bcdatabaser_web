require('dotenv').config();
var express = require('express');
var router = express.Router();

router.get('/orcid', (req, res) => {
  const oauth2 = req.app.locals.oauth2;
  res.redirect(oauth2.authorizationCode.authorizeURL({
    redirect_uri: 'https://bcdatabaser.molecular.eco/auth/callback',
    scope: '/authenticate',
    state: process.env.OAUTH_STATE,
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
  const oauth2 = req.app.locals.oauth2;
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

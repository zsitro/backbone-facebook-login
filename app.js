// Load the SDK Asynchronously
( function(d) {
  var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
  if(d.getElementById(id)) {
    return;
  }
  js = d.createElement('script');
  js.id = id;
  js.async = true;
  js.src = "//connect.facebook.net/en_US/all.js";
  ref.parentNode.insertBefore(js, ref);
}(document));

window.fbAsyncInit = function() {
  FB.init({
    appId : 'YOUR APP ID HERE',
    channelUrl : '//your/path/to/channel.php',
    status : true, // check login status
    cookie : true, // enable cookies to allow the server to access the session
    xfbml : true // parse XFBML
  });

  FB.getLoginStatus(function(response) {
    console.log('FB resp:', response, response.status);
    /* Bind event handler only after Facebook SDK had a nice cup of coffee */
    $('#btnLogin').on('click', function() {
      window.activeSession.login({
        before : function() {
          console.log('before login()')
        },
        after : function() {
          console.log('after login()')
        }
      });
    });
  });
};

SessionModel = Backbone.Model.extend({
  
  defaults : {
    id : null,
    third_party_id : null,
    name : null,
    email : null,
    status : 0
  },

  isAuthorized : function() {
    return this.has('third_party_id');
  },
  
  logout : function() {
    /* destroy session */
    window.activeSession.id = null;
    window.activeSession.third_party_id = null;
  },
  
  login : function(opts) {
    _session = this;
  
    opts.before && opts.before();
    //always called after login
    this._onAlways = function() {
      opts.after && opts.after();
    };
    
    this._onError = function(result) {
      console.log('this._onError with result:', result);
    };
    
    this._onSuccess = function(result) {
      console.log('this._onSuccess with result:', result);
      console.log(_session.get('third_party_id'));
    };
    
    this._getUserData = function(callBack) {
      FB.api('/me?fields=third_party_id,email,name', function(response) {
        if(!response || response.error) {
          callBack(response.error);
        } else {
          console.log('"/me" query success where username is ' + response['name'] + '.', response);
          callBack(response);
        }
      });
    };
    
    this._onComplete = function(err, result) {
      console.log('Queue finished. Error occured:', err, ' result:', result);
      err && _session._onError(result);
      !err && _session._onSuccess(result);
      _session._onAlways(result);
    };
    
    this._saveSession = function(user) {
      console.log('_saveSession called, user data:', user);
      /* successful if third_party_id exists */
      if(user['third_party_id']) {
        _session.set({
          id : user['id'],
          third_party_id : user['third_party_id'],
          name : user['name'],
          email : user['email'],
          status : 1
        });
        _session._onComplete(false, "Everything is wonderful.");
      } else {
        _session._onComplete(true, "third_party_id check failed!");
        return false;
      }
    };
    //here we go
    FB.login(function(response) {
      if(response.authResponse) {
        console.log('Fetching authResponse information.... ');
        _session._getUserData(_session._saveSession);
      } else {
        _session._onError('User cancelled login or did not fully authorize.');
      }
    }, {
      scope : 'email,user_likes'
    });

  }
  
});

/* Instantiate session */
window.activeSession = new SessionModel();
console.log('authorized after create (should be false):', window.activeSession.isAuthorized());

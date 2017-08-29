require('dotenv').config();

const express = require('express')
    , bodyParser = require('body-parser')
    , compression = require('compression')
    , auth = require('basic-auth')

    , dbo = require('./lib/db.js')
    ;

dbo.connect(function(err){

  // Config
  const app = express();
  app.listen(process.env.PORT || 3000);

  // Middlewares
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));

  // Database down
  if (err) {
    return app.use(function(req, res) {
      res.status(500);
      res.json({error: "Server down"});
    });
  }

  // Index DB
  //require('./lib/indexes.js')(dbo);

  const config = {
    '/products': {
      methods: {
        get: {
          auth: false,
          fnc: 'Products/list'
        },
        post: {
          auth: true,
          auth_type: 'admin',
          fnc: 'Products/create'
        }
      }
    },
    '/products/:id': {
      methods: {
        get: {
          auth: false,
          fnc: 'Products/get'
        },
        put: {
          auth: true,
          auth_type: 'admin',
          fnc: 'Products/update'
        },
        delete: {
          auth: true,
          auth_type: 'admin',
          fnc: 'Products/delete'
        }
      }
    }
  }

  // todo: Wrap in promise for exception handling
  for (i in config) {
    (function(i) {
      app.all(i, function(req, res){
        const params = config[i];

        // Validate method
        let methods = [];
        for (let method in params.methods)
          methods.push(method.toLowerCase());
        if (methods.indexOf(req.method.toLowerCase()) == -1) {
          return res.status(405).json({error: "Unsupported method"});
        }

        const methodParams = params.methods[req.method];
        Auth
          // Authenticate
          .authenticate(methodParams.auth, methodParams.auth_type, auth(req))
          .then(function(err, user){
            if (err)
              return res.status(401).json({error: err});

            // Call method
          });
      });
    })(i)
  }

});

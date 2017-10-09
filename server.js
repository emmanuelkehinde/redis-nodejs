var app = require('express')();
var axios = require('axios');
var redis = require('redis');

// create a new redis client and connect to our local redis instance
var client = redis.createClient();

// if an error occurs, print it to the console
client.on('error', function (err) {
    console.log("Error " + err);
});

app.set('port', (process.env.PORT || 5000));

// if a user visits /api/emmanuelkehinde, return the total number of repositories 'emmanuelkehinde'
// has on GitHub
app.get('/api/:username', function(req, res) {

    var username=req.params.username;

    // use the redis client to get the total number of repos associated to that
    // username from our redis cache
    client.get(username, function(error, result) {

        if(result){
            res.send({'repos': result, 'source': 'Redis cache'});
        }else {
            getUserRepositories(username)
                .then(function (response) {

                    var repos = response.data.length;

                    // store the key-value pair (username:repos) in our cache
                    // with an expiry of 1 minute (60s)
                    client.setex(username, 60, repos);
                    // return the result to the user
                    res.send({'repos': repos, 'source': 'Github API'});
                }).catch(function (error) {
                if (error.status === 404) {
                    res.send('The GitHub username could not be found. Try "emmanuelkehinde" as an example!');
                } else {
                    res.status(500).send(error)
                }
            });
        }

    });

});


// call the GitHub API to fetch information about the user's repositories
function getUserRepositories(user) {
    var githubEndpoint = 'https://api.github.com/users/' + user + '/repos' + '?per_page=100';
    return axios.get(githubEndpoint);
}


app.listen(app.get('port'), function(){
    console.log('Server listening on port: ', app.get('port'));
});
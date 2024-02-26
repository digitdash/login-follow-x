# login-follow-x
Log in and follow an account programatically on X/Twitter using Twitter API v2 and Oauth2 for login. Typescript version is also included (main.ts), although dependencies have not been added for TS support.

## usage

```bash
yarn
yarn dev
```

## routes

/ (root)
Route checks if the user is logged in and displays a corresponding message.

/logout
Logs the user out by clearing session data and redirects them to the root.

/twitter-login
Generates an OAuth2 authorization link with the required scopes and redirects the user for authentication on X.com.

/callback
Where the user is redirected after successful authentication. It verifies the OAuth2 code and state, exchanges the code for an access token and refresh token, and saves these tokens in the session.

/follow
Allows a logged-in user to follow an X account/brand. It creates a new TwitterApi instance with the user's access token and uses it to send a follow request. Access to this feature requires Basic X.com dev plan or higher.

/me 
Displays the logged-in user's Twitter ID, name, and username. It also creates a new TwitterApi instance with the user's access token to fetch this information. This was included for reference - implementation of retreiving and storing the users Twitter username will differ depending on the exact setup.

## dependencies

- express
- twitter-api-v2
- https-proxy-agent
- cookie-session
- dotenv
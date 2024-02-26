import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cookieSession from 'cookie-session';
import { TwitterApi, TwitterApiV2Settings } from 'twitter-api-v2';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxy: string | undefined = process.env.HTTP_PROXY;
const httpAgent = proxy ? new HttpsProxyAgent(proxy) : null;

const TWITTER_CLIENT_ID: string | undefined = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET: string | undefined = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL: string | undefined = process.env.CALLBACK_URL;
const BRAND_TWITTER_ID: string | undefined = process.env.BRAND_TWITTER_ID;

TwitterApiV2Settings.debug = true;

const client = new TwitterApi(
    { clientId: TWITTER_CLIENT_ID, clientSecret: TWITTER_CLIENT_SECRET },
    { httpAgent }
);

const app = express();

app.use(cookieSession({ name: 'session', secret: 'secretomitted', maxAge: 0 }));

app.get('/', (req: Request, res: Response) => {
    if (req.session.login) {
        res.send("You are logged in.<a href='/logout'>Logout</a>");
    } else {
        res.send("<a href='/twitter-login'>Login with X</a>");
    }
});

app.use('/logout', (req: Request, res: Response) => {
    req.session.login = false;
    delete req.session.twitter;
    res.redirect('/');
});

app.get('/twitter-login', (req: Request, res: Response) => {
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        CALLBACK_URL,
        { scope: ['tweet.read', 'users.read', 'follows.write'] }
    );

    req.session.twitter = { codeVerifier, state, url };

    res.redirect(url);
});

app.get('/follow', async (req: Request, res: Response) => {
    if (req.session.login) {
        try {
            const loggedClient = new TwitterApi(req.session.twitter.accessToken, { httpAgent });
            const { data: me } = await loggedClient.v2.me();
            await loggedClient.v2.follow(me.id, BRAND_TWITTER_ID);
            res.send(`Now following ${BRAND_TWITTER_ID} `);
        } catch (e) {
            console.error(e);
            res.status(500).send(`following ${BRAND_TWITTER_ID} failed please try again ${e}`);
        }
    } else {
        res.redirect('/');
    }
});

app.get('/me', async (req: Request, res: Response) => {
    if (req.session.login) {
        try {
            const loggedClient = new TwitterApi(req.session.twitter.accessToken, { httpAgent });
            const { data: userObject } = await loggedClient.v2.me();
            res.send(`id=${userObject.id}id=${userObject.name}id=${userObject.username}`);
        } catch (error) {
            console.error(error);
            res.status(500).send(`An error occurred while fetching user data`);
        }
    } else {
        res.redirect('/twitter-login');
    }
});

app.get('/callback', async (req: Request, res: Response) => {
    const { state, code } = req.query;
    if (!req.session.twitter || !code || !state) {
        return res.status(400).send(`Invalid request`);
    }

    const { codeVerifier, state: sessionState } = req.session.twitter;

    if (state !== sessionState) {
        return res.status(400).send(`Token Mismatch`);
    }

    try {
        const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: CALLBACK_URL
        });

        req.session.login = true;
        req.session.twitter = {
            ...req.session.twitter,
            accessToken,
            refreshToken,
            expiresIn
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(403).send(`Invalid verifier or access token `);
    }
});

app.listen(3000);

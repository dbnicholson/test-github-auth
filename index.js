#!/usr/bin/env node

import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import sessionFileStore from 'session-file-store'
import { Octokit } from 'octokit'
import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'

dotenv.config()
const app = express()
const port = 3000
const FileStore = sessionFileStore(session)
const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const SESSION_SECRET = process.env.SESSION_SECRET || '7ahGhvAo4fEEFPCa61voAjKfNnH33206Ceierc7T'

const fileStoreOptions = {}
const sessionOptions = {
  store: new FileStore(fileStoreOptions),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}
app.use(session(sessionOptions))
app.use(passport.authenticate('session'));
app.set('view engine', 'pug')

passport.serializeUser((user, done) => {
  done(null, user);
})

passport.deserializeUser((obj, done) => {
  done(null, obj);
})

passport.use(new GitHubStrategy(
  {
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: '/github/callback',
  },
  (accessToken, refreshToken, profile, done) => {
    console.dir({ profile }, { depth: null })
    const user = {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      accessToken,
      refreshToken,
    }
    return done(null, user)
  }
))

app.get('/', async (req, res) => {
  const octokit = new Octokit({ auth: req?.user?.accessToken })
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: 'endlessm',
    repo: 'godot-block-coding',
    per_page: 5,
  })

  res.render('index', {
    title: 'Main',
    message: 'Hello there!',
    client_id: CLIENT_ID,
    user: req.user,
    issues,
  })
})

app.get('/login', passport.authenticate('github'))

app.get('/logout', (req, res) => {
  req.logout((err) => {
    res.redirect(302, '/')
  })
})

app.get('/github/callback', passport.authenticate('github', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(`Open http://127.0.0.1:3000`)
})

#!/usr/bin/env node

import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import sessionFileStore from 'session-file-store'
import { Octokit } from 'octokit'

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

async function get_token(code) {
  const form = new FormData()
  form.append('client_id', CLIENT_ID)
  form.append('client_secret', CLIENT_SECRET)
  form.append('code', code)

  const resp = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
    }
  )

  if (resp.status !== 200) {
    return {
      status: resp.status,
      error: `Failed to acquire token (${resp.status})`,
    }
  }

  return resp.json()
}

app.set('view engine', 'pug')

app.get('/', async (req, res) => {
  const authenticated = Boolean(req.session.github_token)

  let user, issues
  if (authenticated) {
    const octokit = new Octokit({ auth: req.session.github_token })
    let resp

    resp = await octokit.rest.users.getAuthenticated()
    user = resp.data

    resp = await octokit.rest.issues.listForRepo({
      owner: 'endlessm',
      repo: 'godot-block-coding',
      per_page: 10,
    })
    issues = resp.data
  }

  res.render('index', {
    title: 'Main',
    message: 'Hello there!',
    client_id: CLIENT_ID,
    authenticated,
    user,
    issues,
  })
})

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect(302, '/')
  })
})

app.get('/github/callback', async (req, res) => {
  const code = req.query.code
  const token_data = await get_token(code)
  console.log({token_data})

  if (!token_data.access_token) {
    res.status(token_data.status).render('github/callback', {
      title: 'Callback',
      message: token_data.error,
    })
  }

  req.session.github_token = token_data.access_token
  res.redirect(302, '/')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(`Open http://127.0.0.1:3000`)
})

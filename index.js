#!/usr/bin/env node

const express = require('express')
const dotenv = require('dotenv')
const session = require('express-session')
const sessionFileStore = require('session-file-store')

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

  let username = ''
  let fullname = ''
  if (authenticated) {
    const resp = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.github_token}`,
      },
    })

    const user_data = await resp.json()
    username = user_data.login
    fullname = user_data.name
  }

  res.render('index', {
    title: 'Main',
    message: 'Hello there!',
    client_id: CLIENT_ID,
    authenticated: authenticated,
    username: username,
    fullname: fullname,
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

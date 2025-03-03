#!/usr/bin/env node

const express = require('express')
const dotenv = require('dotenv')

dotenv.config()
const app = express()
const port = 3000
const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

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

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Main',
    message: 'Hello there!',
    client_id: CLIENT_ID,
  })
})

app.get('/github/callback', async (req, res) => {
  const code = req.query.code
  const token_data = await get_token(code)
  console.log({token_data})

  const token = token_data.access_token
  let status
  let message
  if (token) {
    status = 200
    message = `Authorized with code ${code} and token ${token}`
  } else {
    status = token_data.status
    message = token_data.error
  }
  res.status(status).render('github/callback', {
    title: 'Callback',
    message: message,
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(`Open http://127.0.0.1:3000`)
})

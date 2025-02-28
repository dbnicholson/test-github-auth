#!/usr/bin/env node

const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'pug')

app.get('/', (req, res) => {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(`Open http://127.0.0.1:3000`)
})

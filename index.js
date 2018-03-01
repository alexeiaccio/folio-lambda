'use strict'
const Telegraph = require('telegraf')
const serverless = require('serverless-http')
const express = require('express')

const IS_OFFLINE = process.env.IS_OFFLINE

// TELEGRAM
const bot = new Telegraph(process.env.BOT_TOKEN)

// EXPRESS
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

bot.use(
  //require('./bot/commands'),
  //require('./bot/actions'),
  require('./bot/handlers'),
)

if (IS_OFFLINE === 'true') {
  bot.startPolling()
} else {
  bot.telegram.setWebhook(process.env.WEBHOOK_URL + '/secret-path')  
  app.use(bot.webhookCallback('/secret-path'))
}


module.exports.handler = serverless(app)
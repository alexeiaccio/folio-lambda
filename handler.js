'use strict';
const Telegraph = require('telegraf')
const bot = new Telegraph(process.env.BOT_TOKEN)
bot.on('message', (ctx) => {
  let from = ctx.from
  let message = ctx.update.message
  return ctx.replyWithHTML(`<b>Hello ${from.first_name} ${from.last_name}</b>\n<em>You say:</em> ${message.text}`)
})
bot.telegram.setWebhook(process.env.WEBHOOK_URL + '/secret-path')


const serverless = require('serverless-http');
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})
app.use(bot.webhookCallback('/secret-path'))

module.exports.handler = serverless(app);
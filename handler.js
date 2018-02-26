'use strict'

// AWS
const AWS = require('aws-sdk')
const PAGES_TABLE = process.env.PAGES_TABLE
const IS_OFFLINE = process.env.IS_OFFLINE
let dynamoDb
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb.options.endpoint)
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient()
}

// TELEGRAM
const Telegraph = require('telegraf')
const bot = new Telegraph(process.env.BOT_TOKEN)
bot.on('message', (ctx) => {
  let from = ctx.from
  let message = ctx.update.message
  
  const params = {
    TableName: PAGES_TABLE,
    Key: {
      pageId: message.text,
    },
  }
  
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error)
      return ctx.replyWithHTML(`<b>Get error..</b>\n<em>There is:</em> ${error}`)
    }
    if (result.Item) {
      const {pageId, path, content} = result.Item
      console.log(pageId)
      return ctx.replyWithHTML(`<b>Hello ${path}</b>\n<em>You say:</em> ${content}`)
    } else {
      console.log(error)
      const params = {
        TableName: PAGES_TABLE,
        Item: {
          pageId: from.id.toString(),
          path: from.username.toString(),
          content: message.text.toString(),
        },
      }      
      dynamoDb.put(params, (error) => {
        if (error) {
          console.log(error)
          return ctx.replyWithHTML(`<b>Put error..</b>\n<em>There is:</em> ${error}`)
        }
        return ctx.replyWithHTML(`<b>Save ${from.username}</b>\n<em>ID:</em> <pre>${from.id}</pre>`)
      })
    }
  })
})


// SLS & EXPRESS
const serverless = require('serverless-http')
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

if (IS_OFFLINE === 'true') {
  bot.startPolling()
} else {
  bot.telegram.setWebhook(process.env.WEBHOOK_URL + '/secret-path')
  
  app.use(bot.webhookCallback('/secret-path'))
}


module.exports.handler = serverless(app)
const { Composer } = require('telegraf')

const composer = new Composer()


// Modules
const inlineQueryHandler = require('./inline-query-handler')
const callbackQueryHandler = require('./callback-query-handler')
//const messageHandler = require('./message-handler')

// Commands
composer.on('inline_query', inlineQueryHandler)
composer.on('callback_query', callbackQueryHandler)
//composer.on('message', messageHandler)

module.exports = composer
const Markup = require('telegraf/markup')

const getOptions = ( query, maxpage ) => {
  let parts = query.split(':')
  let current = parseInt(parts[1]) || 1
  let path = parts[0]
  let maxPage = parseInt(maxpage)

  return Markup.inlineKeyboard([
    [
      Markup.urlButton('Web view', `http://telegra.ph/${path}`),
      Markup.switchToChatButton('Forward page', `${path}:${current}`)
    ], [
      Markup.callbackButton(`↪️ Back`, `${path}:${current}`)
    ]
  ])
}

module.exports = getOptions
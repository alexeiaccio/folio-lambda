const Telegraph = require('telegra.ph')
const Router = require('telegraf/router')
const options = require('../options')
const dynamoDb = require('../db')
const getPages = require('../utils/text-helpers')
const getPagination = require('../utils/get-pagination')
const getOptions = require('../utils/get-options')

const client = new Telegraph()
const PAGES_TABLE = process.env.PAGES_TABLE

const callbackQueryHandler = new Router(({ callbackQuery }) => {
  if (!callbackQuery.data) {
    return
  }
  const parts = callbackQuery.data.split(':')
  return {
    route: 'turn',
    state: {
      path: parts[0],
      current: parseInt(parts[1]) || 1
    }
  }
})

let previousPage = '1'
let isAddition = false

const getCallbackAnswer = (ctx, pageId, maxPage, content, currentPage) => {
  const editOptions = Object.assign({}, 
    { reply_markup: getPagination(pageId, maxPage) },
    options.parse_mode
  )    
  if (currentPage !== previousPage) {
    return ctx.editMessageText(
      content, editOptions
    ).catch(() => undefined), 
    previousPage = currentPage
  } else if (!isAddition) {
    return ctx.editMessageReplyMarkup(
      getOptions(pageId, maxPage)
    ).catch(() => undefined),
    isAddition = !isAddition
  } else {
    return ctx.editMessageReplyMarkup(
      getPagination(pageId, maxPage)
    ).catch(() => undefined),
    isAddition = !isAddition
  }
}

callbackQueryHandler.on('turn', (ctx) => {
  let id = ctx.update.callback_query.inline_message_id
  let statePath = ctx.state.path
  let currentPage = ctx.state.current  

  const params = {
    TableName: PAGES_TABLE,
    Key: {
      pageId: `${statePath}:${currentPage}`,
    },
  }
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log('Error get: ' + error)
    }
    if (result.Item) {
      const { pageId, maxPage, content } = result.Item
      getCallbackAnswer(ctx, pageId, maxPage, content, currentPage)
    } else {
      console.log('Error after get: ' + error)
      client.getPage(statePath, true)
      .then(page => {
        let pages = getPages(page.content)
        let maxPage = pages.length
        pages.forEach(page => {
          const params = {
            TableName: PAGES_TABLE,
            Item: {
              pageId: `${statePath}:${pages.indexOf(page)+1}`,
              content: page,
              maxPage: maxPage,
            },
          }      
          dynamoDb.put(params, (error) => {
            if (error) {
              console.log('Error put: ' + error)
            }          
            console.log('Success! Id: ' + params.Item.pageId)
            getCallbackAnswer(ctx, params.Item.pageId, params.Item.maxPage, params.Item.content, currentPage)
          })
        })
      })
    }
  })
})

callbackQueryHandler.otherwise((ctx) => { ctx.editMessageText(`Woop!`) })

module.exports = callbackQueryHandler
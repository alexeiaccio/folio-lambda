const Telegraph = require('telegra.ph')
const options = require('../options')
const dynamoDb = require('../db')
const getPages = require('../utils/text-helpers')
const getPagination = require('../utils/get-pagination')

const client = new Telegraph()
const PAGES_TABLE = process.env.PAGES_TABLE

const inlineQueryHandler = (ctx) => {
  let inlineQuery = ctx.update.inline_query
  let query = inlineQuery.query  

  if(query.length > 1) {
    let path = ''
    let current = 1
    if (query.indexOf('http') == 0) {
      let pathRegExp = /(?:http:\/\/telegra.ph\/)(.*)/g
      path = pathRegExp.exec(query)[1]
    } else if (query.indexOf(':')>=0) {
      let parts = inlineQuery.query.split(':')
      current = parseInt(parts[1]) || 1
      path = parts[0]
    } else path = query
    
    client.getPage(path, true)
    .then(page => {
      let pages = getPages(page.content)
      let maxPage = pages.length

      pages.forEach((page) => {
        const params = {
          TableName: PAGES_TABLE,
          Item: {
            pageId: `${path}:${pages.indexOf(page)+1}`,
            content: page,
            maxPage: maxPage,
          },
        }      
        dynamoDb.put(params, (error) => {
          if (error) {
            console.log(error)
          }          
          console.log('Success! Id: ' + params.Item.pageId)
        })
      })
      
      return ctx.answerInlineQuery(
        [{
          type: 'article',
          id: 1, 
          title: !page.title.includes('FolioBot') ? page.title : 'Page me!', 
          description: page.description,
          thumb_url: 'https://github.com/alexeiaccio/foliobot/raw/master/app/public/favicon.png',
          input_message_content: Object.assign({},
            { message_text: pages[current-1] },
            options.parse_mode
          ),
          reply_markup: getPagination(`${path}:${current}`, maxPage)
        }], 
        {
          cache_time: 800
        }
      )
    }).catch((err) => {
      if (err.toString().search(/PAGE/)) {
        title = `Page not found.`
        description = `Try other pathway...`
      } else {
        title = 'Error...'
        description = `${err}`
      }
      return ctx.answerInlineQuery(
        [{
          type: 'article',
          id: 2, 
          title: title, 
          description: description,
          input_message_content: Object.assign({},
            { message_text: `<b>${title}</b> ${description}` },
            options.parse_mode
          )
        }], 
        {
          cache_time: 200
        }
      )      
    })
  }
}

module.exports = inlineQueryHandler
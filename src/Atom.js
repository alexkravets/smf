'use strict'

const Feed = require('./Feed')

class Atom extends Feed {
  constructor(url) {
    super(url, {
      _query:      'feed.entry',
      id:          'id.text.@value',
      url:         'link.@href',
      title:       'title.text.@value',
      publishedAt: 'published.text.@value'
    })
  }

  createItem(attributes) {
    const { id, url, title, publishedAt } = attributes

    const item = {
      publishedAt: new Date(publishedAt).toISOString(),
      id,
      url,
      title
    }

    return item
  }
}

module.exports = Atom

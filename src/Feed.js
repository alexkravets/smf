'use strict'

const Parser = require('./Parser')

class Feed {
  constructor(url, template = {}) {
    this._url      = url
    this._template = template
  }

  /* istanbul ignore next: Abstract class method to be overriden. */
  createItem(attributes) {
    return attributes
  }

  async getItems() {
    const rawItems = await this.getRawItems(this._url)
    const items = rawItems.map(attributes => this.createItem(attributes))

    return items
  }

  async getRawItems(url) {
    const parser = new Parser({ rawItems: this._template })
    const { rawItems } = await parser.parse(url)

    return rawItems
  }
}

module.exports = Feed

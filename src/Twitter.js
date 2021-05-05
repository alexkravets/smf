'use strict'

const qs   = require('querystring')
const Feed = require('./Feed')
const { jsonRequest, httpRequest } = require('./request')

const TWITTER_URL  = 'https://twitter.com'
const BEARER_TOKEN = 'Bearer ' +
                     'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs' +
                     '%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0'
}

class Twitter extends Feed {
  constructor(username, userId, options = {}) {
    super(TWITTER_URL)

    this._userId     = userId
    this._username   = username.replace(`${TWITTER_URL}/`, '').split('/')[0]
    this._guestToken = options.guestToken
  }

  async getRawItems() {
    const parameters = { count: 10 }

    const query = qs.stringify(parameters)

    if (!this._userId) {
      const { userId } = await this.getUser()
      this._userId = userId
    }

    const url = `https://api.twitter.com/2/timeline/profile/${this._userId}.json?${query}`

    const { object: { globalObjects: { tweets } } } = await this._jsonRequest(url)
    const rawItems = Object.values(tweets)

    return rawItems
  }

  createItem(attributes) {
    const { id_str: id, created_at } = attributes

    const url         = `${TWITTER_URL}/${this._username}/status/${id}`
    const publishedAt = new Date(created_at).toISOString()

    const item = {
      id,
      url,
      publishedAt
    }

    return item
  }

  async getUser() {
    const operationId = 'https://api.twitter.com/graphql/jMaTS-_Ea8vh9rpKggJbCQ/UserByScreenName'

    const variables = JSON.stringify({ screen_name: this._username, withHighlightedLabel: false })
    const url       = `${operationId}?variables=${variables}`

    const { object: { data: { user }, errors } } = await this._jsonRequest(url)

    if (errors) {
      const [ error ] = errors
      throw new Error(`Twitter: ${error.message}`)
    }

    const { rest_id: userId, legacy: { name } }  = user

    return { userId, name }
  }

  async _jsonRequest(url) {
    if (!this._guestToken) {
      this._guestToken = await Twitter.createGuestToken()
    }

    const options = {
      url,
      headers: {
        ...DEFAULT_HEADERS,
        authorization:   BEARER_TOKEN,
        'x-guest-token': this._guestToken
      }
    }

    return jsonRequest(options)
  }

  static get domains() {
    return [
      'twitter.com',
      'mobile.twitter.com'
    ]
  }

  static async getFeedAttributes(url, options) {
    const [ username ] = url.split('.com/')[1].split('/')

    const accountUrl = `${TWITTER_URL}/${username}`.toLowerCase()

    const twitter = new Twitter(username, null, options)
    const { userId: id, name: title } = await twitter.getUser()

    return { id, title, url: accountUrl, type: 'tw' }
  }

  static async createGuestToken(requestOptions = {}) {
    const options = {
      url: TWITTER_URL,
      headers: {
        ...DEFAULT_HEADERS
      },
      ...requestOptions
    }

    const response = await httpRequest(options)

    const html  = response.body.toString()
    const match = html.match(/\("gt=(\d+);/)

    /* istanbul ignore next: AWS IP addresses are blocked. */
    if (!match) {
      throw new Error('Twitter: Guest token not found')
    }

    const [ , token ] = match

    return token
  }
}

module.exports = Twitter

'use strict'

const trim            = require('lodash.trim')
const Feed            = require('./Feed')
const Parser          = require('./Parser')
const querystring     = require('querystring')
const { jsonRequest } = require('./request')

const QUERY_HASH      = '2c5d4d8b70cad329c4a6ebe3abb6eedd'
const ENDPOINT_URL    = 'https://www.instagram.com/graphql/query/'
const INTAGRAM_URL    = 'https://www.instagram.com'
const POSTS_PER_QUERY = 50

class Instagram extends Feed {
  constructor(userId) {
    const url = Instagram.instagramQueryUrl(userId)
    super(url)
  }

  async getRawItems(url) {
    const { object: response } = await jsonRequest({ url })
    const rawItems = response.data.user.edge_owner_to_timeline_media.edges.map(edge => edge.node)

    return rawItems
  }

  createItem(attributes) {
    const { id, shortcode, taken_at_timestamp } = attributes

    const item = {
      url:         `https://www.instagram.com/p/${shortcode}`,
      publishedAt: new Date(taken_at_timestamp * 1000).toISOString(),
      id
    }

    return item
  }

  static get domains() {
    return [
      'instagram.com',
      'www.instagram.com'
    ]
  }

  static instagramQueryUrl(userId) {
    const variables = querystring.escape(JSON.stringify({ id: userId, first: POSTS_PER_QUERY }))
    const url = `${ENDPOINT_URL}?query_hash=${QUERY_HASH}&variables=${variables}`

    return url
  }

  static async getFeedAttributes(url) {
    let normalizedUrl = url.split('?')[0]
    normalizedUrl = normalizedUrl.endsWith('/') ? normalizedUrl : `${normalizedUrl}/`

    const parser1 = new Parser({
      description:  'html.head.meta(name=description).@content',
      canonicalUrl: 'html.head.link(rel=canonical).@href'
    })

    const { canonicalUrl, description } = await parser1.parse(normalizedUrl)

    const isPostUrl = canonicalUrl && canonicalUrl.includes('.com/p/')
    const shouldCheckDescription = !canonicalUrl || isPostUrl

    let username

    if (shouldCheckDescription) {
      const match = /\(@(?<username>[0-9a-zA-Z_.]+)\)/.exec(description)

      /* istanbul ignore next: edge case when username is not found in title */
      if (!match) {
        throw new Error(`Instagram: Username is not found in description, ${normalizedUrl}`)
      }

      const [ , _username ] = match
      username = _username

    } else {
      const [ , , , _username ] = canonicalUrl.split('/')
      username = _username

    }

    let isBotDetected

    isBotDetected = username === 'accounts'

    /* istanbul ignore next: instagram blocks by IP randomly */
    if (isBotDetected) {
      throw new Error(`Instagram: Profile page is not available at the moment, ${profileUrl}`)
    }

    const profileUrl = `${INTAGRAM_URL}/${username}/`
    const parser     = new Parser({ pageTitle: 'html.head.title.text.@value' })
    const { pageTitle, _html: html } = await parser.parse(profileUrl)

    isBotDetected = pageTitle.includes('Login')

    /* istanbul ignore next: instagram blocks by IP randomly */
    if (isBotDetected) {
      throw new Error(`Instagram: Profile page is not available at the moment, ${profileUrl}`)
    }

    const title  = trim(pageTitle.split(` (@${username}`)[0])
    const userId = html.split(`","username":"${username}"}`)[0].split('"owner":{"id":"')[1]

    if (!userId) {
      throw new Error(`Instagram: Profile page is private, ${profileUrl}`)
    }

    const id = userId

    return { id, title, url: profileUrl, type: 'yt' }
  }
}

module.exports = Instagram

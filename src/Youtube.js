'use strict'

const Atom   = require('./Atom')
const Parser = require('./Parser')

const ATOM_URL = 'https://www.youtube.com/feeds/videos.xml'

class Youtube extends Atom {
  constructor(channelId) {
    super(`${ATOM_URL}?channel_id=${channelId}`)
  }

  static get domains() {
    return [
      'youtu.be',
      'youtube.com',
      'm.youtube.com',
      'www.youtube.com'
    ]
  }

  static async getFeedAttributes(url) {
    const inputParser = new Parser({
      channelId:    '#watch7-content.meta(itemprop=channelId).@content',
      canonicalUrl: [
        'html.body.link(rel=canonical).@href',
        'html.head.link(rel=canonical).@href'
      ]
    })

    let { channelId, canonicalUrl } = await inputParser.parse(url)

    /* istanbul ignore next: skip cases when there is no canonicalUrl */
    if (!canonicalUrl) { return null }

    channelId = channelId ? channelId : canonicalUrl.split('channel/')[1]

    /* istanbul ignore next: skip cases when there is no channelId */
    if (!channelId) { return }

    const feedUrl = `${ATOM_URL}?channel_id=${channelId}`

    const channelParser = new Parser({
      title: 'feed.title.text.@value'
    })

    const { title } = await channelParser.parse(feedUrl)
    const id = channelId

    return { id, url: canonicalUrl, title, type: 'yt' }
  }
}

module.exports = Youtube

'use strict'

const Twitter    = require('./Twitter')
const { expect } = require('chai')

describe('Twitter', () => {
  describe('Twitter.domains', () => {
    it('returns supported domains', async () => {
      expect(Twitter.domains).to.be.not.empty
    })
  })

  let userId

  describe('Twitter.getFeedAttributes()', () => {
    it('returns feed details for Twitter post URL', async () => {
      const url = 'https://mobile.twitter.com/SpaceX/status/1187489139291119616'
      const attributes = await Twitter.getFeedAttributes(url)

      expect(attributes).to.include({
        id:    '34743251',
        url:   'https://twitter.com/spacex',
        title: 'SpaceX'
      })
    })

    it('returns feed details for Twitter account URL', async () => {
      const url = 'https://twitter.com/elonmusk'
      const attributes = await Twitter.getFeedAttributes(url)

      expect(attributes).to.include({
        id:    '44196397',
        url:   'https://twitter.com/elonmusk',
        title: 'Elon Musk'
      })

      userId = attributes.id
    })

    it('throws an error if user not found', async () => {
      const url = 'https://twitter.com/pmhoncharuk'

      try {
        await Twitter.getFeedAttributes(url)

      } catch (error) {
        expect(error.message).to.eql('Twitter: User \'pmhoncharuk\' not found')
        return
      }

      throw new Error('Exception has not been thrown')
    })
  })

  describe('.getItems(username, userId)', () => {
    it('returns items for a Twitter username and user ID', async () => {
      const twitter = new Twitter('elonmusk', userId)
      const items   = await twitter.getItems()

      expect(items).to.be.not.empty
    })

    it('returns items for a Twitter URL', async () => {
      const twitter = new Twitter('https://twitter.com/elonmusk')
      const items   = await twitter.getItems()

      expect(items).to.be.not.empty
    })
  })
})

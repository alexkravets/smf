'use strict'

const Youtube    = require('./Youtube')
const { expect } = require('chai')

describe('Youtube', () => {
  describe('Youtube.domains', () => {
    it('returns supported domains', async () => {
      expect(Youtube.domains).to.be.not.empty
    })
  })

  describe('Youtube.getFeedAttributes()', () => {
    it('returns feed details for YouTube video URL', async () => {
      const url        = 'https://www.youtube.com/watch?v=C8JyvzU0CXU'
      const attributes = await Youtube.getFeedAttributes(url)

      expect(attributes).to.include({
        id:    'UCtI0Hodo5o5dUb67FeUjDeA',
        url:   'https://www.youtube.com/channel/UCtI0Hodo5o5dUb67FeUjDeA',
        title: 'SpaceX'
      })
    })

    it('returns feed details for YouTube channel URL', async () => {
      const url        = 'https://www.youtube.com/channel/UCmpF6TdeLM2H6XcpZI2ceBg'
      const attributes = await Youtube.getFeedAttributes(url)

      expect(attributes).to.include({
        id:    'UCmpF6TdeLM2H6XcpZI2ceBg',
        url:   'https://www.youtube.com/channel/UCmpF6TdeLM2H6XcpZI2ceBg',
        title: 'Jolocom'
      })
    })

    it('returns feed details for YouTube account URL', async () => {
      const url        = 'https://www.youtube.com/vevo'
      const attributes = await Youtube.getFeedAttributes(url)

      expect(attributes).to.include({
        id:    'UC2pmfLm7iq6Ov1UwYrWYkZA',
        url:   'https://www.youtube.com/channel/UC2pmfLm7iq6Ov1UwYrWYkZA',
        title: 'Vevo'
      })
    })
  })

  describe('.getItems()', () => {
    it('returns items for YouTube feed', async () => {
      const url     = 'UC7xgCrNLmRkSKxC9hFjZEiw'
      const youtube = new Youtube(url)
      const items   = await youtube.getItems()

      expect(items).to.be.not.empty
    })
  })
})

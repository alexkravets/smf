'use strict'

const Instagram  = require('./Instagram')
const { expect } = require('chai')

describe('Instagram', () => {
  describe('Instagram.domains', () => {
    it('returns supported domains', async () => {
      expect(Instagram.domains).to.be.not.empty
    })
  })

  describe('Instagram.getFeedAttributes()', () => {
    it('returns feed details for Instagram post URL', async () => {
      const attributes = await Instagram.getFeedAttributes('https://www.instagram.com/p/B45T9jjFUa5')

      expect(attributes).to.include({
        id:    '4731970969',
        url:   'https://www.instagram.com/zelenskiy_official/',
        title: 'Володимир Зеленський'
      })
    })

    it('returns feed details for Instagram account URL', async () => {
      const attributes = await Instagram.getFeedAttributes('https://www.instagram.com/banksy')

      expect(attributes).to.include({
        id:    '564287810',
        url:   'https://www.instagram.com/banksy/',
        title: 'Banksy'
      })
    })

    it('throws an error for private profile', async () => {
      const url = 'https://www.instagram.com/clindst/'

      try {
        await Instagram.getFeedAttributes(url)

      } catch (error) {
        expect(error.message).to.include('Instagram: Profile page is private')
        return
      }

      throw new Error('Exception has not been thrown')
    })
  })

  describe('.getItems()', () => {
    it('returns items for Instagram feed', async () => {
      const url = 'https://www.instagram.com/p/B45T9jjFUa5'

      const attributes = await Instagram.getFeedAttributes(url)
      const { id } = attributes

      const instagram = new Instagram(id)
      const items = await instagram.getItems()

      expect(items).to.be.not.empty
    })
  })
})

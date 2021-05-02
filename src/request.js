'use strict'

const { httpRequest } = require('@kravc/request')
const { jsonRequest } = require('@kravc/request')

module.exports = {
  httpRequest: options => httpRequest(console, options),
  jsonRequest: options => jsonRequest(console, options)
}

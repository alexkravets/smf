'use strict'

const sax      = require('sax')
const last     = require('lodash.last')
const isObject = require('lodash.isobject')
const { httpRequest } = require('./request')

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0'
}

const SELECTOR_REGEX = /(\w+)(\((\w+)=(\w+)\))?(\[(\d+)\])?/
const HTML_SELF_CLOSING_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

class Parser {
  constructor(template) {
    this._template = template
  }

  async parse(url, options = { headers: {} }) {
    const html   = await Parser.readBody(url, options.headers)
    const source = await Parser.parseXml(html)
    const object = this._parse(source, this._template)

    return { ...object, _html: html, _source: source }
  }

  _parse(source, template) {
    const result = {}

    for (const key in template) {
      let orQueries = template[key]
      const isArray = Array.isArray(orQueries)

      if (!isArray) {
        orQueries = [ orQueries ]
      }

      for (const query of orQueries) {
        result[key] = result[key] || this._get(source, query)
      }
    }

    return result
  }

  _get(source, query) {
    const isArray = isObject(query)

    if (isArray) {
      return this._getArray(source, query)
    }

    const selectors = query.split('.')

    return selectors.reduce((acc, selector) => {
      if (!acc) { return }

      const isId = selector.startsWith('#')
      if (isId) {
        return source.$map[selector.substring(1)]
      }

      const isKey = selector.startsWith('$')

      /* istanbul ignore next: is not used */
      if (isKey) { return acc[selector] }

      const isAttribute = selector.startsWith('@')

      if (isAttribute) {
        return acc.$attributes[selector.substring(1)]
      }

      /* istanbul ignore next: is not used */
      if (!acc.$children) { return }

      let [ , tag, , attributeName, attributeValue, , index = '0' ] = selector.match(SELECTOR_REGEX)
      index = Number(index)

      acc = acc.$children.filter(child => child.$tag === tag)

      if (attributeName) {
        acc = acc.filter(child => String(child.$attributes[attributeName]) === attributeValue)
      }

      return acc[index]
    }, source)
  }

  _getArray(source, { _query: query, ...template }) {
    const selectors = query.split('.')
    const tag = selectors.pop()

    const parentSelector = selectors.join('.')

    const parent = this._get(source, parentSelector)

    /* istanbul ignore next: some edge for pervious twitter interface */
    if (!parent) {
      throw new Error(`Element "${parentSelector}" is not found`)
    }

    const children = parent.$children.filter(child => child.$tag === tag)

    return children.map(entry => this._parse(entry, template))
  }

  static parseXml(xml) {
    const parser = sax.parser(false, { lowercase: true, trim: true, normalize: true })

    return new Promise((resolve, reject) => {
      const map = {}

      const children = []
      const stack = [ children ]

      /* istanbul ignore next: if happens we expect OperationError */
      parser.onerror = error => reject(error)

      parser.onend = () => resolve({ $tag: 'root', $children: children, $map: map })

      parser.onopentag = node => {
        const { name: $tag, attributes } = node
        const element = { $tag, $attributes: attributes, $children: [] }

        if (attributes.id && !map[attributes.id]) { map[attributes.id] = element }
        last(stack).push(element)

        const isSelfClosingTag = HTML_SELF_CLOSING_TAGS.includes($tag)
        if (isSelfClosingTag) { return }

        stack.push(element.$children)
      }

      parser.ontext = value => last(stack).push({ $tag: 'text', $attributes: { value } })

      parser.onclosetag = $tag => {
        const isSelfClosingTag = HTML_SELF_CLOSING_TAGS.includes($tag)
        if (isSelfClosingTag) { return }

        stack.pop()
      }

      parser.write(xml).close()
    })
  }

  static async readBody(url, headers) {
    const response = await httpRequest({ url, headers: { ...DEFAULT_HEADERS, ...headers } })

    const { statusCode, headers: _headers } = response

    const isRedirect = statusCode === 301 || statusCode === 302 || statusCode === 303

    /* istanbul ignore next: used for instagram URL not ending with /  */
    if (isRedirect) {
      const { location } = _headers
      return Parser.readBody(location)
    }

    const { body } = response

    /* istanbul ignore next: if happens we expect OperationError */
    if (!body) { throw new Error(`No body returned for "${url}"`) }

    return body.toString()
  }
}

module.exports = Parser

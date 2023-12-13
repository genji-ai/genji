export const Enricher = {
  MAX_CONTENT_LENGTH: 1000,
  MAX_ATTRIBUTE_LENGTH: 500,
  MAX_NUM_DATA_ATTRIBUTES: 10,

  commonAttributes: ['id', 'className', 'title', 'aria-label', 'aria-labelledby'],
  attributeNamesMapping: new Map([
    ['a', ['href', 'title', 'rel', 'target']],
    ['label', ['for']],
    ['input', ['type', 'name', 'placeholder', 'checked', 'maximumLength']],
    ['textarea', ['placeholder', 'maximumLength']],
    ['button', ['type']],
    ['select', ['name', 'multiple']],
    ['div', ['role']],
    ['iframe', ['src']],
    ['img', ['src', 'alt']],
  ]),

  describe(elem) {
    let attributes = {}
    this.addAttributes(elem, this.commonAttributes, attributes)

    const tagName = elem.tagName.toLowerCase?.() || ''
    if (this.attributeNamesMapping.has(tagName)) {
      this.addAttributes(elem, this.attributeNamesMapping.get(tagName), attributes)
    }
    this.addDataAttrs(elem, attributes)

    const content = this.getContent(elem)
    return this.additionalHandling(elem, {
      tag: tagName,
      attributes,
      ...(content && { content }),
    })
  },

  getContent(elem) {
    const tagName = elem.tagName.toLowerCase?.() || ''
    if (['input', 'textarea'].includes(tagName)) return elem.value
    else if (['div', 'iframe', 'img', 'body'].includes(tagName)) return null
    else if (['a', 'button', 'select', 'label'].includes(tagName)) return elem.innerText
    else {
      // console.log(`missed ${tagName}`)
      return elem.innerText
    }
  },

  additionalHandling(elem, enrichedHint) {
    const tagName = elem.tagName.toLowerCase?.() || ''
    if (tagName == 'label' && elem.hasAttribute('for')) {
      const forAttr = elem.getAttribute('for')
      const target = document.getElementById(forAttr)
      if (target) enrichedHint.target = this.describe(target)
    }
    return enrichedHint
  },

  addAttributes(elem, attributeNames, attributes) {
    if (!attributes) attributes = {}
    for (const attr of attributeNames) {
      if (elem.hasAttribute(attr)) {
        attributes[attr] = elem.getAttribute(attr).substring(0, this.MAX_ATTRIBUTE_LENGTH)
      }
    }
    return attributes
  },

  addDataAttrs(elem, attributes) {
    let i = 0
    for (const dataAttr in elem.dataset) {
      attributes[`data-${dataAttr}`] = elem.dataset[dataAttr].substring(
        0,
        this.MAX_ATTRIBUTE_LENGTH,
      )
      i++
      if (i > this.MAX_NUM_DATA_ATTRIBUTES) return attributes
    }
    return attributes
  },
}

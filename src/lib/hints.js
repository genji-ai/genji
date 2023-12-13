// Reproduced with modifications from https://github.com/philc/vimium/blob/master/content_scripts/link_hints.js

import { DomUtils } from './dom_utils.js'
import { Scroller } from './scroller.js'
import { windowIsFocused } from './windowIsFocused.js'

// A clickable element in the current frame, plus metadata about how to show a hint marker for it.
export class LocalHint {
  element // The clickable element.
  image // When element is an <area> (image map), `image` is its associated image.
  rect // The rectangle where the hint should shown, to avoid overlapping with other hints.
  linkText // Used in FilterHints.
  showLinkText // Used in FilterHints.
  // The reason that an element has a link hint when the reason isn't obvious, e.g. the body of a
  // frame so that the frame can be focused. This reason is shown to the user in the hint's caption.
  reason
  // "secondClassCitizen" means the element isn't clickable, but does have a tab index. We show
  // hints for these elements unless their hit box collides with another clickable element.
  secondClassCitizen
  // An element that may be clickable based on our heuristics. It's a "false positive" if one of its
  // child elements is detected as clickable.
  possibleFalsePositive
  constructor(o) {
    Object.seal(this)
    if (o) Object.assign(this, o)
  }
}

export const LocalHints = {
  // Returns an array of LocalHints if the element is visible and clickable, and computes the rect
  // which bounds this element in the viewport. We return an array because there may be more than
  // one part of element which is clickable (for example, if it's an image); if so, each LocalHint
  // represents one of the clickable rectangles of the element.
  getLocalHintsForElement(element) {
    // Get the tag name. However, `element.tagName` can be an element (not a string, see #2035), so
    // we guard against that.
    const tagName = element.tagName.toLowerCase?.() || ''
    let isClickable = false
    let onlyHasTabIndex = false
    let possibleFalsePositive = false
    const hints = []
    const imageMapAreas = []
    let reason = null

    // Insert area elements that provide click functionality to an img.
    if (tagName === 'img') {
      let mapName = element.getAttribute('usemap')
      if (mapName) {
        const imgClientRects = element.getClientRects()
        mapName = mapName.replace(/^#/, '').replace('"', '\\"')
        const map = document.querySelector(`map[name="${mapName}"]`)
        if (map && imgClientRects.length > 0) {
          isClickable = true
          const areas = map.getElementsByTagName('area')
          let areasAndRects = DomUtils.getClientRectsForAreas(imgClientRects[0], areas)
          // We use this image property when detecting overlapping links.
          areasAndRects = areasAndRects.map((o) => Object.assign(o, { image: element }))
          imageMapAreas.push(...areasAndRects)
        }
      }
    }

    // Check aria properties to see if the element should be ignored.
    // Note that we're showing hints for elements with aria-hidden=true. See #3501 for discussion.
    const ariaDisabled = element.getAttribute('aria-disabled')
    if (ariaDisabled && ['', 'true'].includes(ariaDisabled.toLowerCase())) {
      return [] // This element should never have a link hint.
    }

    // Check for AngularJS listeners on the element.
    if (!this.checkForAngularJs) {
      this.checkForAngularJs = (function () {
        const angularElements = document.getElementsByClassName('ng-scope')
        if (angularElements.length === 0) {
          return () => false
        } else {
          const ngAttributes = []
          for (const prefix of ['', 'data-', 'x-']) {
            for (const separator of ['-', ':', '_']) {
              ngAttributes.push(`${prefix}ng${separator}click`)
            }
          }
          return function (element) {
            for (const attribute of ngAttributes) {
              if (element.hasAttribute(attribute)) return true
            }
            return false
          }
        }
      })()
    }

    if (!isClickable) isClickable = this.checkForAngularJs(element)

    if (element.hasAttribute('onclick')) {
      isClickable = true
    } else {
      const role = element.getAttribute('role')
      const clickableRoles = [
        'button',
        'tab',
        'link',
        'checkbox',
        'menuitem',
        'menuitemcheckbox',
        'menuitemradio',
        'radio',
      ]
      if (role != null && clickableRoles.includes(role.toLowerCase())) {
        isClickable = true
      } else {
        const contentEditable = element.getAttribute('contentEditable')
        if (
          contentEditable != null &&
          ['', 'contenteditable', 'true', 'plaintext-only'].includes(contentEditable.toLowerCase())
        ) {
          isClickable = true
        }
      }
    }

    // Check for jsaction event listeners on the element.
    if (!isClickable && element.hasAttribute('jsaction')) {
      const jsactionRules = element.getAttribute('jsaction').split(';')
      for (const jsactionRule of jsactionRules) {
        const ruleSplit = jsactionRule.trim().split(':')
        if (ruleSplit.length >= 1 && ruleSplit.length <= 2) {
          const [eventType, namespace, actionName] =
            ruleSplit.length === 1
              ? ['click', ...ruleSplit[0].trim().split('.'), '_']
              : [ruleSplit[0], ...ruleSplit[1].trim().split('.'), '_']
          if (!isClickable) {
            isClickable = eventType === 'click' && namespace !== 'none' && actionName !== '_'
          }
        }
      }
    }

    // Check for tagNames which are natively clickable.
    switch (tagName) {
      case 'a':
        isClickable = true
        break
      case 'textarea':
        isClickable ||= !element.disabled && !element.readOnly
        break
      case 'input':
        isClickable ||= !(
          element.getAttribute('type')?.toLowerCase() == 'hidden' ||
          element.disabled ||
          (element.readOnly && DomUtils.isSelectable(element))
        )
        break
      case 'button':
      case 'select':
        isClickable ||= !element.disabled
        break
      case 'object':
      case 'embed':
        isClickable = true
        break
      case 'label':
        isClickable ||=
          element.control != null &&
          !element.control.disabled &&
          this.getLocalHintsForElement(element.control).length === 0
        break
      case 'body':
        isClickable ||=
          element === document.body &&
          !windowIsFocused() &&
          window.innerWidth > 3 &&
          window.innerHeight > 3 &&
          (document.body != null ? document.body.tagName.toLowerCase() : undefined) !== 'frameset'
            ? (reason = 'Frame.')
            : undefined
        isClickable ||=
          element === document.body && windowIsFocused() && Scroller.isScrollableElement(element)
            ? (reason = 'Scroll.')
            : undefined
        break
      case 'img':
        isClickable ||= ['zoom-in', 'zoom-out'].includes(element.style.cursor)
        break
      case 'div':
      case 'ol':
      case 'ul':
        isClickable ||=
          element.clientHeight < element.scrollHeight && Scroller.isScrollableElement(element)
            ? (reason = 'Scroll.')
            : undefined
        break
      case 'details':
        isClickable = true
        reason = 'Open.'
        break
    }

    // NOTE(smblott) Disabled pending resolution of #2997.
    // # Detect elements with "click" listeners installed with `addEventListener()`.
    // isClickable ||= element.hasAttribute "_vimium-has-onclick-listener"

    // An element with a class name containing the text "button" might be clickable. However, real
    // clickables are often wrapped in elements with such class names. So, when we find clickables
    // based only on their class name, we mark them as unreliable.
    const className = element.getAttribute('class')
    if (!isClickable && className?.toLowerCase().includes('button')) {
      isClickable = true
      possibleFalsePositive = true
    }

    // Elements with tabindex are sometimes useful, but usually not. We can treat them as second
    // class citizens when it improves UX, so take special note of them.
    const tabIndexValue = element.getAttribute('tabindex')
    const tabIndex = tabIndexValue ? parseInt(tabIndexValue) : -1
    if (!isClickable && !(tabIndex < 0) && !isNaN(tabIndex)) {
      isClickable = true
      onlyHasTabIndex = true
    }

    if (isClickable) {
      // An image map has multiple clickable areas, and so can represent multiple LocalHints.
      if (imageMapAreas.length > 0) {
        const mapHints = imageMapAreas.map((areaAndRect) => {
          return new LocalHint({
            element: areaAndRect.element,
            image: element,
            // element,
            rect: areaAndRect.rect,
            secondClassCitizen: onlyHasTabIndex,
            possibleFalsePositive,
            reason,
          })
        })
        hints.push(...mapHints)
      } else {
        const clientRect = DomUtils.getVisibleClientRect(element, true)
        if (clientRect !== null) {
          const hint = new LocalHint({
            element,
            rect: clientRect,
            secondClassCitizen: onlyHasTabIndex,
            possibleFalsePositive,
            reason,
          })
          hints.push(hint)
        }
      }
    }

    return hints
  },

  //
  // Returns element at a given (x,y) with an optional root element.
  // If the returned element is a shadow root, descend into that shadow root recursively until we
  // hit an actual element.
  getElementFromPoint(x, y, root, stack) {
    if (root == null) root = document
    if (stack == null) stack = []
    const element = root.elementsFromPoint
      ? root.elementsFromPoint(x, y)[0]
      : root.elementFromPoint(x, y)

    if (stack.includes(element)) return element

    stack.push(element)

    if (element && element.shadowRoot) {
      return LocalHints.getElementFromPoint(x, y, element.shadowRoot, stack)
    }

    return element
  },

  // Returns an array of LocalHints representing all clickable elements that are not hidden and are
  // in the current viewport, along with rectangles at which (parts of) the elements are displayed.
  // In the process, we try to find rects where elements do not overlap so that link hints are
  // unambiguous. Because of this, the rects returned will frequently *NOT* be equivalent to the
  // rects for the whole element.
  // - requireHref: true if the hintable element must have an href, because an href is required for
  //   commands like "LinkHints.activateModeToCopyLinkUrl".
  getLocalHints(requireHref) {
    // We need document body to be ready in order to find links.
    if (!document.body) return []
    //
    // Find all elements, recursing into shadow DOM if present.
    const getAllElements = (root, elements) => {
      if (elements == null) elements = []
      for (const element of Array.from(root.querySelectorAll('*'))) {
        elements.push(element)
        if (element.shadowRoot) {
          getAllElements(element.shadowRoot, elements)
        }
      }
      return elements
    }

    const elements = getAllElements(document.body)
    let localHints = []

    // The order of elements here is important; they should appear in the order they are in the DOM,
    // so that we can work out which element is on top when multiple elements overlap. Detecting
    // elements in this loop is the sensible, efficient way to ensure this happens.
    // NOTE(mrmr1993): Our previous method (combined XPath and DOM traversal for jsaction) couldn't
    // provide this, so it's necessary to check whether elements are clickable in order, as we do
    // below.
    for (const element of Array.from(elements)) {
      if (!requireHref || !!element.href) {
        const hints = this.getLocalHintsForElement(element)
        localHints.push(...hints)
      }
    }

    // Traverse the DOM from descendants to ancestors, so later elements show above earlier elements.
    localHints = localHints.reverse()

    // Filter out suspected false positives. A false positive is taken to be an element marked as a
    // possible false positive for which a close descendant is already clickable. False positives
    // tend to be close together in the DOM, so - to keep the cost down - we only search nearby
    // elements. NOTE(smblott): The visible elements have already been reversed, so we're visiting
    // descendants before their ancestors.
    // This determines how many descendants we're willing to consider.
    const descendantsToCheck = [1, 2, 3]
    localHints = localHints.filter((hint, position) => {
      if (!hint.possibleFalsePositive) return true
      // Determine if the clickable element is indeed a false positive.
      const lookbackWindow = 6
      let index = Math.max(0, position - lookbackWindow)
      while (index < position) {
        let candidateDescendant = localHints[index].element
        for (const _ of descendantsToCheck) {
          candidateDescendant = candidateDescendant?.parentElement
          if (candidateDescendant === hint.element) {
            // This is a false positive; exclude it from visibleElements.
            return false
          }
        }
        index += 1
      }
      return true
    })

    // This loop will check if any corner or center of element is clickable.
    // document.elementFromPoint will find an element at a x,y location.
    // Node.contain checks to see if an element contains another. note: someNode.contains(someNode)
    // === true. If we do not find our element as a descendant of any element we find, assume it's
    // completely covered.

    const nonOverlappingHints = localHints.filter((hint) => {
      if (hint.secondClassCitizen) return false
      const rect = hint.rect

      // Check middle of element first, as this is perhaps most likely to return true.
      const elementFromMiddlePoint = LocalHints.getElementFromPoint(
        rect.left + rect.width * 0.5,
        rect.top + rect.height * 0.5,
      )
      const hasIntersection =
        elementFromMiddlePoint &&
        (hint.element.contains(elementFromMiddlePoint) ||
          elementFromMiddlePoint.contains(hint.element))
      if (hasIntersection) return true

      // Handle image maps
      if (hint.element.localName == 'area' && elementFromMiddlePoint == hint.image) {
        return true
      }

      // If not in middle, try corners.
      // Adjusting the rect by 0.1 towards the upper left, which empirically fixes some cases where
      // another element would've been found instead. NOTE(philc): This isn't well explained.
      // Originated in #2251.
      const verticalCoords = [rect.top + 0.1, rect.bottom - 0.1]
      const horizontalCoords = [rect.left + 0.1, rect.right - 0.1]

      for (const verticalCoord of verticalCoords) {
        for (const horizontalCoord of horizontalCoords) {
          const elementFromPoint = LocalHints.getElementFromPoint(horizontalCoord, verticalCoord)
          const hasIntersection =
            elementFromPoint &&
            (hint.element.contains(elementFromPoint) || elementFromPoint.contains(hint.element))
          if (hasIntersection) return true
        }
      }
    })

    nonOverlappingHints.reverse()

    // Position the rects within the window.
    const { top, left } = DomUtils.getViewportTopLeft()
    for (const hint of nonOverlappingHints) {
      hint.rect.top += top
      hint.rect.left += left
    }

    // if (Settings.get("filterLinkHints")) {
    // for (const hint of nonOverlappingHints) {
    //   Object.assign(hint, this.generateLinkText(hint));
    // }
    // }
    return nonOverlappingHints
  },
}

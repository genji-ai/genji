import html2canvas from 'html2canvas'
import { DomUtils } from './dom_utils'
import { Enricher } from './enrich'
import { UserFacingError } from './error'
import { LocalHints } from './hints'
import { GenjiMessage } from './messages/schema'
import { ActionResponse, ErrorResponse, Task } from './storage/schema'
import { Tasks } from './storage/tasks'

type StringObject = {
  [key: string]: any
}

class GenjiDefinition {
  hints: StringObject[] | null = null
  hintMarkers: Map<string, StringObject> | null = null
  markersDiv: HTMLElement | null = null
  enrichedMarkers: StringObject | null = null

  reset() {
    this.removeMarkers()
    this.hints = null
    this.hintMarkers = null
    this.markersDiv = null
  }

  async runNextStep(task: Task) {
    if (!task) return

    try {
      // request the backend to choose the nect action
      const nextAction = await this.getNextAction(task)

      // check if the user cancelled the task in the meantime
      task = await Tasks.getPendingTask()
      if (task.status === 'cancelling') {
        Tasks.updateStatus(task, 'cancelled', 'cancelled task before adding fetched step')
        return
      }
      await Tasks.addStep(task, nextAction)

      // Schedule execution of the next step
      // Hope the page will navigate before this timeout
      // If it doesn't, it means the action didn't cause the page to navigate
      if (nextAction.action === 'done') {
        Tasks.updateStatus(task, 'done')
      } else {
        setTimeout(async () => {
          // check if the user cancelled the task in the meantime
          task = await Tasks.getPendingTask()
          if (task.status === 'cancelling') {
            Tasks.updateStatus(
              task,
              'cancelled',
              'cancelled task after executing action but before fetching next step',
            )
            return
          }

          // continue execution of the next step of the task
          this.runNextStep(task)
        }, 2000)
      }

      // perform the backend's requested action
      this.performAction(nextAction)
    } catch (err) {
      await Tasks.updateStatus(task, 'failed', JSON.stringify(err, null, 2))
      return
    }
  }

  async getNextAction(task: Task): Promise<ActionResponse> {
    const annotatedEncodedImg = await this.capture()
    this.removeMarkers()

    const tab = await chrome.runtime.sendMessage({ type: 'sender-query' } as GenjiMessage)
    const requestBody = {
      taskID: task.id,
      description: task.description,
      currentTab: {
        url: tab.url,
        title: tab.title,
      },
      previousActions: task.steps.length > 0 ? task.steps : undefined,
      screenshot: annotatedEncodedImg,
      hintMarkers: this.enrichedMarkers,
    }

    try {
      const response = await fetch('https://api.genji.app/nextAction', {
        method: 'POST',
        body: JSON.stringify(requestBody, null, 2),
      })

      if (!response.ok) {
        const errorResp = await response.json()
        throw new UserFacingError(JSON.stringify(errorResp))
      }

      return await response.json()
    } catch (err) {
      if (err instanceof UserFacingError) {
        await chrome.runtime.sendMessage({
          type: 'fetch-action-error',
          tabID: tab.id,
          resp: JSON.parse(err.message) as ErrorResponse,
        } as GenjiMessage)
      }
      throw err
    }
  }

  async performAction(resp: ActionResponse) {
    if (typeof resp.action === 'string') {
      // done
    } else if (resp.action.type === 'navigate') {
      window.location.href = resp.action.url
    } else if (resp.action.type === 'click') {
      this.clickAction(resp.action.hintString)
    } else if (resp.action.type === 'type') {
      this.typeAction(resp.action.hintString, resp.action.content)
    } else {
      throw Error('AI response is improperly formatted')
    }
  }

  async capture() {
    this.reset()
    this.createMarkers()
    this.displayMarkers()
    this.enrichMarkers()

    return await this.takeScreenshot()
    // return await chrome.runtime.sendMessage({ type: 'screenshot' })
  }

  async takeScreenshot() {
    const annotatedCanvas = await html2canvas(document.body)
    const annotatedEncodedImg = annotatedCanvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream')
    return annotatedEncodedImg
  }

  clickAction(label: string) {
    if (!this.hintMarkers) return
    const clickEl = this.hintMarkers.get(label.toUpperCase())!.hint!.element!
    if (!clickEl) {
      throw Error("couldn't find link to click")
    }
    if (['input', 'select', 'object', 'embed'].includes(clickEl.nodeName.toLowerCase())) {
      clickEl.focus()
    }
    DomUtils.simulateClick(clickEl, {})
  }

  typeAction(label: string, text: string) {
    if (!this.hintMarkers) return
    const textEl = this.hintMarkers.get(label.toUpperCase())?.hint?.element
    const tagName = textEl.tagName.toLowerCase?.() || ''
    let simulator: (c: string) => void
    if (['input', 'textarea'].includes(tagName)) {
      simulator = (c) => (textEl.value += c)
    } else if (textEl.getAttribute('contentEditable') === 'plaintext-only') {
      simulator = (c) => (textEl.textContent += c)
    } else {
      // failing case: https://codepen.io/josdea/pen/OXyQNd
      throw Error("can't handle rich text")
    }

    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        try {
          const c = text.charAt(i)
          simulator(text.charAt(i))
          textEl.dispatchEvent(
            new KeyboardEvent('keydown', { key: c, bubbles: true, cancelable: true }),
          )
          textEl.dispatchEvent(
            new KeyboardEvent('keyup', { key: c, bubbles: true, cancelable: true }),
          )
          textEl.dispatchEvent(
            new Event('change', {
              bubbles: true,
              cancelable: true,
            }),
          )
          i++
          return
        } catch (err) {
          console.log(err)
        }
      }
      clearInterval(interval)
    }, 50)
  }

  createMarkers() {
    this.hints = LocalHints.getLocalHints()

    const hintStrings = genHintStrings(this.hints.length)
    this.hintMarkers = new Map()
    this.hints.map((hint: StringObject, i: number) => {
      const marker = DomUtils.createElement('div')
      marker.style.left = hint.rect.left + 'px'
      marker.style.top = hint.rect.top + 'px'
      marker.style.zIndex = 2140000000 + i
      marker.className = 'vimiumReset internalVimiumHintMarker vimiumHintMarker'
      spanWrap(marker, hintStrings[i].toUpperCase())

      this.hintMarkers!.set(hintStrings[i].toUpperCase(), {
        hint,
        marker,
      })
    })
  }

  enrichMarkers() {
    if (!this.hintMarkers) return
    this.enrichedMarkers = []
    for (const [hintString, hintMarker] of this.hintMarkers) {
      this.enrichedMarkers.push(
        Object.assign(Enricher.describe(hintMarker.hint.element), {
          hintString,
        }),
      )
    }
  }

  displayMarkers() {
    if (!this.hintMarkers) return
    if (this.markersDiv) return

    this.markersDiv = DomUtils.addElementsToPage(
      Array.from(this.hintMarkers.values()).map((m) => m.marker),
      { id: 'vimiumHintMarkerContainer', className: 'vimiumReset' },
    )
  }

  removeMarkers() {
    if (!this.markersDiv) return

    DomUtils.removeElement(this.markersDiv)
    this.markersDiv = null
  }

  toggleMarkers() {
    if (this.markersDiv) {
      this.removeMarkers()
    } else {
      this.displayMarkers()
    }
  }
}
export const Genji = new GenjiDefinition()

const spanWrap = (container: any, hintString: string) => {
  for (const char of hintString) {
    const span = document.createElement('span')
    span.className = 'vimiumReset'
    span.textContent = char
    container.appendChild(span)
  }
}

function genHintStrings(linkCount: number) {
  const linkHintCharacters = 'sadfjklewcmpgh'
  let hints = ['']
  let offset = 0
  while (hints.length - offset < linkCount || hints.length === 1) {
    const hint = hints[offset++]
    for (const ch of linkHintCharacters) {
      hints.push(ch + hint)
    }
  }
  hints = hints.slice(offset, offset + linkCount)

  // Shuffle the hints so that they're scattered; hints starting with the same character and short
  // hints are spread evenly throughout the array.
  return hints.sort().map((str) => str.split('').reverse().join(''))
}

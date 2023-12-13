import { camelCase, mapKeys } from 'lodash'
import { ScrollBack } from './ScrollBack'
import { ScrollFront } from './ScrollFront'
import { ScrollHead } from './ScrollHead'
import { DisplayContainer, Rect, ScrollProps } from './ScrollUtils'
import { Sunflower } from './Sunflower'

export const scrollHeadCurvePixelWidth = 17

export function Scroll({ rect, zIndex, ...props }: ScrollProps) {
  rect = { x: 0, y: 0, w: 500, h: 200, ...rect }

  // height scales from 2rem to 4rem based on the sum of height and width of the scroll
  const scrollHeadHeight = Math.max(32, Math.min(64, (32 * (rect.w + rect.h)) / 300))
  const scrollRects: Record<string, Rect> = {
    head: {
      x: 0,
      y: 0,
      w: rect.w,
      h: scrollHeadHeight,
    },
    tail: {
      x: 0,
      y: rect.h - scrollHeadHeight,
      w: rect.w,
      h: scrollHeadHeight,
    },
  }

  const { component: scrollHead, rects: scrollHeadRects } = ScrollHead({
    rect: scrollRects.head,
    zIndex: '4',
  })

  const { component: scrollTail, rects: scrollTailRects } = ScrollHead({
    rect: scrollRects.tail,
    zIndex: '4',
  })

  scrollRects.back = {
    x: scrollHeadRects.back.x + scrollHeadCurvePixelWidth,
    y: 0,
    w: scrollHeadRects.back.w - 2 * scrollHeadCurvePixelWidth,
    h: rect.h,
  }

  scrollRects.front = {
    x: scrollHeadRects.front.x + scrollHeadCurvePixelWidth,
    y: 0,
    w: scrollHeadRects.front.w - 2 * scrollHeadCurvePixelWidth,
    h: rect.h,
  }

  // Calculate sunflower placements
  const sunflowers: Rect[] = []
  const sunflowerSize = 1.2 * (scrollRects.front.x - scrollRects.back.x)
  for (let y = 0; y < rect.h; y += 1.05 * sunflowerSize) {
    // left
    sunflowers.push({
      x:
        scrollRects.back.x +
        Math.max(0, (scrollRects.front.x - scrollRects.back.x - sunflowerSize) / 2),
      y: y,
      w: sunflowerSize,
      h: sunflowerSize,
    })
    // right
    sunflowers.push({
      x:
        scrollRects.back.x +
        scrollRects.back.w -
        sunflowerSize +
        Math.max(0, (scrollRects.front.x - scrollRects.back.x - sunflowerSize) / 2),
      y: y,
      w: sunflowerSize,
      h: sunflowerSize,
    })
  }

  const container = (
    <DisplayContainer displayProps={{ rect, zIndex }} style={{ overflow: 'hidden' }} {...props}>
      {scrollHead}
      <ScrollBack rect={scrollRects.back} zIndex='1' />
      <ScrollFront rect={scrollRects.front} zIndex='3' />
      {scrollTail}
      {sunflowers.map((rect, i) => (
        <Sunflower key={i} rect={rect} zIndex='2' />
      ))}
    </DisplayContainer>
  )

  return {
    container,
    rects: {
      head: scrollRects.head,
      tail: scrollRects.tail,
      back: scrollRects.back,
      front: scrollRects.front,
      ...mapKeys(scrollHeadRects, (_, k) => camelCase(`head_${k}`)),
      ...mapKeys(scrollTailRects, (_, k) => camelCase(`tail_${k}`)),
    },
  }
}

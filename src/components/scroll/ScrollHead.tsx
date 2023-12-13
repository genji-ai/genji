import { ScrollHandle } from './ScrollHandle'
import { ScrollHeadBack } from './ScrollHeadBack'
import { ScrollHeadFront } from './ScrollHeadFront'
import {
  alignCenter,
  alignEnd,
  alignStart,
  calculateRects,
  DisplayContainer,
  Position,
  ScrollComponent2,
  ScrollProps,
  Size,
} from './ScrollUtils'

export const scrollheadRatios: Record<string, Size> = {
  leftHandle: { w: 0.078143, h: 0.189294 },
  rightHandle: { w: 0.078143, h: 0.189294 },
  back: { w: 0.921856, h: 1 },
  front: { w: 0.737485, h: 1 },
}

export const scrollHeadPositions: Record<string, Position> = {
  leftHandle: {
    x: alignStart(),
    y: alignCenter(scrollheadRatios.leftHandle.h),
  },
  rightHandle: {
    x: alignEnd(scrollheadRatios.rightHandle.w),
    y: alignCenter(scrollheadRatios.rightHandle.h),
  },
  back: {
    x: alignCenter(scrollheadRatios.back.w),
    y: alignStart(),
  },
  front: {
    x: alignCenter(scrollheadRatios.front.w),
    y: alignStart(),
  },
}

export const ScrollHead: ScrollComponent2 = ({ rect, zIndex }: ScrollProps) => {
  rect = { x: 0, y: 0, w: 275, h: 64, ...rect }
  const rects = calculateRects(scrollheadRatios, scrollHeadPositions, rect.w, rect.h)

  const component = (
    <DisplayContainer displayProps={{ rect, zIndex }}>
      <ScrollHandle rect={rects.leftHandle} zIndex='1' />
      <ScrollHandle rect={rects.rightHandle} zIndex='1' />
      <ScrollHeadBack rect={rects.back} zIndex='2' />
      <ScrollHeadFront rect={rects.front} zIndex='3' />
    </DisplayContainer>
  )
  return { component, rects }
}

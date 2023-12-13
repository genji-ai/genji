import React, { forwardRef } from 'react'

export interface ScrollProps extends React.HTMLProps<HTMLDivElement> {
  rect?: Rect
  zIndex?: string
}

export type ComponentRects = {
  component: JSX.Element
  rects: Record<string, Rect>
}

export type ScrollComponent = (props: ScrollProps) => JSX.Element
export type ScrollComponent2 = (props: ScrollProps) => ComponentRects

export type Position = {
  x: number
  y: number
}

export type Size = {
  w: number
  h: number
}

export type Rect = Position & Size

interface DisplayContainerProps extends React.HTMLProps<HTMLDivElement> {
  displayProps?: ScrollProps
}

export const DisplayContainerRef = forwardRef<HTMLDivElement, DisplayContainerProps>(
  // TODO: not sure why, but this has to be duplicated. conditionally passing in ref doesn't work.
  function DisplayContainerDup(
    { displayProps, children, style, ...props }: DisplayContainerProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        style={{
          position: 'absolute',
          left: displayProps?.rect?.x ?? 0,
          top: displayProps?.rect?.y ?? 0,
          width: displayProps?.rect?.w ?? 'auto',
          height: displayProps?.rect?.h ?? 'auto',
          zIndex: displayProps?.zIndex ?? 'auto',
          ...style,
        }}
      >
        {children}
      </div>
    )
  },
)

export function DisplayContainer({
  displayProps,
  children,
  style,
  ...props
}: DisplayContainerProps) {
  return (
    <div
      {...props}
      style={{
        position: 'absolute',
        left: displayProps?.rect?.x ?? 0,
        top: displayProps?.rect?.y ?? 0,
        width: displayProps?.rect?.w ?? 'auto',
        height: displayProps?.rect?.h ?? 'auto',
        zIndex: displayProps?.zIndex ?? 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function calculateRects(
  ratios: Record<string, Size>,
  positions: Record<string, Position>,
  width: number,
  height: number,
) {
  const rects: Record<string, Rect> = {}
  for (const component in ratios) {
    rects[component] = {
      x: width * positions[component].x,
      y: height * positions[component].y,
      w: width * ratios[component].w,
      h: height * ratios[component].h,
    }
  }
  return rects
}

export function translate(position: Position, rects: Record<string, Rect>) {
  for (const key in rects) {
    rects[key].x += position.x
    rects[key].y += position.y
  }
  return rects
}

export function alignCenter(width: number) {
  return (1 - width) / 2
}

export function alignStart() {
  return 0
}

export function alignEnd(width: number) {
  return 1 - width
}

export function dragToResize(rect: Rect, setRect: React.Dispatch<React.SetStateAction<Rect>>) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY

    const doDrag = (dragEvent: MouseEvent) => {
      setRect({
        ...rect,
        w: rect.w + dragEvent.clientX - startX,
        h: rect.h + dragEvent.clientY - startY,
      })
    }

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }
}

export function dragToReposition(rect: Rect, setRect: React.Dispatch<React.SetStateAction<Rect>>) {
  return (e: React.MouseEvent) => {
    const startX = e.clientX
    const startY = e.clientY

    const doDrag = (dragEvent: MouseEvent) => {
      setRect({
        ...rect,
        x: rect.x + dragEvent.clientX - startX,
        y: rect.y + dragEvent.clientY - startY,
      })
    }

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }
}

export function onClickNotDrag(handler: (e: MouseEvent) => void) {
  return (e: React.MouseEvent) => {
    const start: Position = { x: e.clientX, y: e.clientY }
    const displacement: Position = { x: 0, y: 0 }

    const addDisplacement = (e: MouseEvent) => {
      displacement.x = Math.max(displacement.x, Math.abs(start.x - e.clientX))
      displacement.y = Math.max(displacement.y, Math.abs(start.y - e.clientY))
    }

    const checkIfClick = (e: MouseEvent) => {
      if (displacement.x + displacement.y < 50) {
        handler(e)
      }
      document.removeEventListener('mousemove', addDisplacement)
      document.removeEventListener('mouseup', checkIfClick)
    }

    document.addEventListener('mousemove', addDisplacement)
    document.addEventListener('mouseup', checkIfClick)
  }
}

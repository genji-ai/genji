import { DisplayContainer, ScrollComponent, ScrollProps } from './ScrollUtils'

export const ScrollBack: ScrollComponent = ({ rect, zIndex }: ScrollProps) => {
  rect = { x: 0, y: 0, w: 216, h: 200, ...rect }
  return (
    <DisplayContainer displayProps={{ rect, zIndex }}>
      <svg
        className='scroll-svg'
        width={rect.w}
        height={rect.h}
        viewBox={`0 0 ${rect.w} ${rect.h}`}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width={rect.w} height={rect.h} fill='#F19A38' preserveAspectRatio='none' />
      </svg>
    </DisplayContainer>
  )
}

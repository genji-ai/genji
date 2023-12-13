import { DisplayContainer, ScrollComponent, ScrollProps } from './ScrollUtils'

export const ScrollFront: ScrollComponent = ({ rect, zIndex }: ScrollProps) => {
  rect = { x: 0, y: 0, w: 168, h: 200, ...rect }
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
        <rect
          width={rect.w}
          height={rect.h}
          fill='url(#front-gradient)'
          preserveAspectRatio='none'
        />
        <defs>
          <radialGradient
            id='front-gradient'
            cx='0'
            cy='0'
            r='1'
            gradientUnits='userSpaceOnUse'
            gradientTransform={`translate(${rect.w / 2} ${rect.h / 2}) rotate(90) scale(${
              rect.h / 2
            } ${rect.w / 2})`}
          >
            <stop stopColor='white' />
            <stop offset='1' stopColor='#FCF7DF' />
          </radialGradient>
        </defs>
      </svg>
    </DisplayContainer>
  )
}

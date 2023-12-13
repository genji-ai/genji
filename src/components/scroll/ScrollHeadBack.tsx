import { DisplayContainer, ScrollComponent, ScrollProps } from './ScrollUtils'

export const ScrollHeadBack: ScrollComponent = ({ rect, zIndex }: ScrollProps) => {
  rect = { x: 0, y: 0, w: 250, h: 64, ...rect }

  // Keep border radius when stretching horizontally
  // Scale normally when stretching vertically
  const pathData = `
    M ${rect.w - 17} 64
    c 14 0 17 -14 17 -32
    c 0 -18 -3 -31 -17 -32
    h -${rect.w - 34}
    c -14 0 -17 14 -17 32
    c 0 18 3 31 17 32
    z`

  return (
    <DisplayContainer displayProps={{ rect, zIndex }}>
      <svg
        className='scroll-svg'
        width={rect.w}
        height={rect.h}
        viewBox={`0 0 ${rect.w} 64`}
        preserveAspectRatio='none'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d={pathData} fill='url(#head-back-gradient)' />

        <defs>
          <linearGradient
            id='head-back-gradient'
            x1={`${rect.w / 2}`}
            y1='0'
            x2={`${rect.w / 2}`}
            y2='64'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#F19A38' />
            <stop offset='1' stopColor='#E8482F' />
          </linearGradient>
        </defs>
      </svg>
    </DisplayContainer>
  )
}

import { DisplayContainer, ScrollComponent, ScrollProps } from './ScrollUtils'

export const ScrollHandle: ScrollComponent = ({ rect, zIndex }: ScrollProps) => {
  rect = { x: 0, y: 0, w: 21.192, h: 12.1148, ...rect }

  // Keep border radius when stretching horizontally
  // Scale normally when stretching vertically
  const pathData = `
    M 4.44427 12.1148
    c -2.455 0 -4.444 -2.711 -4.444 -6.059
    c 0 -3.346 1.989 -6.056 4.444 -6.056
    h ${rect.w - 8.88827}
    c 2.454 0 4.444 2.71 4.444 6.056
    c 0 3.348 -1.99 6.059 -4.444 6.059
    z`

  return (
    <DisplayContainer displayProps={{ rect, zIndex }}>
      <svg
        className='scroll-svg'
        width={rect.w}
        height={rect.h}
        viewBox={`0 0 ${rect.w} 12.1148`}
        preserveAspectRatio='none'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        style={{ position: 'absolute' }}
      >
        <path d={pathData} fill='url(#handle-gradient)' />

        <defs>
          <linearGradient
            id='handle-gradient'
            x1={`${rect.w / 2}`}
            y1='0'
            x2={`${rect.w / 2}`}
            y2='12.1159'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#654426' />
            <stop offset='1' stopColor='#372016' />
          </linearGradient>
        </defs>
      </svg>
    </DisplayContainer>
  )
}

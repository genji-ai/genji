import SunflowerSVG from '../../imgs/sunflower.svg?react'
import { DisplayContainer, ScrollComponent, ScrollProps } from './ScrollUtils'

export const Sunflower: ScrollComponent = (props: ScrollProps) => {
  return (
    <DisplayContainer displayProps={props}>
      <SunflowerSVG width={props.rect?.w ?? 26} height={props.rect?.h ?? 26} />
    </DisplayContainer>
  )
}

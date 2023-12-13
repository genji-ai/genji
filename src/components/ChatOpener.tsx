import { useState } from 'react'
import { styled } from 'styled-components'
import GenjiLogo from '../imgs/genji-logo.svg?react'
import { DisplayContainer, dragToReposition, onClickNotDrag, Rect } from './scroll/ScrollUtils'

const StyledChatOpener = styled.div<{ $visible: boolean }>`
  position: fixed;
  right: 100px;
  bottom: 100px;
  display: ${(props) => (props.$visible ? 'block' : 'none')};
  cursor: pointer;
`

const StyledDisplayContainer = styled(DisplayContainer)<{ $width: number; $height: number }>`
  background-color: rgb(255, 223, 60);
  border-radius: ${(props) => `${Math.max(props.$width, props.$height) / 2 + 1}px`};
  padding: ${(props) => `${Math.max(props.$width, props.$height) / 15}px`};
`

type ChatOpenerProps = {
  chatVisible: boolean
  setChatVisible: React.Dispatch<React.SetStateAction<boolean>>
  width: number
  height: number
}

export function ChatOpener({
  chatVisible,
  setChatVisible,
  width = 100,
  height = 100,
}: ChatOpenerProps) {
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: width, h: height })
  return (
    <StyledChatOpener $visible={!chatVisible}>
      <StyledDisplayContainer
        $width={rect.w}
        $height={rect.h}
        displayProps={{ rect, zIndex: '10000000' }}
        onMouseDown={(e) => {
          onClickNotDrag(() => setChatVisible(!chatVisible))(e)
          dragToReposition(rect, setRect)(e)
        }}
      >
        <GenjiLogo width={rect.w} height={rect.h} />
      </StyledDisplayContainer>
    </StyledChatOpener>
  )
}

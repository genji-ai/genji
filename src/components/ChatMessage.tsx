import { ReactNode } from 'react'
import { styled } from 'styled-components'
import GenjiLogo from '../imgs/genji-logo.svg?react'

type ChatMessageProps = {
  children: ReactNode
  width: number
  sender: string
  addLogo?: boolean
}

const ChatMessageContainer = styled.div<{ $sender: string }>`
  margin: 0rem 0.25rem;
  padding: 0.125rem 0.3125rem;
  border: 1px solid #00000012;
  border-radius: 5px;
  background-color: ${(props) => (props.$sender == 'user' ? '#ffc54257' : '#d1c1aa85')};

  max-width: 80%;
  align-self: ${(props) => (props.$sender == 'user' ? 'end' : 'start')};
  text-align: ${(props) => (props.$sender == 'user' ? 'end' : 'start')};

  font:
    1rem/1 'Fira Sans Condensed',
    sans-serif;
  color: black;
  vertical-align: middle;

  &:first-child {
    margin-top: 0.5rem;
  }
`

const LogoSection = styled(GenjiLogo)`
  vertical-align: middle;
  margin: 0.125rem 0.4375rem 0.125rem 0.125rem;
`

export function ChatMessage({ children, width, sender, addLogo = true }: ChatMessageProps) {
  return (
    <ChatMessageContainer $sender={sender}>
      {addLogo && sender == 'genji' && <LogoSection width={width / 10} height={width / 10} />}
      {children}
    </ChatMessageContainer>
  )
}

import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { styled } from 'styled-components'
import GenjiLarge from '../imgs/genji-large.svg?react'
import HideIcon from '../imgs/hide.svg?react'
import Shuriken from '../imgs/shuriken.svg?react'
import { Genji } from '../lib/genji'
import { GenjiMessage } from '../lib/messages/schema'
import { MessageStorage } from '../lib/storage/messages'
import { MessageModel } from '../lib/storage/schema'
import { Tasks } from '../lib/storage/tasks'
import { ChatMessage } from './ChatMessage'
import { ChatOpener } from './ChatOpener'
import { Scroll } from './scroll/Scroll'
import {
  alignCenter,
  DisplayContainer,
  DisplayContainerRef,
  dragToReposition,
  Rect,
  translate,
} from './scroll/ScrollUtils'

const ChatContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  right: 500px;
  bottom: 500px;
  display: ${(props) => (props.$visible ? 'block' : 'none')};
`

const ChatArea = styled(DisplayContainerRef)`
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;

  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

const MessageBoxContainer = styled(DisplayContainer)`
  background-color: rgba(0, 0, 0, 0);
`

const ThinkingShuriken = styled(Shuriken)`
  margin: 0.5rem;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  animation: spin 4s steps(360) infinite;
`
const TrayContainer = styled(DisplayContainer)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: right;
  column-gap: 1rem;
`

const StyledMessageBox = styled.textarea`
  display: block;
  resize: none;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0);
  border: none;
  border-radius: 0.3125rem;
  box-shadow: inset 0px 0px 10px 0px #d9cbb4;
  padding: 0.5rem;

  // font
  font:
    1rem/1 'Fira Sans Condensed',
    sans-serif;
  color: black;

  &::placeholder {
    font:
      1rem/1 'Fira Sans Condensed',
      sans-serif;
    color: #757575;
  }

  &:hover {
    box-shadow:
      inset 0px 0px 10px 0px #d9cbb4,
      0px 0px 2px 0px #d9cbb4;
  }
  &:focus {
    outline: none;
    box-shadow:
      inset 0px 0px 10px 0px #d9cbb4,
      0px 0px 2px 0px #d9cbb4;
  }
  &::-webkit-scrollbar {
    display: none;
  }
`

const StyledCancelButton = styled.button`
  background: none;
  outline: none;
  cursor: pointer;
  border: none;
  box-shadow: 0px 0 0 1px #000000;

  &:disabled,
  &:disabled:hover {
    cursor: default;
    color: #1010104d;
    background-color: #ffffff57;
  }

  &:hover {
    background-color: #988d7899;
  }

  &:focus {
    box-shadow: 0px 0 2px 1px #000000;
  }

  &:active {
    background-color: #5f594d99;
  }
`

type CancelState = 'default' | 'cancelling' | 'cancelled'

type ChatProps = {
  tabID: number
  existingMessages: MessageModel[]
  pendingTaskExists: boolean
  genjiEnabled: boolean
}
export function Chat({ tabID, existingMessages, pendingTaskExists, genjiEnabled }: ChatProps) {
  const [visible, setVisible] = useState<boolean>(pendingTaskExists)
  const [messages, setMessages] = useState<MessageModel[]>(existingMessages)
  const [textareaContent, setTextareaContent] = useState<string>('')
  const [thinking, setThinking] = useState<boolean>(pendingTaskExists)
  const [isEnabled, setIsEnabled] = useState(genjiEnabled)
  const [cancelState, setCancelState] = useState<CancelState>('default')

  async function acceptUserInput(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (!textareaContent || textareaContent.trim().length === 0) {
        return
      }

      // add user message to chat area
      const message = {
        sender: 'user',
        message: textareaContent,
      }
      await MessageStorage.addMessage(tabID, message)
      setTextareaContent('')
      setThinking(true)

      // submit task for processing
      Tasks.newTask(textareaContent).then(Genji.runNextStep.bind(Genji))
    }
  }

  useEffect(() => {
    const handleMessage = async (request: GenjiMessage) => {
      if (request.type === 'push-message') {
        // Have to pass explicitly pass in prevMessages here to not overwrite messages since setMessages is async
        // See https://stackoverflow.com/questions/58193166/usestate-hook-setter-incorrectly-overwrites-state
        setMessages((prevMessages) => [...prevMessages, request.content])
      } else if (request.type === 'task-update') {
        if (request.update == 'add-step') {
          await MessageStorage.addMessage(request.task.tabID, {
            sender: 'genji',
            message: request.task.steps[request.task.steps.length - 1].response.explanation,
          })
        } else if (request.update == 'finalize-task') {
          if (request.task.status === 'cancelled') {
            setCancelState('cancelled')
            setTimeout(() => setCancelState('default'), 500)
            await MessageStorage.addMessage(request.task.tabID, {
              sender: 'genji',
              message: 'The active task has been cancelled',
            })
          } else {
            setCancelState('default')
          }
          setThinking(false)
        }
      } else if (request.type === 'fetch-action-error') {
        await MessageStorage.addMessage(request.tabID, {
          sender: 'genji',
          message: request.resp.errorMessage,
        })
      } else if (request.type === 'update-enabled') {
        setIsEnabled(request.newEnabled)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  const chatAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatAreaRef.current) {
      const { scrollHeight, clientHeight } = chatAreaRef.current
      chatAreaRef.current.scrollTop = scrollHeight - clientHeight
    }
  }, [messages])

  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 300, h: 400 })
  const { container: scroll, rects: scrollRects } = Scroll({
    rect,
    zIndex: '1',
  })

  const messageBoxHeightPixels = 48
  const chatAreaMessageBoxGap = 6

  const chatRects: Record<string, Rect> = translate(rect, {
    genjiSign: {
      x: scrollRects.front.x + scrollRects.front.w * alignCenter(0.8),
      y: 0,
      w: scrollRects.front.w * 0.8,
      h: scrollRects.head.h,
    },
    chatArea: {
      x: scrollRects.front.x,
      y: scrollRects.head.h,
      w: scrollRects.front.w,
      h:
        scrollRects.front.h -
        scrollRects.head.h -
        scrollRects.tail.h -
        messageBoxHeightPixels -
        chatAreaMessageBoxGap,
    },
    messageBox: {
      x: scrollRects.front.x,
      y: scrollRects.tail.y - messageBoxHeightPixels,
      w: scrollRects.front.w,
      h: messageBoxHeightPixels,
    },
    tray: {
      x: scrollRects.front.x,
      y: scrollRects.tail.y,
      w: scrollRects.front.w,
      h: scrollRects.tail.h,
    },
  })

  if (isEnabled) {
    return (
      <>
        <ChatOpener width={75} height={75} chatVisible={visible} setChatVisible={setVisible} />
        <ChatContainer $visible={visible}>
          {scroll}
          <DisplayContainer
            displayProps={{ rect: chatRects.genjiSign, zIndex: '1' }}
            onMouseDown={dragToReposition(rect, setRect)}
            style={{ cursor: 'pointer' }}
          >
            <GenjiLarge width={chatRects.genjiSign.w} height={chatRects.genjiSign.h} />
          </DisplayContainer>
          <ChatArea ref={chatAreaRef} displayProps={{ rect: chatRects.chatArea, zIndex: '2' }}>
            {messages.map((message, i) => (
              <ChatMessage key={i} width={chatRects.chatArea.w} sender={message.sender}>
                {message.message}
              </ChatMessage>
            ))}
            {thinking && (
              <ChatMessage width={chatRects.chatArea.w} sender='genji' addLogo={false}>
                <ThinkingShuriken
                  style={{ width: '2rem', height: '2rem', verticalAlign: 'middle' }}
                />
                {'Thinking... '}
                <StyledCancelButton
                  disabled={!(thinking && cancelState == 'default')}
                  onClick={async () => {
                    const task = await Tasks.getPendingTask()
                    if (task && task.status === 'active') {
                      await Tasks.updateStatus(task, 'cancelling')
                      setCancelState('cancelling')
                    }
                  }}
                >
                  {cancelState === 'default'
                    ? 'Cancel'
                    : cancelState == 'cancelling'
                    ? 'Cancelling...'
                    : 'Cancelled'}
                </StyledCancelButton>
              </ChatMessage>
            )}
          </ChatArea>
          <MessageBoxContainer displayProps={{ rect: chatRects.messageBox, zIndex: '2' }}>
            <StyledMessageBox
              value={textareaContent}
              autoComplete='on'
              onChange={(e) => setTextareaContent(e.target.value)}
              onKeyDown={acceptUserInput}
              placeholder='Give Genji a task to do'
            />
          </MessageBoxContainer>
          <TrayContainer displayProps={{ rect: chatRects.tray, zIndex: '3' }}>
            <HideIcon
              width={0.6 * chatRects.tray.h}
              height={0.6 * chatRects.tray.h}
              style={{ cursor: 'pointer' }}
              onClick={() => setVisible(!visible)}
            />
          </TrayContainer>
        </ChatContainer>
      </>
    )
  } else {
    return <></>
  }
}

'use client'

import { Classification } from '@/ai/classify'
import { createContext, useContext, useState } from 'react'

export enum ChatActionStatus {
  Proposed = 'proposed',
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
}

export interface ChatProposedAction {
  id: string
  status: ChatActionStatus
  structuredOutput: any
  classification: Classification
  error?: string
}

export interface ChatActionsContextValues {
  actions: Record<string, ChatProposedAction>
  focusedActionId: string | null
  setFocusedActionId: (actionId: string | null) => void
  setAction: (actionDispatch: ChatProposedAction) => void
  getAction: (actionId: string) => ChatProposedAction
}

export const ChatActionsContext =
  createContext<ChatActionsContextValues>({
    actions: {},
    focusedActionId: null,
    setFocusedActionId: (actionId: string | null) => {},
    setAction: () => {},
    getAction: () => {
      throw new Error('Not implemented')
    },
  })

export const useChatActionsContext = () => {
  return useContext(ChatActionsContext)
}

export const ChatActionsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [actions, setActions] = useState<
    Record<string, ChatProposedAction>
  >({})
  const [focusedActionId, setFocusedActionId] = useState<
    string | null
  >(null)
  const setAction: ChatActionsContextValues['setAction'] = (
    actionDispatch
  ) => {
    setActions((prevActions) => ({
      ...prevActions,
      [actionDispatch.id]: actionDispatch,
    }))
  }

  const getAction = (actionId: string) => {
    return actions[actionId]
  }

  return (
    <ChatActionsContext.Provider
      value={{
        actions,
        setAction,
        getAction,
        focusedActionId,
        setFocusedActionId,
      }}
    >
      {children}
    </ChatActionsContext.Provider>
  )
}

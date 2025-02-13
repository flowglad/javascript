'use server'
import { Flowglad as FlowgladNode } from '@flowglad/node'

export const flowgladNode = () =>
  new FlowgladNode({
    apiKey: process.env.FLOWGLAD_API_KEY,
    baseURL: 'http://localhost:3000',
  })

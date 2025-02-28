import { Node, Edge } from '@xyflow/react'
import type { WorkflowNode } from '@/types'
import { NodeTypes } from '@/types'

export const NODE_TYPES: Record<
  NodeTypes,
  {
    label: string
    inputs: Array<{ handle: string; type: string }>
    outputs: Array<{ handle: string; type: string }>
  }
> = {
  customNode: {
    label: 'Custom Node',
    inputs: [],
    outputs: [],
  },
  dataLoader: {
    label: 'Data Loader',
    inputs: [],
    outputs: [{ handle: 'data', type: 'array' }],
  },
  transformer: {
    label: 'Transformer',
    inputs: [{ handle: 'input', type: 'array' }],
    outputs: [{ handle: 'transformed', type: 'array' }],
  },
  filter: {
    label: 'Filter',
    inputs: [{ handle: 'data', type: 'array' }],
    outputs: [{ handle: 'filtered', type: 'array' }],
  },
  writer: {
    label: 'Writer',
    inputs: [{ handle: 'data', type: 'array' }],
    outputs: [{ handle: 'success', type: 'boolean' }],
  },
}

export const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: 'dataLoader', // Changed from 'customNode' to actual type
    position: { x: 100, y: 100 },
    data: { label: 'Load CSV' },
  },
  {
    id: '2',
    type: 'filter', // Changed from 'customNode' to actual type
    position: { x: 400, y: 50 },
    data: { label: 'Filter Rows' },
  },
  {
    id: '3',
    type: 'transformer', // Changed from 'customNode' to actual type
    position: { x: 400, y: 200 },
    data: { label: 'Transform Data' },
  },
  {
    id: '4',
    type: 'writer', // Changed from 'customNode' to actual type
    position: { x: 700, y: 100 },
    data: { label: 'Write to DB' },
  },
]

export const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'data',
    targetHandle: 'data',
    type: 'default', // Added default type
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    sourceHandle: 'data',
    targetHandle: 'input',
    type: 'default',
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    sourceHandle: 'filtered',
    targetHandle: 'data',
    type: 'default',
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    sourceHandle: 'transformed',
    targetHandle: 'data',
    type: 'default',
  },
]

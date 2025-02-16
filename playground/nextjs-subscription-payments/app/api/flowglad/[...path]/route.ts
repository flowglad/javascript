'use server';
import { createNextRouteHandler } from '@flowglad/next';
import { flowgladServer } from '@/app/flowglad';

const routeHandler = createNextRouteHandler(flowgladServer());

export const GET = routeHandler;

export const POST = routeHandler;

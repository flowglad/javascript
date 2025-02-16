'use server';
import { createNextRouteHandler } from '@flowglad/next/server';
import { flowgladServer } from '@/app/flowglad';

const routeHandler = createNextRouteHandler(flowgladServer());

export const GET = routeHandler;

export const POST = routeHandler;

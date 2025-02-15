import { FlowgladServer } from '@flowglad/server';
import { createClient } from '@/utils/supabase/server';

export const flowgladServer = () => {
  return new FlowgladServer({
    supabaseAuth: {
      client: createClient
    }
  });
};

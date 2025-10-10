// Utility file to handle Supabase queries with proper typing
import { supabase } from "@/integrations/supabase/client";

export const supabaseQuery = {
  from: (table: string) => ({
    select: (query: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          const { data, error } = await (supabase as any).from(table).select(query).eq(column, value).single();
          return { data, error };
        },
        then: async (callback: any) => {
          const { data, error } = await (supabase as any).from(table).select(query).eq(column, value);
          return callback({ data, error });
        }
      }),
      order: (column: string, options: any) => ({
        then: async (callback: any) => {
          const { data, error } = await (supabase as any).from(table).select(query).order(column, options);
          return callback({ data, error });
        }
      }),
      then: async (callback: any) => {
        const { data, error } = await (supabase as any).from(table).select(query);
        return callback({ data, error });
      }
    }),
    update: (values: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback: any) => {
          const { error } = await (supabase as any).from(table).update(values).eq(column, value);
          return callback({ error });
        }
      })
    })
  })
};

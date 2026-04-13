export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          priority: "low" | "medium" | "high";
          status: "todo" | "doing" | "done";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          status?: "todo" | "doing" | "done";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
      planner_blocks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          color: string | null;
          linked_task_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          color?: string | null;
          linked_task_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["planner_blocks"]["Row"]>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskPriority = Task["priority"];
export type TaskStatus = Task["status"];
export type PlannerBlock = Database["public"]["Tables"]["planner_blocks"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];

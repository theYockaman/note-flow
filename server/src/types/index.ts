export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  position_x?: number;
  position_y?: number;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  code: string;
  config: Record<string, any>;
}

export interface ApiToken {
  id: string;
  user_id: string;
  token: string;
  name: string;
  created_at: string;
  last_used?: string;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

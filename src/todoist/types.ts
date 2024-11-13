interface Due {
  date: string;
  is_recurring: boolean;
  lang: string;
  string: string;
  timezone: null | string;
}

export interface TodoistEventItem {
  added_at: string;
  added_by_uid: string;
  assigned_by_uid: null | string;
  checked: boolean;
  child_order: number;
  collapsed: boolean;
  completed_at: null | string;
  content: string;
  day_order: number;
  deadline: null | string;
  description: string;
  due: Due | null;
  duration: null | number;
  id: string;
  is_deleted: boolean;
  labels: string[];
  parent_id: null | string;
  priority: number;
  project_id: string;
  responsible_uid: null | string;
  section_id: null | string;
  sync_id: null | string;
  updated_at: string;
  user_id: string;
  v2_id: string;
  v2_parent_id: null | string;
  v2_project_id: string;
  v2_section_id: null | string;
}

export interface TodoistActivitySyncResponse {
  full_sync: boolean;
  items: TodoistEventItem[];
  sync_token: string;
}

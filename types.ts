
export type FileContent = {
  name: string;
  language: string;
  content: string;
  path: string;
};

export type ProjectStructure = {
  [key: string]: FileContent | ProjectStructure;
};

export type AppProject = {
  id: string;
  name: string;
  prompt: string;
  files: FileContent[];
  createdAt: number;
};

export enum AgentRole {
  UI_DESIGNER = 'UI Designer',
  FRONTEND = 'Frontend Developer',
  BACKEND = 'Backend Developer',
  DATABASE = 'Database Architect',
  REVIEWER = 'Code Reviewer'
}

export interface AgentStatus {
  role: AgentRole;
  status: 'idle' | 'working' | 'completed' | 'error';
  message: string;
}

export type UserPlan = 'Free' | 'Pro' | 'Ultra';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  plan: UserPlan;
  credits: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

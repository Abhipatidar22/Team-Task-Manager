export type User = {
  id: string;
  email: string;
  name: string;
};

export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type ProjectSummary = {
  id: string;
  name: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  assignedTo?: User | null;
  createdBy?: User | null;
  createdAt: string;
  updatedAt: string;
};

import { Range } from 'slate';

export type Comment = {
  id: string;
  content: string;
  author: string;
  createdAt: number;
};

export type CommentThread = {
  id: string;
  anchor: Range['anchor'];
  focus: Range['focus'];
  comments: Comment[];
};

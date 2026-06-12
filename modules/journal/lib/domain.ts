export type NoteDto = {
  id: string;
  notebookDay: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteResponse = {
  note: NoteDto | null;
};

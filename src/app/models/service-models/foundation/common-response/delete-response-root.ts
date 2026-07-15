/** Backend may return this shape for hard delete, archive, or variant deactivate. */
export class DeleteResponseRoot {
  deleteResult?: boolean;
  deleteMessage?: string;
  deleted?: boolean;
  archived?: boolean;
  deactivated?: boolean;
  message?: string;
}

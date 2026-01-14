export enum ViewMode {
  Split = 'SPLIT',
  Edit = 'EDIT',
  Preview = 'PREVIEW'
}

export interface RenderState {
  markdown: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
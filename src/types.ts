export interface HistoryItem { url: string; title: string; time: string; }
export interface BookmarkItem { url: string; title: string; }

export interface DownloadItem {
  id: string;
  name: string;
  url: string;
  total: number;
  received: number;
  state: 'progressing' | 'completed' | 'failed' | 'interrupted';
  path: string;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  progress: number;
}

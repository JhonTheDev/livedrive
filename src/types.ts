export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  iconType: 'github' | 'dribbble' | 'notion' | 'figma' | 'chrome' | 'twitter' | 'youtube' | 'generic';
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type SidebarTab = 'home' | 'vault' | 'collections' | 'settings';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
}

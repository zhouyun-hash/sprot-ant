import { defineStore } from 'pinia';
import request from '@/utils/request';

type UserInfo = {
  id?: number;
  username?: string;
  name?: string;
  role?: string;
};

type LoginPayload = { username: string; password: string };

const TOKEN_KEY = 'pc_token';
const USER_KEY = 'pc_user';
const PERMS_KEY = 'pc_permissions';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: (JSON.parse(localStorage.getItem(USER_KEY) || 'null') as UserInfo | null),
    permissions: (JSON.parse(localStorage.getItem(PERMS_KEY) || '[]') as string[]),
  }),
  getters: {
    isAdmin(): boolean {
      const role = this.user?.role;
      return role === 'admin' || role === 'super_admin';
    },
    hasPermission() {
      return (perm: string): boolean => {
        if (this.isAdmin) return true;
        return this.permissions.includes(perm);
      };
    },
  },
  actions: {
    async login(payload: LoginPayload) {
      const res = await request.post('/auth/login', payload);
      const data = res.data || {};
      const token = data.access_token as string;
      if (!token) {
        throw new Error('登录响应缺少 token');
      }
      this.token = token;
      this.user = (data.user || null) as UserInfo | null;
      this.permissions = data.permissions || [];
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      localStorage.setItem(PERMS_KEY, JSON.stringify(this.permissions));
    },
    logout() {
      this.token = '';
      this.user = null;
      this.permissions = [];
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERMS_KEY);
    },
  },
});

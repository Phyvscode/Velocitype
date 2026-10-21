const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: 'user' | 'admin';
  elo?: number;
  fontFamily?: string;
  colorTheme?: any;
  bgTheme?: any;
  fullTheme?: string | null;
  language?: string;
  selectedCharacters?: string[];
  layoutConfig?: any;
  setupPrefs?: any;
  avatarUrl?: string;
  portalBorder?: string;
}

export interface UserProfileResponse {
  user: User & { createdAt?: string };
  stats: {
    testCount: number;
    savedWordsCount: number;
    bestWpm: number;
    avgWpm?: number;
    avgAccuracy?: number;
    totalDuration?: number;
    elo?: number;
  };
}

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  created_at: string;
}

export interface TestResultData {
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  correctCount: number;
  totalWords: number;
  correctChars?: number;
  duration: number;
  mode?: string;
  rows?: string[];
  cia?: { c: number; i: number; a: number };
  typed?: Array<{ word: string; correct: boolean }>;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  elo?: number;
  wpm: number;
  accuracy: number;
  duration: number;
  createdAt: string;
}

export interface UserSettingsPayload {
  fontFamily?: string;
  colorTheme?: any;
  bgTheme?: any;
  fullTheme?: string | null;
  avatarUrl?: string;
  portalBorder?: string;
  language?: string;
  selectedCharacters?: string[];
  layoutConfig?: any;
  setupPrefs?: any;
}

class ApiClient {
  public getToken(): string | null {
    return localStorage.getItem('velocitype_token');
  }

  public setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('velocitype_token', token);
    } else {
      localStorage.removeItem('velocitype_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // Auth Endpoints
  public async signup(username: string, email: string, password: string, avatarUrl?: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, avatarUrl }),
    });
    this.setToken(data.token);
    return data;
  }

  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async googleLogin(credential: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe(): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>('/auth/me');
  }

  public async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async verifyOTP(email: string, otp: string): Promise<{ resetToken: string }> {
    return this.request<{ resetToken: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  public async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }

  public logout(): void {
    this.setToken(null);
  }

  // Words Endpoints
  public async getSavedWords(query?: string): Promise<SavedWord[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<SavedWord[]>(`/words/saved${qs}`);
  }

  public async saveWord(word: string, meaning: string): Promise<SavedWord> {
    return this.request<SavedWord>('/words/saved', {
      method: 'POST',
      body: JSON.stringify({ word, meaning }),
    });
  }

  public async updateSavedWord(id: string, meaning: string): Promise<SavedWord> {
    return this.request<SavedWord>(`/words/saved/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ meaning }),
    });
  }

  public async deleteSavedWord(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/words/saved/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Results & Leaderboard Endpoints
  public async saveResult(result: TestResultData): Promise<any> {
    return this.request('/results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
  }

  public async getHistory(limit = 20, page = 1): Promise<any[]> {
    return this.request<any[]>(`/results/history?limit=${limit}&page=${page}`);
  }

  public async getUserStats(): Promise<any> {
    return this.request<any>('/results/stats');
  }

  public async getLeaderboard(type: 'wpm' | 'elo' = 'wpm', limit = 10): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(`/results/leaderboard?type=${type}&limit=${limit}`);
  }

  public async deleteResult(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/results/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // User Settings & Profile
  public async updateSettings(settings: UserSettingsPayload): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  public async updateProfile(payload: { username?: string; avatarUrl?: string }): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Backend AI Sentence Generation Proxy
  public async generateSentences(params: {
    rows?: string[];
    minWords?: number;
    maxWords?: number;
    count?: number;
    theme?: string;
  }): Promise<{ sentences: string[] }> {
    return this.request<{ sentences: string[] }>('/sentences/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const api = new ApiClient();

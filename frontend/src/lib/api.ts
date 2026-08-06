const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  fontFamily?: string;
  colorTheme?: any;
}

export interface UserProfileResponse {
  user: User & { createdAt?: string };
  stats: {
    testCount: number;
    savedWordsCount: number;
    bestWpm: number;
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
  accuracy: number;
  correctCount: number;
  totalWords: number;
  duration: number;
  rows?: string[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  duration: number;
  createdAt: string;
}

class ApiClient {
  private getToken(): string | null {
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
  public async signup(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
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
  public async getSavedWords(): Promise<SavedWord[]> {
    return this.request<SavedWord[]>('/words/saved');
  }

  public async saveWord(word: string, meaning: string): Promise<SavedWord> {
    return this.request<SavedWord>('/words/saved', {
      method: 'POST',
      body: JSON.stringify({ word, meaning }),
    });
  }

  public async deleteSavedWord(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/words/saved/${id}`, {
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

  public async getHistory(): Promise<any[]> {
    return this.request<any[]>('/results/history');
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>('/results/leaderboard');
  }

  public async updateSettings(settings: { fontFamily?: string, colorTheme?: any }): Promise<any> {
    return this.request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();

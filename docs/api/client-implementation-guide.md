# APIクライアント実装ガイド

GitLab Repository Analyzer APIのクライアント実装に関する包括的なガイドです。  
API仕様の詳細は `/docs/api/openapi.yaml` を参照してください。

## TypeScript型定義

### 基本レスポンス型

```typescript
interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data?: T;
  error?: {
    message: string;
    details?: string;
    validation_errors?: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>;
  };
}

interface Project {
  id: number;
  gitlab_id: number;
  name: string;
  description?: string;
  web_url: string;
  default_branch: string;
  visibility: 'public' | 'internal' | 'private';
  created_at: string;
  gitlab_created_at: string;
}
```

## エラーハンドリング

### 基本方針

**シンプルな原則**: 200番台以外はすべてエラーメッセージを表示

```javascript
if (response.ok) {
  // 成功（200番台）
  const data = await response.json();
  // 正常処理
} else {
  // エラー（200番台以外）
  const errorData = await response.json();
  alert(errorData.error.message);
}
```

### 汎用APIコール関数

```typescript
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const result: ApiResponse<T> = await response.json();
    return result.data!;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('ネットワーク接続に失敗しました');
    }
    throw error;
  }
}
```

### バリデーションエラー対応

```typescript
function displayValidationErrors(error: any) {
  if (error.validation_errors) {
    const messages = error.validation_errors
      .map(ve => `${ve.field}: ${ve.message}`)
      .join('\n');
    alert(`入力エラー:\n${messages}`);
  } else {
    alert(error.message);
  }
}
```

## プロジェクトAPI実装例

### プロジェクト一覧取得

```typescript
async function fetchProjects(): Promise<Project[]> {
  try {
    return await apiCall<Project[]>('/api/projects');
  } catch (error) {
    alert(`プロジェクト取得エラー: ${error.message}`);
    return [];
  }
}
```

### プロジェクト詳細取得

```typescript
async function fetchProject(projectId: number): Promise<Project | null> {
  try {
    return await apiCall<Project>(`/api/projects/${projectId}`);
  } catch (error) {
    if (error.message.includes('404')) {
      alert('プロジェクトが見つかりません');
    } else {
      alert(`プロジェクト取得エラー: ${error.message}`);
    }
    return null;
  }
}
```

### プロジェクト新規作成

```typescript
interface CreateProjectRequest {
  gitlab_id: number;
  name: string;
  description?: string;
  web_url: string;
  default_branch: string;
  visibility: 'public' | 'internal' | 'private';
  gitlab_created_at: string;
}

async function createProject(projectData: CreateProjectRequest): Promise<Project | null> {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 422:
          displayValidationErrors(errorData.error);
          break;
        case 409:
          alert('プロジェクトが既に存在します');
          break;
        default:
          alert(errorData.error?.message || 'エラーが発生しました');
      }
      return null;
    }
    
    const result: ApiResponse<Project> = await response.json();
    alert('プロジェクトを作成しました');
    return result.data!;
  } catch (error) {
    alert('ネットワークエラーが発生しました');
    return null;
  }
}
```

### プロジェクト更新

```typescript
interface UpdateProjectRequest {
  name?: string;
  description?: string;
  web_url?: string;
  default_branch?: string;
  visibility?: 'public' | 'internal' | 'private';
}

async function updateProject(projectId: number, updates: UpdateProjectRequest): Promise<Project | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 422) {
        displayValidationErrors(errorData.error);
      } else {
        alert(errorData.error?.message || '更新に失敗しました');
      }
      return null;
    }
    
    const result: ApiResponse<Project> = await response.json();
    alert('プロジェクトを更新しました');
    return result.data!;
  } catch (error) {
    alert('ネットワークエラーが発生しました');
    return null;
  }
}
```

### プロジェクト削除

```typescript
async function deleteProject(projectId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 204) {
      // 削除成功（存在しない場合も含む - 冪等性）
      alert('プロジェクトを削除しました');
      return true;
    } else {
      const errorData = await response.json();
      alert(errorData.error?.message || '削除に失敗しました');
      return false;
    }
  } catch (error) {
    alert('ネットワークエラーが発生しました');
    return false;
  }
}
```

## ベストプラクティス

### 1. 統一されたエラーハンドリング

すべてのAPI呼び出しで一貫したエラーハンドリングパターンを使用：

```typescript
class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(response.status, errorData.error?.message || 'Unknown error');
      }
      
      // 204 No Content の場合は null を返す
      if (response.status === 204) {
        return null as T;
      }
      
      const result: ApiResponse<T> = await response.json();
      return result.data!;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new ApiError(0, 'ネットワーク接続に失敗しました');
      }
      throw error;
    }
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 2. TypeScript厳密モード対応

```typescript
// 型安全性を確保
interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

class TypeSafeApiClient {
  constructor(private options: ApiClientOptions = {}) {}
  
  async getProjects(): Promise<Project[]> {
    const projects = await this.request<Project[]>('/api/projects');
    return projects || [];
  }
  
  async getProject(id: number): Promise<Project | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid project ID');
    }
    return this.request<Project>(`/api/projects/${id}`);
  }
}
```

### 3. React Hook実装例

```typescript
import { useState, useEffect } from 'react';

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  const createProject = async (data: CreateProjectRequest) => {
    const project = await createProject(data);
    if (project) {
      setProjects(prev => [...prev, project]);
    }
    return project;
  };
  
  return { projects, loading, error, createProject };
}
```

## 環境別設定

```typescript
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000/api',
  },
  production: {
    baseUrl: 'https://api.gitlab-analyzer.example.com',
  }
};

const apiConfig = API_CONFIG[process.env.NODE_ENV as keyof typeof API_CONFIG] || API_CONFIG.development;
```
# TaskManager 设计文档

## 问题
当前各阶段的任务（综述生成、文献检索等）依赖组件生命周期。切换阶段时组件卸载，任务中断或结果丢失。

## 解决方案
引入后台任务队列系统，任务独立于 UI 运行，状态持久化到项目 stageData。

## 架构

### 1. TaskManager Context (`src/lib/academic/TaskManager.tsx`)

```tsx
interface Task {
  id: string;
  type: 'review_generate' | 'literature_search' | 'outline_generate' | 'writing_generate';
  stage: string;  // 所属阶段
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;  // 0-100
  result?: unknown;  // 任务结果
  error?: string;
  startedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;  // 任务参数
}

interface TaskManagerContextType {
  tasks: Task[];
  submitTask: (type: string, stage: string, metadata: Record<string, unknown>) => string;
  getTask: (id: string) => Task | undefined;
  getStageTasks: (stage: string) => Task[];
  cancelTask: (id: string) => void;
  clearCompleted: (stage: string) => void;
}
```

### 2. 任务执行器 (`src/lib/academic/task-runners.ts`)

每种任务类型有对应的执行函数：

```tsx
const TASK_RUNNERS: Record<string, TaskRunner> = {
  review_generate: async (metadata, onProgress) => {
    // 调用 /api/academic/review，流式接收结果
    // onProgress 更新进度
    // 返回最终结果
  },
  literature_search: async (metadata, onProgress) => {
    // 调用 /api/academic/search
  },
  outline_generate: async (metadata, onProgress) => {
    // 调用 /api/academic/writing
  },
};
```

### 3. 持久化策略

- 任务提交时：写入 stageData.tasks
- 任务进度更新时：更新 stageData.tasks[id].progress
- 任务完成时：更新 stageData.tasks[id].status + result
- 页面加载时：从 stageData 恢复任务状态

注意：任务执行器在内存中运行，持久化只保存状态快照。
页面刷新后，running 状态的任务会变成 failed（因为执行器已丢失）。
但 completed 的任务结果可以恢复。

### 4. UI 组件

#### TaskIndicator (`src/components/academic/TaskIndicator.tsx`)
- 显示当前阶段的任务状态
- 进行中的任务显示进度条
- 完成的任务显示结果摘要
- 支持取消和重试

#### TaskNotification (`src/components/academic/TaskNotification.tsx`)
- 任务完成时弹出通知
- 点击跳转到对应阶段

### 5. 改造计划

#### 阶段 1：创建 TaskManager 基础框架
- [ ] 创建 TaskManager context/provider
- [ ] 创建 useTask hook
- [ ] 在项目页面包装 TaskManager provider

#### 阶段 2：改造 ReviewStage
- [ ] 将综述生成改为提交任务
- [ ] 使用 TaskIndicator 显示进度
- [ ] 支持切换阶段后恢复结果

#### 阶段 3：改造其他阶段
- [ ] WritingStage - 大纲生成
- [ ] LiteratureStage - 批量搜索

#### 阶段 4：添加全局任务通知
- [ ] TaskNotification 组件
- [ ] 任务完成时通知用户

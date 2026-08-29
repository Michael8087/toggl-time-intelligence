import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DemoProvider } from './state/DemoContext'
import { TasksPage } from './routes/TasksPage'
import { TimerPage } from './routes/TimerPage'
import { TaskDashboard } from './routes/TaskDashboard'
import { ReportsPage } from './routes/ReportsPage'
import { SummaryPage } from './routes/SummaryPage'
import { ProjectsPage } from './routes/ProjectsPage'

export default function App() {
  return (
    <DemoProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId/dashboard" element={<TaskDashboard />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </AppShell>
    </DemoProvider>
  )
}

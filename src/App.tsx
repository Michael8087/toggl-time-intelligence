import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DemoProvider } from './state/DemoContext'
import { TasksPage } from './routes/TasksPage'
import { TimerPage } from './routes/TimerPage'
import { TaskDashboard } from './routes/TaskDashboard'
import { ReportsPage } from './routes/ReportsPage'
import { SummaryPage } from './routes/SummaryPage'
import { ProjectsPage } from './routes/ProjectsPage'
import { ReasoningPage } from './routes/ReasoningPage'

/** Everything that is the product renders inside Toggl's chrome. */
function ProductLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  return (
    <DemoProvider>
      <Routes>
        {/* The written case study is about the product, so it sits beside it
            rather than inside the sidebar. */}
        <Route path="/reasoning" element={<ReasoningPage />} />

        <Route element={<ProductLayout />}>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId/dashboard" element={<TaskDashboard />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Route>
      </Routes>
    </DemoProvider>
  )
}

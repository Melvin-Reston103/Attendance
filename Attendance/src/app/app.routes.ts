import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'kiosk'
  },
  {
    path: 'kiosk',
    loadComponent: () => import('./attendance-kiosk/attendance-kiosk').then((m) => m.AttendanceKiosk)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'students'
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./admin/student-directory/student-directory').then((m) => m.StudentDirectory)
      },
      {
        path: 'attendance-logs',
        loadComponent: () =>
          import('./admin/attendance-logs/attendance-logs').then((m) => m.AttendanceLogs)
      }
    ]
  }
];

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { KioskId, LogType } from '../admin/attendance-logs/attendance-log';
import { API_BASE_URL } from './api-config';

export const ATTENDANCE_LOGS_API_URL = `${API_BASE_URL}/attendance-logs`;

/** Raw attendance scan record shape as returned by the Attendance backend REST API. */
export interface AttendanceLogDto {
  id: number;
  scanRef: string;
  studentId: string;
  logType: LogType;
  kioskId: KioskId;
  scanDate: string;
  scanTime: string;
  verified: boolean;
}

/** Payload for registering a new attendance scan (id is server-generated). */
export type NewAttendanceLogInput = Omit<AttendanceLogDto, 'id' | 'verified'> & { verified?: boolean };

@Injectable({ providedIn: 'root' })
export class AttendanceLogsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<AttendanceLogDto[]> {
    return this.http.get<AttendanceLogDto[]>(ATTENDANCE_LOGS_API_URL);
  }

  create(log: NewAttendanceLogInput): Observable<AttendanceLogDto> {
    return this.http.post<AttendanceLogDto>(ATTENDANCE_LOGS_API_URL, log);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${ATTENDANCE_LOGS_API_URL}/${id}`);
  }
}

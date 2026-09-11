import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { DEFAULT_STUDENT_PHOTO_URL, NewStudentInput, Student } from '../admin/student-directory/student';
import { API_BASE_URL } from './api-config';

/** Payload for updating an existing student's editable fields (id is immutable). */
export type UpdateStudentInput = Omit<NewStudentInput, 'id'>;

export const STUDENTS_API_URL = `${API_BASE_URL}/students`;

/** Raw student record shape as returned by the Attendance backend REST API. */
export interface StudentDto {
  id: string;
  name: string;
  photoUrl: string | null;
  course: string;
  yearSection: string;
  departmentId: Student['departmentId'];
  factionId: Student['factionId'];
  status: Student['status'];
  statusTime: string | null;
}

/** Maps a raw API student record into the view model used across the admin UI. */
export function toStudent(dto: StudentDto): Student {
  return {
    id: dto.id,
    name: dto.name,
    photoUrl: dto.photoUrl ?? DEFAULT_STUDENT_PHOTO_URL,
    course: dto.course,
    yearSection: dto.yearSection,
    departmentId: dto.departmentId,
    factionId: dto.factionId,
    status: dto.status,
    statusTime: dto.statusTime ?? undefined,
  };
}

/** Result of a bulk student creation request. */
export interface BulkCreateResult {
  created: StudentDto[];
  failed: { id: string | null; message: string }[];
}

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);

  getById(id: string): Observable<StudentDto> {
    return this.http.get<StudentDto>(`${STUDENTS_API_URL}/${encodeURIComponent(id)}`);
  }

  create(student: NewStudentInput): Observable<StudentDto> {
    return this.http.post<StudentDto>(STUDENTS_API_URL, student);
  }

  createBulk(students: readonly NewStudentInput[]): Observable<BulkCreateResult> {
    return this.http.post<BulkCreateResult>(`${STUDENTS_API_URL}/bulk`, { students });
  }

  update(id: string, student: UpdateStudentInput): Observable<StudentDto> {
    return this.http.put<StudentDto>(`${STUDENTS_API_URL}/${encodeURIComponent(id)}`, student);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${STUDENTS_API_URL}/${encodeURIComponent(id)}`);
  }
}

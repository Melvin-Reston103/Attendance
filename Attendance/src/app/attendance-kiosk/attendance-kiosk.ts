import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import jsQR from 'jsqr';
import { KIOSKS, KioskId, LogType } from '../admin/attendance-logs/attendance-log';
import { DEPARTMENTS } from '../admin/student-directory/student';
import { DEFAULT_STUDENT_PHOTO_URL } from '../admin/student-directory/student';
import { AttendanceLogsApi } from '../core/attendance-logs-api';
import { StudentDto, StudentsApi } from '../core/students-api';
import { ConfirmationModal } from './confirmation-modal/confirmation-modal';
import { AttendanceRecord } from './attendance-record';

/** Kiosk station this terminal is registered as, used to tag every scan it records. */
const KIOSK_ID: KioskId = 'gate1';
const USER_LOGGED = KIOSKS.find((kiosk) => kiosk.id === KIOSK_ID)?.label ?? KIOSK_ID;

/** How often (ms) a captured video frame is analyzed for a QR code. */
const SCAN_INTERVAL_MS = 300;

/** How long (ms) a scan error banner stays visible before clearing. */
const SCAN_ERROR_DISPLAY_MS = 3000;

/** Time-in window: 7:30 AM (inclusive) to 3:00 PM (exclusive). Time out is never allowed here. */
const TIME_IN_WINDOW_START_MINUTES = 7 * 60 + 30;
const TIME_IN_WINDOW_END_MINUTES = 15 * 60;

/** Time-out window: 3:00 PM (inclusive) to 6:00 PM (exclusive). */
const TIME_OUT_WINDOW_END_MINUTES = 18 * 60;

/** Which of the two daily scan windows (if any) a given moment falls into. */
type ScanWindow = 'time-in' | 'time-out' | 'closed';

/** Payload encoded into a student's printable QR pass (see qr-pass-modal.ts). */
interface StudentQrPayload {
  studentId: string;
  name: string;
}

/** Camera availability/permission state driving the kiosk's on-screen guidance. */
type CameraStatus = 'checking' | 'ready' | 'no-camera' | 'denied' | 'unsupported' | 'error';

function isStudentQrPayload(value: unknown): value is StudentQrPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['studentId'] === 'string'
  );
}

/** Resolves which daily scan window (morning time-in, afternoon time-out, or none) `date` falls into. */
function resolveScanWindow(date: Date): ScanWindow {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  if (minutesSinceMidnight >= TIME_IN_WINDOW_START_MINUTES && minutesSinceMidnight < TIME_IN_WINDOW_END_MINUTES) {
    return 'time-in';
  }
  if (minutesSinceMidnight >= TIME_IN_WINDOW_END_MINUTES && minutesSinceMidnight < TIME_OUT_WINDOW_END_MINUTES) {
    return 'time-out';
  }
  return 'closed';
}

@Component({
  selector: 'app-attendance-kiosk',
  imports: [ConfirmationModal],
  templateUrl: './attendance-kiosk.html',
  styleUrl: './attendance-kiosk.scss',
})
export class AttendanceKiosk {
  private readonly studentsApi = inject(StudentsApi);
  private readonly attendanceLogsApi = inject(AttendanceLogsApi);

  private readonly videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('videoElement');
  private readonly canvasElement = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasElement');

  protected readonly gateLabel = KIOSKS.find((kiosk) => kiosk.id === KIOSK_ID)?.label ?? KIOSK_ID;
  protected readonly cameraStatus = signal<CameraStatus>('checking');
  protected readonly isProcessing = signal(false);
  protected readonly scanErrorMessage = signal<string | null>(null);
  protected readonly confirmedRecord = signal<AttendanceRecord | null>(null);

  private mediaStream: MediaStream | null = null;
  private scanIntervalId: ReturnType<typeof setInterval> | null = null;
  private scanErrorTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.initCamera());
    inject(DestroyRef).onDestroy(() => this.stopCamera());
  }

  /** Detects an attached camera and, if found, starts the live QR scan loop. */
  private async initCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraStatus.set('unsupported');
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === 'videoinput');
      if (!hasCamera) {
        this.cameraStatus.set('no-camera');
        return;
      }
    } catch {
      this.cameraStatus.set('error');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch (err) {
      this.cameraStatus.set(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'error');
      return;
    }

    const video = this.videoElement().nativeElement;
    video.srcObject = this.mediaStream;
    await video.play();
    this.cameraStatus.set('ready');
    this.scanIntervalId = setInterval(() => this.scanFrame(), SCAN_INTERVAL_MS);
  }

  private stopCamera(): void {
    if (this.scanIntervalId !== null) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    if (this.scanErrorTimeoutId !== null) {
      clearTimeout(this.scanErrorTimeoutId);
    }
    for (const track of this.mediaStream?.getTracks() ?? []) {
      track.stop();
    }
    this.mediaStream = null;
  }

  /** Grabs the current video frame and looks for a decodable QR code. */
  private scanFrame(): void {
    if (this.isProcessing() || this.confirmedRecord()) {
      return;
    }
    const video = this.videoElement().nativeElement;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const canvas = this.canvasElement().nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result) {
      this.handleScan(result.data);
    }
  }

  private handleScan(payload: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      this.showScanError('Unrecognized QR pass. Please try again.');
      return;
    }
    if (!isStudentQrPayload(parsed)) {
      this.showScanError('Unrecognized QR pass. Please try again.');
      return;
    }

    this.isProcessing.set(true);
    this.studentsApi.getById(parsed.studentId).subscribe({
      next: (student) => this.verifyAndRecord(student),
      error: (err: HttpErrorResponse) => {
        this.isProcessing.set(false);
        this.showScanError(err.status === 404 ? 'Student not found in the roster.' : 'Unable to look up student.');
      },
    });
  }

  /** Enforces the twice-a-day scan rules (time-in 7:30AM-3PM, time-out 3PM-6PM) before logging. */
  private verifyAndRecord(student: StudentDto): void {
    const now = new Date();
    const window = resolveScanWindow(now);
    if (window === 'closed') {
      this.isProcessing.set(false);
      this.showScanError('Attendance scanning is only open from 7:30 AM to 6:00 PM.');
      return;
    }

    this.attendanceLogsApi.list().subscribe({
      next: (logs) => {
        const todayLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const todaysLogs = logs.filter((log) => log.studentId === student.id && log.scanDate === todayLabel);
        const hasTimeIn = todaysLogs.some((log) => log.logType === 'TIME IN');
        const hasTimeOut = todaysLogs.some((log) => log.logType === 'TIME OUT');

        if (window === 'time-in') {
          if (hasTimeIn) {
            this.isProcessing.set(false);
            this.showScanError('Already timed in for today.');
            return;
          }
          this.recordAttendance(student, 'TIME IN', now);
          return;
        }

        if (hasTimeOut) {
          this.isProcessing.set(false);
          this.showScanError('Already timed out for today.');
          return;
        }
        if (!hasTimeIn) {
          this.isProcessing.set(false);
          this.showScanError('No time-in record found for today. Time out not allowed.');
          return;
        }
        this.recordAttendance(student, 'TIME OUT', now);
      },
      error: () => {
        this.isProcessing.set(false);
        this.showScanError('Unable to verify attendance records. Please try again.');
      },
    });
  }

  private recordAttendance(student: StudentDto, logType: LogType, now: Date): void {
    const scanRef = `SCN-${now.getTime().toString(36).toUpperCase()}`;

    this.attendanceLogsApi
      .create({
        scanRef,
        studentId: student.id,
        logType,
        kioskId: KIOSK_ID,
        userLogged: USER_LOGGED,
        scanDate: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        scanTime: now.toLocaleTimeString('en-US'),
      })
      .subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.confirmedRecord.set({
            studentName: student.name,
            studentId: student.id,
            photoUrl: student.photoUrl ?? DEFAULT_STUDENT_PHOTO_URL,
            department:
              DEPARTMENTS.find((department) => department.id === student.departmentId)?.label ??
              student.departmentId,
            courseYear: `${student.course} - ${student.yearSection}`,
            section: student.yearSection,
            eventName: 'Intramurals 2026',
            scheduleLabel: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            gate: this.gateLabel,
            mode: logType,
            timestamp: now.toLocaleTimeString('en-US'),
          });
        },
        error: () => {
          this.isProcessing.set(false);
          this.showScanError('Unable to record attendance. Please try again.');
        },
      });
  }

  private showScanError(message: string): void {
    this.scanErrorMessage.set(message);
    if (this.scanErrorTimeoutId !== null) {
      clearTimeout(this.scanErrorTimeoutId);
    }
    this.scanErrorTimeoutId = setTimeout(() => this.scanErrorMessage.set(null), SCAN_ERROR_DISPLAY_MS);
  }

  protected retryCamera(): void {
    this.cameraStatus.set('checking');
    void this.initCamera();
  }

  protected onConfirmNext(): void {
    this.confirmedRecord.set(null);
  }

  protected onPrintSlip(): void {
    window.print();
  }
}

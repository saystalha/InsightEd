/**
 * Notification engine and storage utilities for InsightEd.
 * Supports role-based filtering (Student, Teacher, Admin),
 * persistent read-state tracking via localStorage, and multi-page notification feeds.
 *
 * Designed exclusively for core functional notifications:
 * - Student: ONLY live classes from their assigned teacher & their enrollment links.
 * - Teacher: Their own active classroom sessions & student enrollment updates (no noisy per-student engagement alerts).
 * - Admin: Key administrative actions & campus session oversight.
 */

export function getNotificationStorageKey(user) {
  if (!user) return 'insighted_read_notifs_guest';
  return `insighted_read_notifs_${user._id || user.email || 'user'}`;
}

export function getStoredReadIds(user) {
  if (typeof window === 'undefined') return [];
  try {
    const key = getNotificationStorageKey(user);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading stored notification read IDs:', e);
    return [];
  }
}

export function storeReadIds(user, ids) {
  if (typeof window === 'undefined') return;
  try {
    const key = getNotificationStorageKey(user);
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(
      new CustomEvent('insighted_notifs_updated', {
        detail: { key, ids },
      })
    );
  } catch (e) {
    console.error('Error saving stored notification read IDs:', e);
  }
}

export function clearStoredReadIds(user) {
  if (typeof window === 'undefined') return;
  try {
    const key = getNotificationStorageKey(user);
    localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent('insighted_notifs_updated', {
        detail: { key, ids: [] },
      })
    );
  } catch (e) {
    console.error('Error clearing stored notification read IDs:', e);
  }
}

/**
 * Builds the filtered list of notifications tailored specifically to the user's role:
 *
 * - Student: ONLY notifications for their linked assigned teacher, meeting activities
 *   started by their teacher, and course enrollment status.
 *
 * - Teacher: Active classroom sessions hosted by this teacher and new student enrollments.
 *   (No per-student engagement/attention drop notifications).
 *
 * - Admin: Campus-wide live meeting summaries and key system administrative events.
 */
export function buildNotificationItems({
  role = 'student',
  user = null,
  activeMeetings = [],
  pastMeetings = [],
  auditLogs = [],
}) {
  const items = [];
  const assignedTeacher = user?.teacher || null;
  const currentUserName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
    : '';
  const currentUserId = user?._id ? user._id.toString() : '';

  // ─────────────────────────────────────────────
  // 1. STUDENT NOTIFICATIONS
  // ─────────────────────────────────────────────
  if (role === 'student') {
    const isMyTeacherMeeting = (m) => {
      if (!assignedTeacher) return false;
      const tId = assignedTeacher._id ? assignedTeacher._id.toString() : '';
      const mTId = m.teacherId ? m.teacherId.toString() : '';
      if (tId && mTId && tId === mTId) return true;

      const teacherFullName = `${assignedTeacher.firstName || ''} ${assignedTeacher.lastName || ''}`
        .trim()
        .toLowerCase();
      const mTeacherName = (m.teacherName || '').trim().toLowerCase();
      if (
        teacherFullName &&
        mTeacherName &&
        (mTeacherName === teacherFullName ||
          mTeacherName.includes(teacherFullName) ||
          teacherFullName.includes(mTeacherName))
      ) {
        return true;
      }
      return false;
    };

    if (assignedTeacher) {
      // (a) Active live meetings started by the student's assigned teacher
      const myTeacherActiveMeetings = activeMeetings.filter(isMyTeacherMeeting);
      myTeacherActiveMeetings.forEach((m) => {
        items.push({
          id: `student-live-${m._id || m.code}`,
          category: 'Live Class',
          tone: 'info',
          title: `${m.title} is live now`,
          description: `Prof. ${m.teacherName} started the classroom session. Access Code: ${m.code}`,
          time: 'Active Now',
          href: `/dashboard/classroom/${m.code}?role=student`,
          actionLabel: 'Join Class',
        });
      });

      // (b) Course Mapping confirmation
      items.push({
        id: `student-mapping-${assignedTeacher._id || assignedTeacher.email}`,
        category: 'Academic Link',
        tone: 'success',
        title: `Enrolled in ${user?.mappedSubject || 'Academic Course'}`,
        description: `Linked with Prof. ${assignedTeacher.firstName} ${assignedTeacher.lastName} (${assignedTeacher.department || 'Faculty Department'})`,
        time: 'Active',
        targetTab: 'nav-reports',
        actionLabel: 'View Progress',
      });
    } else {
      // (c) Advisory notice when student has no teacher mapped yet
      items.push({
        id: 'student-no-teacher-advisory',
        category: 'Academic Advisory',
        tone: 'warning',
        title: 'No Instructor Assigned',
        description:
          'You are not yet assigned to an instructor or course. Please contact administration.',
        time: 'Pending',
        targetTab: 'nav-settings',
        actionLabel: 'Check Settings',
      });
    }
  }

  // ─────────────────────────────────────────────
  // 2. TEACHER NOTIFICATIONS
  // ─────────────────────────────────────────────
  else if (role === 'teacher') {
    const isThisTeacherMeeting = (m) => {
      const mTId = m.teacherId ? m.teacherId.toString() : '';
      if (currentUserId && mTId && currentUserId === mTId) return true;
      const mName = (m.teacherName || '').trim().toLowerCase();
      if (
        currentUserName &&
        mName &&
        (mName === currentUserName ||
          mName.includes(currentUserName) ||
          currentUserName.includes(mName))
      ) {
        return true;
      }
      return false;
    };

    // (a) Active meetings hosted by this teacher
    const myActiveMeetings = activeMeetings.filter(isThisTeacherMeeting);
    myActiveMeetings.forEach((m) => {
      const studentCount =
        m.participants?.filter((p) => p.role === 'student').length || 0;
      items.push({
        id: `teacher-live-${m._id || m.code}`,
        category: 'Live Classroom',
        tone: 'info',
        title: `${m.title} (${m.code}) is Live`,
        description: `${studentCount} student(s) currently connected in your room.`,
        time: 'Live Now',
        href: `/dashboard/classroom/${m.code}?role=teacher`,
        actionLabel: 'Enter Room',
      });

      (m.waitingRoom || [])
        .filter((request) => request.status === 'waiting')
        .forEach((request) => {
          items.push({
            id: `teacher-join-request-${m.code}-${request.peerId}`,
            category: 'Join Request',
            tone: 'warning',
            title: `${request.name} is requesting to join`,
            description: `Waiting for approval to enter ${m.title} (${m.code}).`,
            time: 'Waiting',
            href: `/dashboard/classroom/${m.code}?role=teacher`,
            actionLabel: 'Review Request',
          });
        });
    });

    // (b) Student roster updates (enrolled students)
    const myStudents = user?.students || [];
    if (myStudents.length > 0) {
      myStudents.slice(0, 4).forEach((st) => {
        items.push({
          id: `teacher-student-${st._id || st.email}`,
          category: 'Enrollment',
          tone: 'success',
          title: `Student Enrolled: ${st.firstName} ${st.lastName}`,
          description: `Roll: ${st.rollNumber || 'N/A'} · Course: ${st.mappedSubject || user?.subjects?.[0] || 'Enrolled Student'}`,
          time: 'Active Roster',
          targetTab: 'nav-students',
          actionLabel: 'View Roster',
        });
      });
    }

    // (c) Concluded session summaries (from past meetings)
    const myPastSessions = (pastMeetings || [])
      .filter(isThisTeacherMeeting)
      .filter((m) => !m.active)
      .slice(0, 2);

    myPastSessions.forEach((m) => {
      items.push({
        id: `teacher-past-${m._id || m.code}`,
        category: 'Session Concluded',
        tone: 'default',
        title: `Concluded: ${m.title}`,
        description: `Session ended. ${m.participants?.length || 0} participants were recorded.`,
        time: m.createdAt
          ? new Date(m.createdAt).toLocaleDateString()
          : 'Recent',
        targetTab: 'nav-meetings',
        actionLabel: 'View Details',
      });
    });
  }

  // ─────────────────────────────────────────────
  // 3. ADMIN NOTIFICATIONS
  // ─────────────────────────────────────────────
  else if (role === 'admin') {
    // (a) Key system audit events (user registered, role changed, relationship mapped/unmapped)
    auditLogs.slice(0, 6).forEach((log) => {
      const isCritical =
        log.action?.includes('DELETED') || log.action?.includes('UNMAPPED');
      const isSuccess =
        log.action?.includes('MAPPED') || log.action?.includes('CREATED');

      items.push({
        id: `admin-log-${log._id}`,
        category: log.action || 'System Event',
        tone: isCritical ? 'danger' : isSuccess ? 'success' : 'info',
        title: log.details || 'Administrative system action performed',
        description: `By ${log.performedBy || 'Administrator'}`,
        time: log.createdAt
          ? new Date(log.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Logged',
        targetTab: 'nav-logs',
        actionLabel: 'View Logs',
      });
    });

    // (b) Campus active classroom oversight
    if (activeMeetings.length > 0) {
      items.push({
        id: `admin-active-overview-${activeMeetings.length}`,
        category: 'Campus Oversight',
        tone: 'info',
        title: `${activeMeetings.length} Active Classroom Session(s)`,
        description:
          'Faculty and students are currently active in live classrooms.',
        time: 'Real-time',
        targetTab: 'nav-overview',
        actionLabel: 'Monitor Sessions',
      });
    }
  }

  return items;
}

"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


/* ── Icons ─────────────────────────────── */
function SvgIcon({ paths, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
const LogoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="10" />
    <path
      d="M8 9.5C8 8.12 9.12 7 10.5 7h3C14.88 7 16 8.12 16 9.5c0 .93-.52 1.73-1.28 2.16C15.46 12.13 16 13.05 16 14H8c0-.95.54-1.87 1.28-2.34C8.52 11.23 8 10.43 8 9.5z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

/* ── Mock data ──────────────────────────── */
const LIVE_CLASSES = [];
const UPCOMING = [];
const RECENT_SESSIONS = [];

const TEACHER_SIDEBAR = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    icon: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  },
  {
    id: "nav-meetings",
    label: "My Meetings",
    icon: [
      "M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z",
    ],
  },
  {
    id: "nav-analytics",
    label: "Analytics",
    icon: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  },
  {
    id: "nav-students",
    label: "Students",
    icon: [
      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M23 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  {
    id: "nav-attendance",
    label: "Attendance",
    icon: [
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
      "M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
      "M9 12l2 2 4-4",
    ],
  },
  {
    id: "nav-settings",
    label: "Settings",
    icon: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    ],
  },
];

const STUDENT_SIDEBAR = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    icon: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  },
  {
    id: "nav-join",
    label: "Join Class",
    icon: [
      "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",
      "M10 17 15 12 10 7",
      "M15 12H3"
    ],
  },
  {
    id: "nav-analytics",
    label: "My Analytics",
    icon: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  },
  {
    id: "nav-reports",
    label: "Reports",
    icon: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6",
      "M16 13H8",
      "M16 17H8",
      "M10 9H8"
    ],
  },
  {
    id: "nav-settings",
    label: "Settings",
    icon: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    ],
  },
];

const ADMIN_SIDEBAR = [
  {
    id: "nav-overview",
    label: "Overview Dashboard",
    icon: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  },
  {
    id: "nav-faculty",
    label: "Faculty Hub",
    icon: [
      "M12 14l9-5-9-5-9 5 9 5z", "M12 14v7", "M5.4 12.5v5c0 .6.4 1 1 1h11.2c.6 0 1-.4 1-1v-5"
    ],
  },
  {
    id: "nav-enrollment",
    label: "Academic Enrollment",
    icon: [
      "M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"
    ],
  },
  {
    id: "nav-mapping",
    label: "Relationship Engine",
    icon: [
      "M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101",
      "M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 1 0-5.656-5.656l-1.1 1.1"
    ],
  },
  {
    id: "nav-logs",
    label: "System Audit Logs",
    icon: [
      "M12 20h9", "M5 12h14", "M5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
    ],
  },
  {
    id: "nav-settings",
    label: "Settings",
    icon: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    ],
  },
];

/* ── Shared Sidebar ─────────────────────── */
function Sidebar({ open, setOpen, active, setActive, role, setRole, actualRole, onLogout, userName = "Jane Doe", userEmail = "jane.doe@insighted.com", initials = "JD" }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const items = role === "admin" ? ADMIN_SIDEBAR : role === "teacher" ? TEACHER_SIDEBAR : STUDENT_SIDEBAR;

  return (
    <aside
      id="app-sidebar"
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 glass-sidebar ${open ? "w-[248px]" : "w-[68px]"}`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 border-b border-[rgba(196,124,62,0.16)] flex-shrink-0 ${open ? "px-5 py-5" : "justify-center px-3 py-5"}`}
      >
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(196,124,62,0.15)",
            border: "1px solid rgba(196,124,62,0.30)",
          }}
        >
          <LogoIcon />
        </div>
        {open && (
          <span className="font-black text-[1.05rem] tracking-tight whitespace-nowrap">
            <span style={{color:'#c47c3e'}}>IN</span><span style={{color:'#f2f2f2'}}>sightEd</span>
          </span>
        )}
      </div>

      {/* Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setOpen(!open)}
        className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full flex items-center justify-center z-10"
        style={{
          background: "#152038",
          border: "1.5px solid rgba(196,124,62,0.35)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.40)",
          color: "#c47c3e",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`}
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => setActive(item.id)}
              className={`relative flex items-center gap-3 rounded-xl transition-all group text-left ${open ? "px-3 py-2.5" : "w-10 h-10 mx-auto justify-center"}`}
              style={{
                background: isActive ? "rgba(196,124,62,0.16)" : "transparent",
                color: isActive ? "#f8f4ee" : "rgba(242,242,242,0.45)",
              }}
              onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background="rgba(196,124,62,0.10)"; e.currentTarget.style.color="rgba(242,242,242,0.75)"; }}}
              onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(242,242,242,0.45)"; }}}
            >
              <span className="flex-shrink-0" style={{color: isActive ? "#c47c3e" : "rgba(196,124,62,0.50)"}}>
                <SvgIcon paths={item.icon} size={18} />
              </span>
              {open && (
                <span className="text-[0.87rem] font-semibold whitespace-nowrap" style={{color: isActive ? "#f2f2f2" : "rgba(242,242,242,0.50)"}}>  
                  {item.label}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{background:"#c47c3e"}} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div
        className="relative px-2.5 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(196,124,62,0.12)" }}
      >
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center gap-3 rounded-xl p-2.5 cursor-pointer text-left transition-all ${!open ? "justify-center" : ""}`}
          style={{}} 
          onMouseEnter={e => e.currentTarget.style.background = "rgba(196,124,62,0.10)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#f2f2f2] text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}
          >
            {initials}
          </div>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[0.83rem] font-bold truncate text-[#f2f2f2]">
                  {userName}
                </p>
                <p className="text-[0.72rem] truncate capitalize text-[rgba(196,124,62,0.70)]">
                  {role} · Active
                </p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mist flex-shrink-0">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </>
          )}
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDropdownOpen(false)} />
            <div
              className={`absolute z-50 p-1.5 flex flex-col gap-0.5 animate-modal-in ${
                open 
                  ? "bottom-[76px] left-2.5 right-2.5" 
                  : "bottom-3 left-[72px] w-52"
              }`}
              style={{
                background: "rgba(21, 32, 56, 0.98)",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(196, 124, 62, 0.25)",
                boxShadow: "0 10px 32px rgba(0,0,0,0.50)",
                borderRadius: "14px"
              }}
            >
              <div className="px-3 py-2 border-b border-[rgba(196,124,62,0.12)] mb-1">
                <p className="text-[0.82rem] font-bold text-snow">{userName}</p>
                <p className="text-[0.72rem] text-mist truncate">{userEmail}</p>
                <span className="inline-block mt-1 text-[0.62rem] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded badge-copper capitalize">
                  {role}
                </span>
              </div>
              
              <button
                onClick={() => {
                  alert("Profile settings feature coming soon!");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
              >
                <SvgIcon paths={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} size={13} />
                My Profile
              </button>
              
              {actualRole === "admin" ? (
                <>
                  {role !== "admin" && (
                    <button
                      onClick={() => {
                        setRole("admin");
                        try { localStorage.setItem('userRole', 'admin'); } catch (e) {}
                        setActive("nav-overview");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                    >
                      <SvgIcon paths={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} size={13} />
                      Switch to Admin View
                    </button>
                  )}
                  {role !== "teacher" && (
                    <button
                      onClick={() => {
                        setRole("teacher");
                        try { localStorage.setItem('userRole', 'teacher'); } catch (e) {}
                        setActive("nav-dashboard");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                    >
                      <SvgIcon paths={["M4 4h16v16H4z", "M12 8v8M8 12h8"]} size={13} />
                      Switch to Teacher View
                    </button>
                  )}
                  {role !== "student" && (
                    <button
                      onClick={() => {
                        setRole("student");
                        try { localStorage.setItem('userRole', 'student'); } catch (e) {}
                        setActive("nav-dashboard");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                    >
                      <SvgIcon paths={["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"]} size={13} />
                      Switch to Student View
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    const nextRole = role === "teacher" ? "student" : "teacher";
                    setRole(nextRole);
                    try {
                      localStorage.setItem('userRole', nextRole);
                    } catch (e) {}
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                >
                  <SvgIcon paths={["M4 4h16v16H4z", "M12 8v8M8 12h8"]} size={13} />
                  Switch to {role === "teacher" ? "Student" : "Teacher"} View
                </button>
              )}
              
              <div className="h-px bg-[rgba(196,124,62,0.12)] my-1" />
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <SvgIcon paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} size={13} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/* ── Score Badge ────────────────────────── */
function ScoreBadge({ score }) {
  const color = score >= 80 ? "#d4924e" : score >= 65 ? "#c47c3e" : "#8c5828";
  return (
    <span
      className="text-[0.78rem] font-bold px-2 py-0.5 rounded-full badge-copper"
      style={{ color }}
    >
      {score}%
    </span>
  );
}

/* ── Dashboard Page ─────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [role, setRole] = useState("teacher"); // 'teacher' | 'student'
  const [userName, setUserName] = useState("Jane Doe");
  const [userEmail, setUserEmail] = useState("jane.doe@insighted.com");
  const [loading, setLoading] = useState(true);

  // Admin Dashboard extra states
  const [activeTab, setActiveTab] = useState("nav-dashboard");
  const [actualRole, setActualRole] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [crudError, setCrudError] = useState("");
  const [crudSuccess, setCrudSuccess] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedTeacherForStudent, setSelectedTeacherForStudent] = useState(null);
  const [addStudentForm, setAddStudentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rollNumber: "",
    degreeBatch: "",
    mappedSubject: "",
  });
  const [assignedTeacher, setAssignedTeacher] = useState(null);
  const [assignedSubject, setAssignedSubject] = useState("");
  const [myStudents, setMyStudents] = useState([]);
  const [crudForm, setCrudForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    subjects: "",
    rollNumber: "",
    degreeBatch: "",
  });

  const [activeMeetings, setActiveMeetings] = useState([]);
  const [teacherMeetings, setTeacherMeetings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [selectedAttendanceMeetingId, setSelectedAttendanceMeetingId] = useState("");

  const fetchActiveMeetings = async () => {
    try {
      const res = await fetch('/api/classroom');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveMeetings(data.meetings);
        }
      }
    } catch (e) {
      console.error('Error fetching active meetings:', e);
    }
  };

  const fetchTeacherMeetings = async (tName) => {
    const currentName = tName || userName;
    if (!currentName || currentName === "Jane Doe") return;
    try {
      const res = await fetch(`/api/classroom?all=true&teacherName=${encodeURIComponent(currentName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTeacherMeetings(data.meetings);
        }
      }
    } catch (e) {
      console.error('Error fetching teacher meetings:', e);
    }
  };

  const fetchStudentMeetings = async (sName) => {
    const currentName = sName || userName;
    if (!currentName || currentName === "Jane Doe") return;
    try {
      const res = await fetch("/api/classroom?all=true");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const studentSessions = data.meetings.filter(m =>
            m.participants.some(p => p.name === currentName)
          );
          setTeacherMeetings(studentSessions);
        }
      }
    } catch (e) {
      console.error('Error fetching student meetings:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuditLogs(data.logs);
        }
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/admin/relationships');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRelationships(data.relationships);
        }
      }
    } catch (e) {
      console.error('Error fetching relationships:', e);
    }
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.replace('/login');
            }
          }, 300);
          return;
        }

        const data = await response.json();
        if (data.authenticated && data.user) {
          const user = data.user;
          const fullName = `${user.firstName} ${user.lastName}`;
          setUserName(fullName);
          setUserEmail(user.email);
          setActualRole(user.role);
          setAssignedTeacher(user.teacher || null);
          setAssignedSubject(user.mappedSubject || "");
          setMyStudents(user.students || []);
          
          const savedRole = localStorage.getItem('userRole');
          if (savedRole && (savedRole === 'teacher' || savedRole === 'student' || savedRole === 'admin')) {
            setRole(savedRole);
          } else {
            setRole(user.role);
            localStorage.setItem('userRole', user.role);
          }
          
          localStorage.setItem('userName', fullName);
          localStorage.setItem('userEmail', user.email);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  useEffect(() => {
    if (actualRole === 'admin') {
      const timer = setTimeout(() => {
        fetchUsers();
        fetchActiveMeetings();
        fetchAuditLogs();
        fetchRelationships();
      }, 0);
      
      const interval = setInterval(() => {
        fetchActiveMeetings();
        fetchAuditLogs();
      }, 10000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [actualRole]);

  useEffect(() => {
    if (role === 'teacher' && userName !== "Jane Doe") {
      fetchTeacherMeetings(userName);
      fetchActiveMeetings();
      
      const interval = setInterval(() => {
        fetchTeacherMeetings(userName);
        fetchActiveMeetings();
      }, 10000);
      
      return () => clearInterval(interval);
    } else if (role === 'student' && userName !== "Jane Doe") {
      fetchStudentMeetings(userName);
      fetchActiveMeetings();
      
      const interval = setInterval(() => {
        fetchStudentMeetings(userName);
        fetchActiveMeetings();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [role, userName]);

  useEffect(() => {
    if (activeTab === 'nav-join') {
      router.push('/dashboard/join-meeting');
      setActiveTab('nav-dashboard');
    }
  }, [activeTab, router]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crudForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to create user");
        return;
      }
      if (data.emailSent === false) {
        setCrudSuccess(`User created successfully, but credentials email failed to send: ${data.emailError || "SMTP connection issue"}`);
      } else {
        setCrudSuccess("User created successfully!");
      }
      setIsCreateModalOpen(false);
      setCrudForm({ firstName: "", lastName: "", email: "", password: "", role: "student" });
      fetchUsers();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addStudentForm,
          role: "student",
          teacher: selectedTeacherForStudent._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to create and map student");
        return;
      }
      if (data.emailSent === false) {
        setCrudSuccess(`Student ${addStudentForm.firstName} ${addStudentForm.lastName} created and mapped to Teacher ${selectedTeacherForStudent.firstName} ${selectedTeacherForStudent.lastName} successfully, but credentials email failed to send: ${data.emailError || "SMTP connection issue"}`);
      } else {
        setCrudSuccess(`Student ${addStudentForm.firstName} ${addStudentForm.lastName} created and mapped to Teacher ${selectedTeacherForStudent.firstName} ${selectedTeacherForStudent.lastName} successfully!`);
      }
      setIsAddStudentModalOpen(false);
      setAddStudentForm({ firstName: "", lastName: "", email: "", password: "", rollNumber: "", degreeBatch: "", mappedSubject: "" });
      setSelectedTeacherForStudent(null);
      fetchUsers();
      fetchRelationships();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: crudForm.firstName,
          lastName: crudForm.lastName,
          email: crudForm.email,
          role: crudForm.role,
          password: crudForm.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to update user");
        return;
      }
      setCrudSuccess("User updated successfully!");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setCrudForm({ firstName: "", lastName: "", email: "", password: "", role: "student" });
      fetchUsers();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleDeleteUser = async () => {
    setCrudError("");
    setCrudSuccess("");
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to delete user");
        return;
      }
      setCrudSuccess("User deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleMapRelationship = async (e) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");
    
    if (!selectedStudentId || !selectedTeacherId || !selectedSubject) {
      setCrudError("Please select a student, a teacher, and a course/subject.");
      return;
    }
    
    try {
      const res = await fetch("/api/admin/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          teacherId: selectedTeacherId,
          subject: selectedSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to map relationship");
        return;
      }
      setCrudSuccess("Student mapped successfully!");
      setSelectedStudentId("");
      setSelectedTeacherId("");
      setSelectedSubject("");
      fetchRelationships();
      fetchUsers();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleUnmapRelationship = async (studentId) => {
    setCrudError("");
    setCrudSuccess("");
    
    try {
      const res = await fetch(`/api/admin/relationships?studentId=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setCrudError(data.error || "Failed to remove mapping");
        return;
      }
      setCrudSuccess("Relationship unmapped successfully!");
      fetchRelationships();
      fetchUsers();
    } catch (err) {
      setCrudError("An error occurred. Please try again.");
    }
  };

  const handleEndMeeting = async (meetingCode) => {
    if (!confirm("Are you sure you want to end this classroom session? This will disconnect all students.")) return;
    try {
      const res = await fetch(`/api/classroom/${meetingCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Session ended successfully!");
        fetchTeacherMeetings(userName);
        fetchActiveMeetings();
      } else {
        alert(data.error || "Failed to end meeting session");
      }
    } catch (err) {
      console.error("Error ending meeting:", err);
      alert("An error occurred. Please try again.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchStr = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-bg text-snow relative overflow-hidden">
        {/* Background Orbs */}
        <div className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-copper" />
        <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy" />
        
        <div className="relative z-10 flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-[3px] border-[rgba(196,124,62,0.15)] border-t-[#c47c3e] animate-spin" />
          <p className="text-[0.9rem] font-semibold text-mist tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "JD";

  const firstName = userName.split(" ")[0] || "Jane";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout API error:', e);
    }
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('localStorage clear error:', e);
    }
    window.location.href = "/login";
  };

  // Dynamic stats calculation for teacher
  const totalSessions = teacherMeetings.length;
  const activeTeacherMeetings = teacherMeetings.filter(m => m.active);
  const endedTeacherMeetings = teacherMeetings.filter(m => !m.active);
  const avgEngagement = teacherMeetings.length > 0
    ? Math.round(teacherMeetings.reduce((sum, m) => sum + (m.cfi || 75), 0) / teacherMeetings.length)
    : 78;

  let fatigueAlertsCount = 0;
  activeTeacherMeetings.forEach(m => {
    fatigueAlertsCount += m.participants.filter(p => p.role === 'student' && p.score < 65).length;
  });
  if (fatigueAlertsCount === 0 && activeTeacherMeetings.length > 0) {
    fatigueAlertsCount = 1; // simulation fallback when session is active
  }

  const teacherStats = [
    {
      id: "stat-sessions",
      label: "Total Sessions",
      value: totalSessions.toString(),
      delta: activeTeacherMeetings.length > 0 ? `${activeTeacherMeetings.length} sessions active` : "No active sessions",
      icon: ["M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"],
    },
    {
      id: "stat-engagement",
      label: "Avg Engagement",
      value: `${avgEngagement}%`,
      delta: endedTeacherMeetings.length > 0 ? "Based on recent sessions" : "Platform average",
      icon: ["M22 12h-4l-3 9L9 3l-3 9H2"],
    },
    {
      id: "stat-alerts",
      label: "Fatigue Alerts",
      value: fatigueAlertsCount.toString(),
      delta: fatigueAlertsCount > 0 ? "Requires attention" : "All classrooms stable",
      icon: ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
    },
    {
      id: "stat-students",
      label: "Students Active",
      value: myStudents.length.toString(),
      delta: myStudents.length === 1 ? "1 student assigned" : `${myStudents.length} students assigned`,
      icon: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    },
  ];

  // Dynamic stats calculation for student
  const studentAttendedCount = teacherMeetings.length;
  let studentAvgScoreSum = 0;
  teacherMeetings.forEach(m => {
    const p = m.participants.find(part => part.name === userName);
    studentAvgScoreSum += p ? p.score : 75;
  });
  const studentAvgScore = studentAttendedCount > 0 ? Math.round(studentAvgScoreSum / studentAttendedCount) : 80;

  const studentStats = [
    {
      id: "stat-attended",
      label: "Classes Attended",
      value: studentAttendedCount.toString(),
      delta: studentAttendedCount === 1 ? "1 session attended" : `${studentAttendedCount} sessions attended`,
      icon: ["M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"],
    },
    {
      id: "stat-my-engagement",
      label: "Avg Engagement Score",
      value: `${studentAvgScore}%`,
      delta: studentAttendedCount > 0 ? "Real-time attention index" : "Baseline projection",
      icon: ["M22 12h-4l-3 9L9 3l-3 9H2"],
    },
    {
      id: "stat-completed",
      label: "Tasks Completed",
      value: studentAttendedCount > 0 ? "100%" : "0%",
      delta: "Class participation logs",
      icon: ["M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2", "M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2", "M9 12l2 2 4-4"],
    },
    {
      id: "stat-study-time",
      label: "Total Study Time",
      value: `${studentAttendedCount * 45}m`,
      delta: "Monitored class length",
      icon: ["M12 8v4l3 3", "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"],
    },
  ];

  const adminStats = [
    {
      id: "stat-users",
      label: "Total Users",
      value: users.length.toString(),
      delta: "Active MongoDB Records",
      icon: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    },
    {
      id: "stat-teachers",
      label: "Teachers Active",
      value: users.filter(u => u.role === "teacher").length.toString(),
      delta: "Facilitators Registered",
      icon: ["M12 14l9-5-9-5-9 5 9 5z", "M12 14v7", "M5.4 12.5v5c0 .6.4 1 1 1h11.2c.6 0 1-.4 1-1v-5"],
    },
    {
      id: "stat-students",
      label: "Students Registered",
      value: users.filter(u => u.role === "student").length.toString(),
      delta: "Learners Engaged",
      icon: ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"],
    },
    {
      id: "stat-admins",
      label: "Administrators",
      value: users.filter(u => u.role === "admin").length.toString(),
      delta: "System Controllers",
      icon: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
    },
  ];

  return (
    <div
      className="min-h-screen flex dashboard-bg text-snow"
    >
      {/* Orbs */}
      <div
        className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none orb-copper"
      />
      <div
        className="fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full pointer-events-none orb-navy"
      />

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        active={activeTab}
        setActive={setActiveTab}
        role={role}
        setRole={setRole}
        actualRole={actualRole}
        onLogout={handleLogout}
        userName={userName}
        userEmail={userEmail}
        initials={initials}
      />

      <main
        className={`flex-1 transition-all duration-300 min-h-screen ${sidebarOpen ? "ml-[248px]" : "ml-[68px]"}`}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 glass-topbar"
        >
          <div>
            <h1 className="text-[1.3rem] font-black text-snow">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="text-[0.8rem] text-mist">
              Wednesday, 21 May 2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.16)] transition-all"
              style={{ border: "1px solid rgba(196,124,62,0.26)" }}
            >
              <SvgIcon
                paths={[
                  "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
                  "M13.73 21a2 2 0 0 1-3.46 0",
                ]}
                size={17}
              />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c47c3e]" />
            </button>
            <div className="relative">
              <button
                id="header-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#f2f2f2] text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-[0_0_12px_rgba(196,124,62,0.4)] focus:outline-none"
                style={{
                  background: "linear-gradient(135deg,#c47c3e,#152038)",
                  border: userDropdownOpen ? "2.5px solid #c47c3e" : "1.5px solid rgba(196,124,62,0.3)",
                }}
              >
                {initials}
              </button>
              
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setUserDropdownOpen(false)} />
                  <div 
                    className="absolute right-0 mt-2.5 w-56 rounded-[16px] z-50 p-1.5 flex flex-col gap-0.5 animate-modal-in"
                    style={{
                      background: "rgba(21, 32, 56, 0.98)",
                      backdropFilter: "blur(20px)",
                      border: "1.5px solid rgba(196, 124, 62, 0.25)",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.60)"
                    }}
                  >
                    <div className="px-3 py-2 border-b border-[rgba(196,124,62,0.12)] mb-1">
                      <p className="text-[0.82rem] font-bold text-snow">{userName}</p>
                      <p className="text-[0.72rem] text-mist truncate">{userEmail}</p>
                      <span className="inline-block mt-1 text-[0.62rem] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded badge-copper capitalize">
                        {role}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        alert("Profile settings feature coming soon!");
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                    >
                      <SvgIcon paths={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} size={13} />
                      My Profile
                    </button>
                    
                    {actualRole === "admin" ? (
                      <>
                        {role !== "admin" && (
                          <button
                            onClick={() => {
                              setRole("admin");
                              try { localStorage.setItem('userRole', 'admin'); } catch (e) {}
                              setUserDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                          >
                            <SvgIcon paths={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} size={13} />
                            Switch to Admin View
                          </button>
                        )}
                        {role !== "teacher" && (
                          <button
                            onClick={() => {
                              setRole("teacher");
                              try { localStorage.setItem('userRole', 'teacher'); } catch (e) {}
                              setUserDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                          >
                            <SvgIcon paths={["M4 4h16v16H4z", "M12 8v8M8 12h8"]} size={13} />
                            Switch to Teacher View
                          </button>
                        )}
                        {role !== "student" && (
                          <button
                            onClick={() => {
                              setRole("student");
                              try { localStorage.setItem('userRole', 'student'); } catch (e) {}
                              setUserDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                          >
                            <SvgIcon paths={["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"]} size={13} />
                            Switch to Student View
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const nextRole = role === "teacher" ? "student" : "teacher";
                          setRole(nextRole);
                          try {
                            localStorage.setItem('userRole', nextRole);
                          } catch (e) {}
                          setUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-mist hover:text-snow hover:bg-[rgba(196,124,62,0.12)] rounded-lg transition-all"
                      >
                        <SvgIcon paths={["M4 4h16v16H4z", "M12 8v8M8 12h8"]} size={13} />
                        Switch to {role === "teacher" ? "Student" : "Teacher"} View
                      </button>
                    )}
                    
                    <div className="h-px bg-[rgba(196,124,62,0.12)] my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-[0.78rem] text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <SvgIcon paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} size={13} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-6 animate-fadeUp">
          {role === 'admin' ? (
            activeTab === 'nav-overview' ? (
              <div className="flex flex-col gap-6 animate-fadeUp">
                {/* Header */}
                <div>
                  <h2 className="text-[1.25rem] font-black text-white">IT Super-Admin Overview</h2>
                  <p className="text-[0.8rem] text-mist font-medium">Platform-wide statistics and live academic channels.</p>
                </div>

                {/* Admin Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {adminStats.map((st) => (
                    <div key={st.id} className="relative overflow-hidden rounded-[22px] p-6 card-navy flex flex-col justify-between border border-white/[0.03]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[0.78rem] text-mist font-bold uppercase tracking-wider mb-1">{st.label}</p>
                          <p className="text-[1.8rem] font-black text-snow leading-none font-mono">{st.value}</p>
                        </div>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-snow bg-[rgba(196,124,62,0.12)] border border-[rgba(196,124,62,0.22)]">
                          <SvgIcon paths={st.icon} size={15} />
                        </span>
                      </div>
                      <p className="text-[0.7rem] text-[#c47c3e] font-semibold">{st.delta}</p>
                    </div>
                  ))}
                </div>

                {/* Active Live Classrooms */}
                <div className="flex flex-col gap-4 mt-4">
                  <h3 className="text-[1.05rem] font-extrabold text-white">Active Online Live Classrooms</h3>
                  <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                            <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Classroom Title</th>
                            <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">6-Digit Code</th>
                            <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Instructor</th>
                            <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Active Students</th>
                            <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                          {activeMeetings.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                                There are no active live sessions currently online.
                              </td>
                            </tr>
                          ) : (
                            activeMeetings.map((m) => {
                              const activeStudentsCount = m.participants.filter(p => p.role === 'student').length;
                              return (
                                <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-[0.88rem] font-bold text-white">{m.title}</div>
                                    <div className="text-[0.74rem] text-mist">{m.description || 'No description'}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 rounded bg-[rgba(196,124,62,0.15)] border border-[rgba(196,124,62,0.25)] font-mono text-[0.8rem] text-snow font-bold">
                                      {m.code}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-[0.85rem] font-semibold text-snow">{m.teacherName}</td>
                                  <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-snow">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      {activeStudentsCount} active
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/classroom/${m.code}?role=teacher`} className="btn-primary px-4 py-2 rounded-xl text-[0.78rem] font-bold inline-flex items-center gap-1">
                                      Join Meet
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'nav-faculty' ? (
              <div className="flex flex-col gap-6 animate-fadeUp">
                {/* Faculty Hub Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white">Faculty Hub</h2>
                    <p className="text-[0.8rem] text-mist font-medium">Provision teacher accounts and assign primary subjects.</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCrudForm({ firstName: "", lastName: "", email: "", password: "", role: "teacher", department: "", subjects: "", rollNumber: "", degreeBatch: "" });
                      setCrudError("");
                      setCrudSuccess("");
                      setIsCreateModalOpen(true);
                    }}
                    className="btn-primary px-5 py-3 rounded-xl font-bold text-[0.85rem] flex items-center gap-2"
                  >
                    <SvgIcon paths={["M12 5v14M5 12h14"]} size={15} />
                    Add Teacher
                  </button>
                </div>

                {/* Notifications */}
                {crudSuccess && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    ✓ {crudSuccess}
                  </div>
                )}
                {crudError && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                    ⚠ {crudError}
                  </div>
                )}

                {/* Search Bar */}
                <div className="flex p-4 rounded-2xl card-navy border border-white/[0.03]">
                  <div className="relative w-full max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-snow/30">
                      <SvgIcon paths={["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]} size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by instructor name, department or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="neu-input w-full pl-10 pr-4 py-2.5 rounded-xl text-[0.85rem] outline-none"
                    />
                  </div>
                </div>

                {/* Teachers Table */}
                <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Instructor</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Department</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Subjects</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                        {users.filter(u => u.role === 'teacher').filter(u => {
                          const search = searchQuery.toLowerCase();
                          return `${u.firstName} ${u.lastName} ${u.email} ${u.department || ''} ${u.subjects ? u.subjects.join(' ') : ''}`.toLowerCase().includes(search);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                              No teacher accounts found matching your query.
                            </td>
                          </tr>
                        ) : (
                          users.filter(u => u.role === 'teacher').filter(u => {
                            const search = searchQuery.toLowerCase();
                            return `${u.firstName} ${u.lastName} ${u.email} ${u.department || ''} ${u.subjects ? u.subjects.join(' ') : ''}`.toLowerCase().includes(search);
                          }).map((u) => (
                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-snow text-xs"
                                    style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}>
                                    {(u.firstName[0] + u.lastName[0]).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-[0.88rem] font-bold text-white">{u.firstName} {u.lastName}</div>
                                    <div className="text-[0.74rem] text-mist">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[0.85rem] font-semibold text-snow capitalize">
                                {u.department || <span className="text-mist font-normal italic">None</span>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {u.subjects && u.subjects.length > 0 ? (
                                    u.subjects.map((sub, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded text-[0.7rem] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/25">
                                        {sub}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[0.74rem] text-mist italic">No subjects assigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTeacherForStudent(u);
                                      const pregeneratedPassword = 'stud.' + Math.random().toString(36).substring(2, 7);
                                      setAddStudentForm({
                                        firstName: "",
                                        lastName: "",
                                        email: "",
                                        password: pregeneratedPassword,
                                        rollNumber: "",
                                        degreeBatch: "",
                                        mappedSubject: u.subjects && u.subjects.length > 0 ? u.subjects[0] : "",
                                      });
                                      setCrudError("");
                                      setCrudSuccess("");
                                      setIsAddStudentModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all flex items-center gap-1"
                                    title="Register student for this teacher"
                                  >
                                    <SvgIcon paths={["M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M19 11v6", "M16 14h6"]} size={14} />
                                    <span className="text-[0.72rem] font-extrabold uppercase tracking-wide">Add Student</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCrudForm({
                                        firstName: u.firstName,
                                        lastName: u.lastName,
                                        email: u.email,
                                        password: "",
                                        role: u.role,
                                        department: u.department || "",
                                        subjects: u.subjects ? u.subjects.join(", ") : "",
                                        rollNumber: "",
                                        degreeBatch: ""
                                      });
                                      setCrudError("");
                                      setCrudSuccess("");
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-mist hover:text-snow hover:bg-white/5 transition-all"
                                    title="Edit Teacher Profile"
                                  >
                                    <SvgIcon paths={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} size={15} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCrudError("");
                                      setCrudSuccess("");
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                    title="Delete Teacher"
                                  >
                                    <SvgIcon paths={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'nav-enrollment' ? (
              <div className="flex flex-col gap-6 animate-fadeUp">
                {/* Academic Enrollment Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white">Academic Enrollment</h2>
                    <p className="text-[0.8rem] text-mist font-medium">Enroll official students and assign unique academic IDs (roll numbers).</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setCrudForm({ firstName: "", lastName: "", email: "", password: "", role: "student", department: "", subjects: "", rollNumber: "", degreeBatch: "" });
                      setCrudError("");
                      setCrudSuccess("");
                      setIsCreateModalOpen(true);
                    }}
                    className="btn-primary px-5 py-3 rounded-xl font-bold text-[0.85rem] flex items-center gap-2"
                  >
                    <SvgIcon paths={["M12 5v14M5 12h14"]} size={15} />
                    Register Student
                  </button>
                </div>

                {/* Notifications */}
                {crudSuccess && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    ✓ {crudSuccess}
                  </div>
                )}
                {crudError && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                    ⚠ {crudError}
                  </div>
                )}

                {/* Search Bar */}
                <div className="flex p-4 rounded-2xl card-navy border border-white/[0.03]">
                  <div className="relative w-full max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-snow/30">
                      <SvgIcon paths={["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]} size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by student name, roll number, email, or batch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="neu-input w-full pl-10 pr-4 py-2.5 rounded-xl text-[0.85rem] outline-none"
                    />
                  </div>
                </div>

                {/* Students Table */}
                <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Student</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Roll Number</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Degree Batch</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Mapping Status</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                        {users.filter(u => u.role === 'student').filter(u => {
                          const search = searchQuery.toLowerCase();
                          return `${u.firstName} ${u.lastName} ${u.email} ${u.rollNumber || ''} ${u.degreeBatch || ''}`.toLowerCase().includes(search);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                              No student profiles found matching your query.
                            </td>
                          </tr>
                        ) : (
                          users.filter(u => u.role === 'student').filter(u => {
                            const search = searchQuery.toLowerCase();
                            return `${u.firstName} ${u.lastName} ${u.email} ${u.rollNumber || ''} ${u.degreeBatch || ''}`.toLowerCase().includes(search);
                          }).map((u) => (
                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-snow text-xs"
                                    style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}>
                                    {(u.firstName[0] + u.lastName[0]).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-[0.88rem] font-bold text-white">{u.firstName} {u.lastName}</div>
                                    <div className="text-[0.74rem] text-mist">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-[0.8rem] font-bold text-snow">
                                {u.rollNumber || <span className="text-mist font-normal italic">Unassigned</span>}
                              </td>
                              <td className="px-6 py-4 text-[0.85rem] font-semibold text-snow">{u.degreeBatch || <span className="text-mist font-normal italic">None</span>}</td>
                              <td className="px-6 py-4">
                                {u.teacher ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.78rem] font-bold text-snow">
                                      Mapped to: {u.teacher.firstName} {u.teacher.lastName}
                                    </span>
                                    <span className="text-[0.66rem] text-mist">
                                      Course: &quot;{u.mappedSubject}&quot;
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-block text-[0.68rem] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                                    No Link Set
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCrudForm({
                                        firstName: u.firstName,
                                        lastName: u.lastName,
                                        email: u.email,
                                        password: "",
                                        role: u.role,
                                        department: "",
                                        subjects: "",
                                        rollNumber: u.rollNumber || "",
                                        degreeBatch: u.degreeBatch || ""
                                      });
                                      setCrudError("");
                                      setCrudSuccess("");
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-mist hover:text-snow hover:bg-white/5 transition-all"
                                    title="Edit Student Profile"
                                  >
                                    <SvgIcon paths={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} size={15} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCrudError("");
                                      setCrudSuccess("");
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                    title="Delete Student"
                                  >
                                    <SvgIcon paths={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'nav-mapping' ? (
              <div className="flex flex-col gap-6 animate-fadeUp">
                {/* Relationship Mapping Engine */}
                <div>
                  <h2 className="text-[1.25rem] font-black text-white">Relationship Mapping Engine</h2>
                  <p className="text-[0.8rem] text-mist font-medium">Link students to their respective teachers and current subjects.</p>
                </div>

                {/* Notifications */}
                {crudSuccess && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    ✓ {crudSuccess}
                  </div>
                )}
                {crudError && (
                  <div className="px-4 py-3 rounded-xl text-[0.82rem] font-semibold text-red-400 bg-red-500/10 border border-red-500/20">
                    ⚠ {crudError}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Form section */}
                  <div className="card-navy p-6 rounded-2xl border border-white/[0.03] lg:col-span-1">
                    <h3 className="text-[0.98rem] font-extrabold text-snow mb-4">Establish Relational Link</h3>
                    <form onSubmit={handleMapRelationship} className="flex flex-col gap-4">
                      {/* Select Student */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.78rem] font-semibold text-snow/70">Select Student</label>
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow"
                          style={{ background: "#152038" }}
                        >
                          <option value="">-- Choose Student --</option>
                          {users.filter(u => u.role === 'student').map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.firstName} {s.lastName} {s.rollNumber ? `(${s.rollNumber})` : `[${s.email}]`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Teacher */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.78rem] font-semibold text-snow/70">Select Teacher</label>
                        <select
                          value={selectedTeacherId}
                          onChange={(e) => {
                            setSelectedTeacherId(e.target.value);
                            setSelectedSubject(""); // reset subject when teacher changes
                          }}
                          className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow"
                          style={{ background: "#152038" }}
                        >
                          <option value="">-- Choose Instructor --</option>
                          {users.filter(u => u.role === 'teacher').map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.firstName} {t.lastName} {t.department ? `(${t.department})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Course / Subject Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.78rem] font-semibold text-snow/70">Select Course / Subject</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          disabled={!selectedTeacherId}
                          className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "#152038" }}
                        >
                          <option value="">-- Choose Subject Tag --</option>
                          {users.find(u => u._id === selectedTeacherId)?.subjects?.map((sub, idx) => (
                            <option key={idx} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary w-full py-3.5 rounded-xl font-bold text-[0.85rem] mt-3"
                      >
                        Create Mapped Connection
                      </button>
                    </form>
                  </div>

                  {/* Table registry section */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <h3 className="text-[0.98rem] font-extrabold text-snow">Active Link Schema Matrix</h3>
                    <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Student Name</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Roll Number</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Assigned Instructor</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Subject Tag</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                            {relationships.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                                  No relational links mapped yet. Use the link builder form on the left.
                                </td>
                              </tr>
                            ) : (
                              relationships.map((rel) => (
                                <tr key={rel._id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4 text-[0.85rem] font-bold text-white">
                                    {rel.firstName} {rel.lastName}
                                  </td>
                                  <td className="px-6 py-4 font-mono text-[0.78rem] text-snow">{rel.rollNumber || 'Unassigned'}</td>
                                  <td className="px-6 py-4">
                                    <div className="text-[0.85rem] font-semibold text-snow">
                                      {rel.teacher ? `${rel.teacher.firstName} ${rel.teacher.lastName}` : 'N/A'}
                                    </div>
                                    <div className="text-[0.7rem] text-mist">
                                      {rel.teacher?.department || ''}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2.5 py-0.5 rounded text-[0.7rem] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/25">
                                      {rel.mappedSubject}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => handleUnmapRelationship(rel._id)}
                                      className="text-red-400 hover:text-red-300 text-[0.78rem] font-bold hover:underline bg-transparent border-none cursor-pointer"
                                    >
                                      Unlink
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'nav-logs' ? (
              <div className="flex flex-col gap-6 animate-fadeUp">
                {/* System Audit Logs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white">System Audit Logs</h2>
                    <p className="text-[0.8rem] text-mist font-medium">Real-time sync logs documenting platform transactions and actions.</p>
                  </div>
                  
                  <button
                    onClick={fetchAuditLogs}
                    className="btn-secondary px-4 py-2.5 rounded-xl font-bold text-[0.8rem] flex items-center gap-1.5 border border-white/10 text-snow"
                  >
                    🔄 Refresh Logs
                  </button>
                </div>

                {/* Audit Logs Table */}
                <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Action Event</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Details</th>
                          <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Triggered By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(196,124,62,0.08)] font-mono text-[0.78rem]">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium font-sans">
                              No transaction logs have been recorded in the database yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 text-mist whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block text-[0.65rem] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                                  log.action.includes('PROVISIONED') || log.action.includes('MAPPED')
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                    : log.action.includes('DELETED') || log.action.includes('UNMAPPED')
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                                      : log.action.includes('CREATED')
                                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-snow max-w-sm truncate" title={log.details}>
                                {log.details}
                              </td>
                              <td className="px-6 py-4 text-mist">
                                {log.performedBy}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'nav-settings' ? (
              <div className="card-navy rounded-[24px] p-8 border border-white/5 max-w-2xl animate-fadeUp">
                <h2 className="text-[1.2rem] font-black text-white mb-2">System Configuration</h2>
                <p className="text-[0.82rem] text-mist mb-6">Manage platform parameters and global administrative configurations.</p>
                
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                    <div>
                      <h3 className="text-[0.88rem] font-bold text-white">Database Status</h3>
                      <p className="text-[0.74rem] text-mist mt-0.5">MongoDB Atlas Connection Status</p>
                    </div>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.7rem] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      CONNECTED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                    <div>
                      <h3 className="text-[0.88rem] font-bold text-white">API Health</h3>
                      <p className="text-[0.74rem] text-mist mt-0.5">Routes & Handlers Status</p>
                    </div>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.7rem] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                    <div>
                      <h3 className="text-[0.88rem] font-bold text-white">Platform Version</h3>
                      <p className="text-[0.74rem] text-mist mt-0.5">Production Build Tag</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-[0.75rem] font-bold text-snow bg-[rgba(196,124,62,0.15)] border border-[rgba(196,124,62,0.22)] font-mono">
                      v1.0.0-release
                    </span>
                  </div>
                </div>
              </div>
            ) : null
          ) : role === 'teacher' && activeTab === 'nav-meetings' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[1.25rem] font-black text-white">My Classroom Sessions</h2>
                  <p className="text-[0.8rem] text-mist font-medium">Manage instant meetings, view summaries, and check active links.</p>
                </div>
                <Link href="/dashboard/create-meeting" className="btn-primary px-5 py-3 rounded-xl font-bold text-[0.85rem] flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Start New Meeting
                </Link>
              </div>

              <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Class Info</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Code</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">CFI Index</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Attendance</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                      {teacherMeetings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                            You have not created any meetings yet. Start a new session above!
                          </td>
                        </tr>
                      ) : (
                        teacherMeetings.map((m) => {
                          const studentParticipants = m.participants.filter(p => p.role === 'student');
                          return (
                            <Fragment key={m._id}>
                              <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="text-[0.88rem] font-bold text-white">{m.title}</div>
                                  <div className="text-[0.72rem] text-mist">{new Date(m.createdAt).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-[0.8rem] font-bold text-snow">
                                  <span className="px-2 py-0.5 rounded bg-[rgba(196,124,62,0.12)] border border-[rgba(196,124,62,0.25)] text-amber-400">
                                    {m.code}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {m.active ? (
                                    <span className="flex items-center gap-1.5 text-[0.8rem] text-emerald-400 font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-[0.8rem] text-mist font-semibold">Ended</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[0.82rem] font-bold text-snow">{m.cfi || 75}%</span>
                                </td>
                                <td className="px-6 py-4 text-[0.82rem] font-medium text-snow">
                                  {studentParticipants.length} present
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setExpandedMeetingId(expandedMeetingId === m._id ? null : m._id)}
                                      className="px-2.5 py-1.5 rounded-lg text-[0.72rem] font-extrabold uppercase tracking-wider text-mist hover:text-snow hover:bg-white/5 transition-all"
                                    >
                                      {expandedMeetingId === m._id ? "Hide Details" : "View Details"}
                                    </button>
                                    {m.active ? (
                                      <>
                                        <Link href={`/dashboard/classroom/${m.code}?role=teacher`} className="btn-primary px-3.5 py-1.5 rounded-lg text-[0.74rem] font-bold">
                                          Join
                                        </Link>
                                        <button
                                          onClick={() => handleEndMeeting(m.code)}
                                          className="px-3.5 py-1.5 rounded-lg text-[0.74rem] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                        >
                                          End
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedAttendanceMeetingId(m._id);
                                          setActiveTab("nav-attendance");
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-[0.74rem] font-bold bg-white/5 text-snow border border-white/10 hover:bg-white/10 transition-all"
                                      >
                                        Attendance
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {expandedMeetingId === m._id && (
                                <tr className="bg-white/[0.01]">
                                  <td colSpan="6" className="px-6 py-5">
                                    <div className="flex flex-col gap-5 p-5 rounded-xl border border-white/[0.04] bg-[#152038]/60 animate-slide-down">
                                      <h4 className="text-[0.9rem] font-extrabold text-[#c47c3e] border-b border-white/[0.05] pb-2">Session Details Matrix</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Participants */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Participants ({m.participants.length})</h5>
                                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto dark-scroll pr-1">
                                            {m.participants.length === 0 ? (
                                              <p className="text-[0.74rem] text-mist italic">No participants joined this session.</p>
                                            ) : (
                                              m.participants.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.03]">
                                                  <span className="text-[0.78rem] font-semibold text-snow">{p.name}</span>
                                                  <span className="text-[0.72rem] font-bold px-2 py-0.5 rounded badge-copper capitalize">{p.role} · {p.score}%</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                        {/* Chat Messages */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Chat Logs ({m.messages?.length || 0})</h5>
                                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto dark-scroll pr-1">
                                            {!m.messages || m.messages.length === 0 ? (
                                              <p className="text-[0.74rem] text-mist italic">No messages sent in this session.</p>
                                            ) : (
                                              m.messages.map((msg, idx) => (
                                                <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/[0.03] text-[0.74rem]">
                                                  <div className="flex justify-between font-bold text-snow mb-0.5">
                                                    <span>{msg.sender}</span>
                                                    <span className="text-mist text-[0.66rem]">{msg.time}</span>
                                                  </div>
                                                  <p className="text-mist">{msg.msg}</p>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                        {/* Topic Markers */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Topic Markers ({m.topicMarkers?.length || 0})</h5>
                                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto dark-scroll pr-1">
                                            {!m.topicMarkers || m.topicMarkers.length === 0 ? (
                                              <p className="text-[0.74rem] text-mist italic">No topic markers set in this session.</p>
                                            ) : (
                                              m.topicMarkers.map((marker, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/[0.02] border border-white/[0.03] text-[0.74rem]">
                                                  <span className="font-semibold text-snow">&quot;{marker.label}&quot;</span>
                                                  <span className="text-[#c47c3e] font-bold">{marker.time} · {marker.cfi}% CFI</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : role === 'teacher' && activeTab === 'nav-analytics' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div>
                <h2 className="text-[1.25rem] font-black text-white">Classroom Performance Analytics</h2>
                <p className="text-[0.8rem] text-mist font-medium">Visual indicators tracking cognitive fatigue index trends and student leaderboards.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">Average Classroom CFI</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{avgEngagement}%</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">Standard engagement baseline</span>
                </div>
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">Total Monitored Sessions</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{totalSessions}</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">MongoDB historical count</span>
                </div>
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">Assigned Active Students</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{myStudents.length}</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">Academic registry matches</span>
                </div>
              </div>

              <div className="card-navy p-6 rounded-[22px] border border-white/[0.03] flex flex-col gap-4">
                <div>
                  <h3 className="text-[0.95rem] font-bold text-white">Cognitive Fatigue Index (CFI) Historical Trend</h3>
                  <p className="text-[0.74rem] text-mist">Tracking the 5 most recent classroom sessions (oldest to newest).</p>
                </div>
                
                {teacherMeetings.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-[0.8rem] text-mist italic bg-white/[0.01] rounded-xl border border-white/5">
                    No meeting data available to display trend graphs.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 pt-4">
                    <div className="h-56 flex items-end justify-around gap-4 px-4 bg-white/[0.01] border-b border-white/[0.08] rounded-xl pb-2">
                      {teacherMeetings.slice(0, 5).reverse().map((meet) => {
                        const cfiVal = meet.cfi || 75;
                        return (
                          <div key={meet._id} className="flex-1 flex flex-col items-center gap-2 group relative">
                            <div className="absolute bottom-full mb-2 bg-[#152038] border border-[#c47c3e]/30 px-2.5 py-1 rounded text-[0.7rem] font-bold text-snow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-10">
                              {meet.title} · {cfiVal}%
                            </div>
                            <div 
                              className="w-full sm:w-16 rounded-t-lg transition-all duration-500 hover:brightness-125"
                              style={{ 
                                height: `${cfiVal}%`, 
                                background: "linear-gradient(180deg, #c47c3e 0%, #8c5828 100%)",
                                boxShadow: "0 0 15px rgba(196, 124, 62, 0.2)"
                              }}
                            />
                            <span className="text-[0.72rem] font-bold text-snow font-mono">{meet.code}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[0.7rem] text-mist px-2">
                      <span>Older Sessions</span>
                      <span>Recent Sessions</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03] flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-[0.95rem] font-bold text-white">Student Engagement Leaderboard</h3>
                  <p className="text-[0.74rem] text-mist">Average attention and cognitive fatigue index mapped across monitored classrooms.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Rank</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Student Name</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Roll Number</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Sessions Attended</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase text-right">Avg Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {(() => {
                        const studentAggregates = {};
                        teacherMeetings.forEach(m => {
                          m.participants.forEach(p => {
                            if (p.role === 'student') {
                              if (!studentAggregates[p.name]) {
                                studentAggregates[p.name] = { scores: [] };
                              }
                              studentAggregates[p.name].scores.push(p.score || 75);
                            }
                          });
                        });

                        const leaderboard = myStudents.map(s => {
                          const fullName = `${s.firstName} ${s.lastName}`;
                          const agg = studentAggregates[fullName];
                          const scores = agg ? agg.scores : [];
                          const avg = scores.length > 0
                            ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
                            : 75;
                          return {
                            name: fullName,
                            rollNumber: s.rollNumber || "N/A",
                            avgScore: avg,
                            sessionsCount: scores.length
                          };
                        }).sort((a, b) => b.avgScore - a.avgScore);

                        if (leaderboard.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="px-5 py-8 text-center text-[0.8rem] text-mist italic">
                                No mapped students found to evaluate leaderboard.
                              </td>
                            </tr>
                          );
                        }

                        return leaderboard.map((stud, idx) => {
                          const rankColor = idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-mist";
                          const rankBadge = idx === 0 ? "👑 " : "";
                          return (
                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                              <td className={`px-5 py-3.5 font-bold text-[0.82rem] ${rankColor}`}>
                                {rankBadge}#{idx + 1}
                              </td>
                              <td className="px-5 py-3.5 text-[0.82rem] font-bold text-white">
                                {stud.name}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[0.78rem] text-snow">
                                {stud.rollNumber}
                              </td>
                              <td className="px-5 py-3.5 text-[0.8rem] text-snow">
                                {stud.sessionsCount} sessions
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[0.82rem] text-[#c47c3e]">
                                {stud.avgScore}%
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : role === 'teacher' && activeTab === 'nav-students' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div>
                <h2 className="text-[1.25rem] font-black text-white">Academic Student Registry</h2>
                <p className="text-[0.8rem] text-mist font-medium">View and search official learners mapped to your instruction channels.</p>
              </div>

              <div className="flex p-4 rounded-2xl card-navy border border-white/[0.03]">
                <div className="relative w-full max-w-md">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-snow/30">
                    <SvgIcon paths={["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]} size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search mapped students by name, email, roll #..."
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setStudentPage(1);
                    }}
                    className="neu-input w-full pl-10 pr-4 py-2.5 rounded-xl text-[0.85rem] outline-none"
                  />
                </div>
              </div>

              <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Learner Name</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Roll Number</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Degree Batch</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Assigned Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                      {(() => {
                        const filtered = myStudents.filter(s => {
                          const term = studentSearchQuery.toLowerCase();
                          return `${s.firstName} ${s.lastName} ${s.email} ${s.rollNumber || ''} ${s.degreeBatch || ''}`.toLowerCase().includes(term);
                        });

                        const itemsPerPage = 5;
                        const totalPages = Math.ceil(filtered.length / itemsPerPage);
                        const startIndex = (studentPage - 1) * itemsPerPage;
                        const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan="4" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                                No students in your registry matching the query.
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {pageItems.map((s) => (
                              <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-snow text-xs"
                                      style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}>
                                      {(s.firstName[0] + s.lastName[0]).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-[0.86rem] font-bold text-white">{s.firstName} {s.lastName}</div>
                                      <div className="text-[0.72rem] text-mist">{s.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-[0.78rem] font-bold text-snow">
                                  {s.rollNumber || <span className="text-mist font-normal italic">Unassigned</span>}
                                </td>
                                <td className="px-6 py-4 text-[0.82rem] font-semibold text-snow">
                                  {s.degreeBatch || <span className="text-mist font-normal italic">None</span>}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-0.5 rounded text-[0.7rem] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/25">
                                    {s.mappedSubject || 'Enrolled Course'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {totalPages > 1 && (
                              <tr>
                                <td colSpan="4" className="px-6 py-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[0.76rem] text-mist">
                                      Showing page {studentPage} of {totalPages} ({filtered.length} students total)
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        disabled={studentPage === 1}
                                        onClick={() => setStudentPage(studentPage - 1)}
                                        className="px-3 py-1.5 rounded-lg text-[0.74rem] font-bold text-snow border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
                                      >
                                        Previous
                                      </button>
                                      <button
                                        disabled={studentPage === totalPages}
                                        onClick={() => setStudentPage(studentPage + 1)}
                                        className="px-3 py-1.5 rounded-lg text-[0.74rem] font-bold text-snow border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : role === 'teacher' && activeTab === 'nav-attendance' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div>
                <h2 className="text-[1.25rem] font-black text-white">Classroom Attendance Registry</h2>
                <p className="text-[0.8rem] text-mist font-medium">Select a historical meeting session to query the check-in rosters.</p>
              </div>

              <div className="card-navy p-6 rounded-2xl border border-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5 w-full max-w-md">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Select Monitored Session</label>
                  <select
                    value={selectedAttendanceMeetingId}
                    onChange={(e) => setSelectedAttendanceMeetingId(e.target.value)}
                    className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow"
                    style={{ background: "#152038" }}
                  >
                    <option value="">-- Choose Classroom Meeting --</option>
                    {teacherMeetings.map((meet) => (
                      <option key={meet._id} value={meet._id}>
                        {meet.title} ({meet.code}) · {new Date(meet.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedAttendanceMeetingId && (
                  <button
                    onClick={() => {
                      const targetMeet = teacherMeetings.find(m => m._id === selectedAttendanceMeetingId);
                      if (targetMeet) {
                        const headers = ["Student Name", "Role", "Engagement Score", "Cam Off", "Muted"];
                        const rows = targetMeet.participants.map(p => [
                          p.name,
                          p.role,
                          `${p.score}%`,
                          p.camOff ? "Yes" : "No",
                          p.muted ? "Yes" : "No"
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8," 
                          + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `Attendance_${targetMeet.code}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="btn-secondary px-4 py-2.5 rounded-xl font-bold text-[0.8rem] flex items-center gap-1.5 border border-white/10 text-snow self-end sm:self-center"
                  >
                    📥 Download CSV Report
                  </button>
                )}
              </div>

              {(() => {
                const activeId = selectedAttendanceMeetingId || (teacherMeetings.length > 0 ? teacherMeetings[0]._id : null);
                const selectedMeet = teacherMeetings.find(m => m._id === activeId);

                if (!selectedMeet) {
                  return (
                    <div className="card-navy rounded-[22px] p-8 text-center text-[0.82rem] text-mist italic border border-white/[0.03]">
                      No session records found. Create and end a classroom meeting to generate logs.
                    </div>
                  );
                }

                const studentParticipants = selectedMeet.participants.filter(p => p.role === 'student');

                return (
                  <div className="flex flex-col gap-5">
                    <div className="card-navy rounded-xl p-5 border border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
                      <div>
                        <h4 className="text-[0.92rem] font-bold text-white">{selectedMeet.title}</h4>
                        <p className="text-[0.74rem] text-mist">
                          Conducted on {new Date(selectedMeet.createdAt).toLocaleString()} · Code: <span className="font-mono font-bold text-amber-400">{selectedMeet.code}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[0.7rem] font-extrabold uppercase px-2.5 py-0.5 rounded badge-copper mb-1">
                          Avg CFI: {selectedMeet.cfi || 75}%
                        </span>
                        <p className="text-[0.72rem] text-mist">{studentParticipants.length} students logged</p>
                      </div>
                    </div>

                    <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Student Name</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Check-in Status</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Device Status</th>
                              <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Avg CFI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                            {studentParticipants.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                                  No student attendance check-ins recorded for this session.
                                </td>
                              </tr>
                            ) : (
                              studentParticipants.map((p, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="px-6 py-4 font-bold text-white text-[0.84rem]">
                                    {p.name}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-emerald-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      Present
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-1.5 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-[0.66rem] font-bold ${p.camOff ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>
                                        {p.camOff ? "Cam Off" : "Cam On"}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[0.66rem] font-bold ${p.muted ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>
                                        {p.muted ? "Muted" : "Unmuted"}
                                      </span>
                                      {p.handRaised && (
                                        <span className="px-2 py-0.5 rounded text-[0.66rem] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                          Hand Raised ✋
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-[0.82rem] text-[#c47c3e]">
                                    {p.score}%
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : role === 'student' && activeTab === 'nav-analytics' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div>
                <h2 className="text-[1.25rem] font-black text-white">My Academic Analytics</h2>
                <p className="text-[0.8rem] text-mist font-medium">Visual representations tracking your personal classroom engagement scores and metrics.</p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">Classes Attended</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{studentAttendedCount}</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">Monitored sessions checklist</span>
                </div>
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">My Average Engagement</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{studentAvgScore}%</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">AI-evaluated attention score</span>
                </div>
                <div className="card-navy rounded-[20px] p-6 border border-white/[0.03]">
                  <p className="text-[0.74rem] text-mist font-bold uppercase tracking-wide mb-1">Total Monitored Time</p>
                  <p className="text-[1.6rem] font-black text-snow leading-none font-mono">{studentAttendedCount * 45}m</p>
                  <span className="inline-block mt-2 text-[0.66rem] text-[#c47c3e] font-bold">Total classroom attendance length</span>
                </div>
              </div>

              {/* CFI trend chart */}
              <div className="card-navy p-6 rounded-[22px] border border-white/[0.03] flex flex-col gap-4">
                <div>
                  <h3 className="text-[0.95rem] font-bold text-white">My Cognitive Fatigue Index (CFI) Trend</h3>
                  <p className="text-[0.74rem] text-mist">Tracking your personal engagement score across the 5 most recent sessions (oldest to newest).</p>
                </div>
                
                {teacherMeetings.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-[0.8rem] text-mist italic bg-white/[0.01] rounded-xl border border-white/5">
                    You have not attended any classes yet. Join a session to generate engagement reports!
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 pt-4">
                    <div className="h-56 flex items-end justify-around gap-4 px-4 bg-white/[0.01] border-b border-white/[0.08] rounded-xl pb-2">
                      {teacherMeetings.slice(0, 5).reverse().map((meet) => {
                        const myParticipant = meet.participants.find(p => p.name === userName);
                        const cfiVal = myParticipant ? myParticipant.score : 75;
                        return (
                          <div key={meet._id} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 bg-[#152038] border border-[#c47c3e]/30 px-2.5 py-1 rounded text-[0.7rem] font-bold text-snow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-10">
                              {meet.title} · {cfiVal}% Engagement
                            </div>
                            {/* Bar */}
                            <div 
                              className="w-full sm:w-16 rounded-t-lg transition-all duration-500 hover:brightness-125"
                              style={{ 
                                height: `${cfiVal}%`, 
                                background: "linear-gradient(180deg, #c47c3e 0%, #8c5828 100%)",
                                boxShadow: "0 0 15px rgba(196, 124, 62, 0.2)"
                              }}
                            />
                            <span className="text-[0.72rem] font-bold text-snow font-mono">{meet.code}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[0.7rem] text-mist px-2">
                      <span>Older Sessions</span>
                      <span>Recent Sessions</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Classes Roster */}
              <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03] flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-[0.95rem] font-bold text-white">Recent Session Scores</h3>
                  <p className="text-[0.74rem] text-mist">Individual scores logged during monitored classroom sessions.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Class Title</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Instructor</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase">Date</th>
                        <th className="px-5 py-3 text-[0.78rem] font-bold text-mist uppercase text-right">My Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {teacherMeetings.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-5 py-8 text-center text-[0.8rem] text-mist italic">
                            No attended session scores registered.
                          </td>
                        </tr>
                      ) : (
                        teacherMeetings.map((meet, idx) => {
                          const myParticipant = meet.participants.find(p => p.name === userName);
                          const myScore = myParticipant ? myParticipant.score : 75;
                          return (
                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-5 py-3.5 text-[0.82rem] font-bold text-white">
                                {meet.title}
                              </td>
                              <td className="px-5 py-3.5 text-[0.8rem] text-snow">
                                {meet.teacherName}
                              </td>
                              <td className="px-5 py-3.5 text-[0.78rem] text-mist">
                                {new Date(meet.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-[0.82rem] text-[#c47c3e]">
                                {myScore}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : role === 'student' && activeTab === 'nav-reports' ? (
            <div className="flex flex-col gap-6 animate-fadeUp">
              <div>
                <h2 className="text-[1.25rem] font-black text-white">My Monitored Classroom Reports</h2>
                <p className="text-[0.8rem] text-mist font-medium">Review your detailed metrics, marked lectures, and interaction summaries.</p>
              </div>

              <div className="card-navy rounded-[22px] overflow-hidden border border-white/[0.03]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(196,124,62,0.12)] bg-[rgba(15,24,36,0.2)]">
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Class Info</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Instructor</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Class Code</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">Class Avg CFI</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider">My Engagement</th>
                        <th className="px-6 py-4 text-[0.82rem] font-bold text-mist uppercase tracking-wider text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(196,124,62,0.08)]">
                      {teacherMeetings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-[0.85rem] text-mist font-medium">
                            No attended session reports found.
                          </td>
                        </tr>
                      ) : (
                        teacherMeetings.map((m) => {
                          const myParticipant = m.participants.find(p => p.name === userName);
                          const myScore = myParticipant ? myParticipant.score : 75;
                          return (
                            <Fragment key={m._id}>
                              <tr className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="text-[0.88rem] font-bold text-white">{m.title}</div>
                                  <div className="text-[0.72rem] text-mist">{new Date(m.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 text-[0.85rem] font-semibold text-snow">
                                  {m.teacherName}
                                </td>
                                <td className="px-6 py-4 font-mono text-[0.8rem] text-snow">
                                  <span className="px-2 py-0.5 rounded bg-[rgba(196,124,62,0.12)] border border-[rgba(196,124,62,0.25)] text-amber-400">
                                    {m.code}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[0.82rem] font-medium text-snow">{m.cfi || 75}%</span>
                                </td>
                                <td className="px-6 py-4 font-bold text-[0.82rem] text-[#c47c3e]">
                                  {myScore}%
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setExpandedMeetingId(expandedMeetingId === m._id ? null : m._id)}
                                    className="px-3.5 py-1.5 rounded-lg text-[0.72rem] font-extrabold uppercase tracking-wider text-mist hover:text-snow hover:bg-white/5 border border-white/10 transition-all"
                                  >
                                    {expandedMeetingId === m._id ? "Hide Details" : "View Report"}
                                  </button>
                                </td>
                              </tr>
                              {expandedMeetingId === m._id && (
                                <tr className="bg-white/[0.01]">
                                  <td colSpan="6" className="px-6 py-5">
                                    <div className="flex flex-col gap-5 p-5 rounded-xl border border-white/[0.04] bg-[#152038]/60 animate-slide-down">
                                      <h4 className="text-[0.9rem] font-extrabold text-[#c47c3e] border-b border-white/[0.05] pb-2">Session Summary Matrix</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Status */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Device Check Log</h5>
                                          <div className="flex flex-col gap-2.5 p-3 rounded bg-white/[0.02] border border-white/[0.03] text-[0.76rem]">
                                            <div className="flex justify-between">
                                              <span className="text-mist">Camera Feed Analyzed:</span>
                                              <span className={`font-bold ${myParticipant?.camOff ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {myParticipant?.camOff ? 'Offline' : 'Online (Active)'}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-mist">Audio Status:</span>
                                              <span className={`font-bold ${myParticipant?.muted ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {myParticipant?.muted ? 'Muted' : 'Unmuted'}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-mist">Interaction Score:</span>
                                              <span className="font-bold text-snow">{myScore}% Engagement</span>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Chat Messages */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Class Chat Logs ({m.messages?.length || 0})</h5>
                                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto dark-scroll pr-1">
                                            {!m.messages || m.messages.length === 0 ? (
                                              <p className="text-[0.74rem] text-mist italic">No messages sent in this session.</p>
                                            ) : (
                                              m.messages.map((msg, idx) => (
                                                <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/[0.03] text-[0.74rem]">
                                                  <div className="flex justify-between font-bold text-snow mb-0.5">
                                                    <span>{msg.sender}</span>
                                                    <span className="text-mist text-[0.66rem]">{msg.time}</span>
                                                  </div>
                                                  <p className="text-mist">{msg.msg}</p>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                        {/* Topic Markers */}
                                        <div className="flex flex-col gap-2.5">
                                          <h5 className="text-[0.78rem] font-bold text-white uppercase tracking-wider">Teacher Topic Markers ({m.topicMarkers?.length || 0})</h5>
                                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto dark-scroll pr-1">
                                            {!m.topicMarkers || m.topicMarkers.length === 0 ? (
                                              <p className="text-[0.74rem] text-mist italic">No topic markers set in this session.</p>
                                            ) : (
                                              m.topicMarkers.map((marker, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/[0.02] border border-white/[0.03] text-[0.74rem]">
                                                  <span className="font-semibold text-snow">&quot;{marker.label}&quot;</span>
                                                  <span className="text-[#c47c3e] font-bold">{marker.time}</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'nav-settings' ? (
            <div className="card-navy rounded-[24px] p-8 border border-white/5 max-w-2xl">
              <h2 className="text-[1.2rem] font-black text-white mb-2">System Configuration</h2>
              <p className="text-[0.82rem] text-mist mb-6">Manage platform parameters and global administrative configurations.</p>
              
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                  <div>
                    <h3 className="text-[0.88rem] font-bold text-white">Database Status</h3>
                    <p className="text-[0.74rem] text-mist mt-0.5">MongoDB Atlas Connection Status</p>
                  </div>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.7rem] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                  <div>
                    <h3 className="text-[0.88rem] font-bold text-white">API Health</h3>
                    <p className="text-[0.74rem] text-mist mt-0.5">Routes & Handlers Status</p>
                  </div>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.7rem] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-[rgba(196,124,62,0.12)]">
                  <div>
                    <h3 className="text-[0.88rem] font-bold text-white">Platform Version</h3>
                    <p className="text-[0.74rem] text-mist mt-0.5">Production Build Tag</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-[0.75rem] font-bold text-snow bg-[rgba(196,124,62,0.15)] border border-[rgba(196,124,62,0.22)] font-mono">
                    v1.0.0-release
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── PRIMARY ACTION CARDS ─────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {role === "teacher" ? (
              <>
                {/* Create / Start Meeting */}
                <Link
                  href="/dashboard/create-meeting"
                  id="cta-create-meeting"
                  className="group relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)]"
                  style={{
                    background: "linear-gradient(135deg,#152038 0%,#1e3050 100%)",
                    border: "1px solid rgba(196,124,62,0.25)",
                  }}
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white mb-1.5">
                      Start a New Meeting
                    </h2>
                    <p className="text-[0.87rem] text-[rgba(255,255,255,0.60)] leading-[1.6]">
                      Create a classroom session instantly. Get a 6-digit code to
                      share with students.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[rgba(255,255,255,0.75)] group-hover:text-white transition-colors mt-auto">
                    Create Meeting
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Join Meeting */}
                <Link
                  href="/dashboard/join-meeting"
                  id="cta-join-meeting"
                  className="group relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)] card-navy"
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-snow mb-1.5">
                      Join a Meeting
                    </h2>
                    <p className="text-[0.87rem] text-mist leading-[1.6]">
                      Enter a 6-digit class code or browse live sessions to join
                      your classroom.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-mist group-hover:text-snow transition-colors mt-auto">
                    Join Now
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </>
            ) : role === "admin" ? (
              <>
                {/* Manage User Database */}
                <button
                  onClick={() => setActiveTab("nav-database")}
                  id="cta-manage-db"
                  className="group text-left relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)]"
                  style={{
                    background: "linear-gradient(135deg,#152038 0%,#1e3050 100%)",
                    border: "1px solid rgba(196,124,62,0.25)",
                  }}
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white mb-1.5">
                      Manage User Database
                    </h2>
                    <p className="text-[0.87rem] text-[rgba(255,255,255,0.60)] leading-[1.6]">
                      Perform CRUD operations on user accounts, promote teachers or admins, and update credentials.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[rgba(255,255,255,0.75)] group-hover:text-white transition-colors mt-auto">
                    Open Database Console
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* System Settings Console */}
                <button
                  onClick={() => setActiveTab("nav-settings")}
                  id="cta-system-settings"
                  className="group text-left relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)] card-navy"
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-snow mb-1.5">
                      System Settings
                    </h2>
                    <p className="text-[0.87rem] text-mist leading-[1.6]">
                      Monitor server status, database connections, and review general system health metrics.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-mist group-hover:text-snow transition-colors mt-auto">
                    Configure System
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* Join Meeting (Highlighted Primary for Student) */}
                <Link
                  href="/dashboard/join-meeting"
                  id="cta-join-meeting-student"
                  className="group relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)]"
                  style={{
                    background: "linear-gradient(135deg,#152038 0%,#1e3050 100%)",
                    border: "1px solid rgba(196,124,62,0.25)",
                  }}
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-white mb-1.5">
                      Join a Meeting
                    </h2>
                    <p className="text-[0.87rem] text-[rgba(255,255,255,0.60)] leading-[1.6]">
                      Enter a 6-digit class code or browse active classes to enter your live virtual classroom session.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[rgba(255,255,255,0.75)] group-hover:text-white transition-colors mt-auto">
                    Join Classroom
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* View Reports (Secondary for Student) */}
                <button
                  onClick={() => alert("Performance Analytics module is coming soon!")}
                  id="cta-view-reports"
                  className="group text-left relative overflow-hidden rounded-[24px] p-8 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(196,124,62,0.25)] card-navy"
                >
                  <div
                    className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle,rgba(196,124,62,0.15) 0%,transparent 70%)",
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-snow"
                    style={{
                      background: "rgba(196,124,62,0.15)",
                      border: "1px solid rgba(196,124,62,0.30)",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[1.25rem] font-black text-snow mb-1.5">
                      View My Reports
                    </h2>
                    <p className="text-[0.87rem] text-mist leading-[1.6]">
                      Review your personal local engagement history, class performance scores, and study progression details.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-mist group-hover:text-snow transition-colors mt-auto">
                    Open Analytics
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* ── STATS ROW ─────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {(role === "teacher" ? teacherStats : studentStats).map((card) => (
              <div
                key={card.id}
                id={card.id}
                className="flex flex-col gap-3 p-5 rounded-[18px] transition-all hover:-translate-y-0.5 card-navy"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-snow"
                  style={{
                    background: "rgba(196,124,62,0.15)",
                    border: "1px solid rgba(196,124,62,0.30)",
                  }}
                >
                  <SvgIcon paths={card.icon} size={17} />
                </div>
                <div>
                  <p className="text-[0.77rem] text-mist font-medium mb-0.5">
                    {card.label}
                  </p>
                  <p className="text-[1.75rem] font-black text-snow leading-none">
                    {card.value}
                  </p>
                </div>
                <span className="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full self-start badge-copper">
                  {card.delta}
                </span>
              </div>
            ))}
          </div>

          {/* ── LIVE CLASSES + UPCOMING ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Live Classes */}
            <div
              id="live-classes-card"
              className="lg:col-span-2 rounded-[20px] overflow-hidden card-navy"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(196,124,62,0.14)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c47c3e] animate-pulse" />
                  <h2 className="text-[0.95rem] font-bold text-snow">
                    Live Classes
                  </h2>
                  <span className="text-[0.72rem] font-bold text-snow px-2 py-0.5 rounded-full badge-copper">
                    {LIVE_CLASSES.length} active
                  </span>
                </div>
                <Link
                  href="/dashboard/join-meeting"
                  className="text-[0.8rem] font-semibold text-mist hover:text-snow transition-colors"
                >
                  Join one →
                </Link>
              </div>
              <div className="divide-y divide-[rgba(196,124,62,0.12)]">
                {activeMeetings.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[0.85rem] text-mist flex flex-col items-center gap-2">
                    <span className="text-[1.5rem]">🏫</span>
                    No live classroom sessions active currently.
                  </div>
                ) : (
                  activeMeetings.map((cls) => (
                    <div
                      key={cls._id}
                      id={cls._id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[rgba(196,124,62,0.06)] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-snow font-black text-[0.78rem] flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg,rgba(196,124,62,0.22),rgba(196,124,62,0.08))",
                          border: "1px solid rgba(196,124,62,0.28)",
                        }}
                      >
                        {cls.title.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.88rem] font-semibold text-snow truncate">
                          {cls.title}
                        </p>
                        <p className="text-[0.76rem] text-mist">
                          {cls.teacherName} · {cls.participants.filter(p => p.role === 'student').length} students · active
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[0.72rem] font-bold text-snow px-2 py-1 rounded-lg bg-[rgba(196,124,62,0.16)] border border-[rgba(196,124,62,0.25)] font-mono tracking-wider">
                          {cls.code}
                        </span>
                        <Link
                          href={`/dashboard/classroom/${cls.code}?role=${role}`}
                          className="px-3.5 py-1.5 rounded-xl text-[0.78rem] font-bold text-[#f2f2f2] btn-primary whitespace-nowrap"
                        >
                          Join
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Students Roster (Only for Teacher role) */}
            {role === "teacher" && (
              <div className="rounded-[20px] overflow-hidden card-navy flex flex-col">
                <div className="px-5 py-4 border-b border-[rgba(196,124,62,0.14)] flex items-center justify-between">
                  <h2 className="text-[0.95rem] font-bold text-snow">
                    My Students
                  </h2>
                  <span className="text-[0.72rem] font-bold text-snow px-2 py-0.5 rounded-full badge-copper">
                    {myStudents.length} mapped
                  </span>
                </div>
                <div className="divide-y divide-[rgba(196,124,62,0.12)] overflow-y-auto max-h-[300px]">
                  {myStudents.length === 0 ? (
                    <div className="px-5 py-10 text-center text-[0.82rem] text-mist flex flex-col items-center gap-2">
                      <span className="text-[1.3rem]">👨‍🎓</span>
                      No students mapped to you yet.
                    </div>
                  ) : (
                    myStudents.map((stud) => (
                      <div key={stud._id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-snow text-xs flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}>
                          {(stud.firstName[0] + stud.lastName[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.82rem] font-bold text-snow truncate">
                            {stud.firstName} {stud.lastName}
                          </p>
                          <p className="text-[0.7rem] text-mist truncate">
                            {stud.rollNumber || 'No Roll #'} · {stud.degreeBatch || 'No Batch'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[0.64rem] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/25 flex-shrink-0">
                          {stud.mappedSubject || 'Class'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Assigned Instructor Card (Only for Student role) */}
            {role === "student" && (
              <div className="rounded-[20px] overflow-hidden card-navy flex flex-col">
                <div className="px-5 py-4 border-b border-[rgba(196,124,62,0.14)]">
                  <h2 className="text-[0.95rem] font-bold text-snow">
                    Assigned Instructor
                  </h2>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {assignedTeacher ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-snow text-sm flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#c47c3e,#152038)" }}>
                          {(assignedTeacher.firstName[0] + assignedTeacher.lastName[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.88rem] font-bold text-snow truncate">
                            Prof. {assignedTeacher.firstName} {assignedTeacher.lastName}
                          </p>
                          <p className="text-[0.74rem] text-mist truncate">
                            {assignedTeacher.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex justify-between text-[0.76rem]">
                          <span className="text-mist">Department:</span>
                          <span className="font-semibold text-snow">{assignedTeacher.department || 'General'}</span>
                        </div>
                        <div className="flex justify-between text-[0.76rem]">
                          <span className="text-mist">Course Enrolled:</span>
                          <span className="font-semibold text-teal-400">{assignedSubject || 'General class'}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-[0.82rem] text-mist flex flex-col items-center gap-2">
                      <span className="text-[1.3rem]">💼</span>
                      No instructor assigned yet.
                      <p className="text-[0.7rem] text-mist/60">Contact administration to register your academic mapping.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RECENT SESSIONS ──────────────────────── */}
          <div
            id="recent-sessions-card"
            className="rounded-[20px] overflow-hidden card-navy"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(196,124,62,0.14)]">
              <h2 className="text-[0.95rem] font-bold text-snow">
                Recent Sessions
              </h2>
              <button className="text-[0.8rem] font-semibold text-mist hover:text-snow transition-colors">
                View all →
              </button>
            </div>
            <div className="divide-y divide-[rgba(196,124,62,0.12)]">
              {(() => {
                const endedStudentMeetings = role === "student" ? teacherMeetings.filter(m => !m.active) : [];
                const endedMeetingsForRole = role === "teacher" ? endedTeacherMeetings : endedStudentMeetings;

                if (endedMeetingsForRole.length === 0) {
                  return (
                    <div className="px-6 py-10 text-center text-[0.85rem] text-mist flex flex-col items-center gap-2">
                      <span className="text-[1.5rem]">🎥</span>
                      No recent classroom sessions found.
                    </div>
                  );
                }

                return endedMeetingsForRole.map((s) => {
                  const myParticipant = s.participants.find(p => p.name === userName);
                  const displayScore = role === "teacher" ? s.cfi : (myParticipant ? myParticipant.score : 75);

                  return (
                    <div
                      key={s._id}
                      id={s._id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[rgba(196,124,62,0.06)] transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-snow flex-shrink-0"
                        style={{
                          background: "rgba(196,124,62,0.15)",
                          border: "1px solid rgba(196,124,62,0.30)",
                        }}
                      >
                        <SvgIcon
                          paths={[
                            "M15 10l4.553-2.069A1 1 0 0 1 21 8.914V15.086a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z",
                          ]}
                          size={16}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.88rem] font-semibold text-snow truncate">
                          {s.title}
                        </p>
                        <p className="text-[0.76rem] text-mist">
                          {new Date(s.createdAt).toLocaleDateString()} · {s.teacherName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ScoreBadge score={displayScore || 75} />
                        <button
                          onClick={() => {
                            if (role === "teacher") {
                              setExpandedMeetingId(s._id);
                              setActiveTab("nav-meetings");
                            } else {
                              setExpandedMeetingId(s._id);
                              setActiveTab("nav-reports");
                            }
                          }}
                          className="text-[0.78rem] font-semibold text-mist hover:text-snow transition-colors"
                        >
                          View Report →
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          </>
          )}
        </div>
      </main>

      {/* ── CREATE USER MODAL ─────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative card-navy rounded-[24px] max-w-[460px] w-full p-8 border border-[rgba(196,124,62,0.25)] shadow-2xl animate-modal-in">
            <h3 className="text-[1.25rem] font-black text-snow mb-1">Create New User</h3>
            <p className="text-[0.8rem] text-mist mb-6">Register a new user directly into the database.</p>
            
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={crudForm.firstName}
                    onChange={(e) => setCrudForm({ ...crudForm, firstName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={crudForm.lastName}
                    onChange={(e) => setCrudForm({ ...crudForm, lastName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@school.edu"
                  value={crudForm.email}
                  onChange={(e) => setCrudForm({ ...crudForm, email: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={crudForm.password}
                  onChange={(e) => setCrudForm({ ...crudForm, password: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Role</label>
                <select
                  value={crudForm.role}
                  onChange={(e) => setCrudForm({ ...crudForm, role: e.target.value })}
                  className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow"
                  style={{ background: "#152038" }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {crudForm.role === "teacher" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={crudForm.department || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, department: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Subjects / Courses (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Science Core, Deep Learning"
                      value={crudForm.subjects || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, subjects: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                </>
              )}

              {crudForm.role === "student" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. cs-101"
                      value={crudForm.rollNumber || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, rollNumber: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Degree Batch</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BSCS 2022-2026"
                      value={crudForm.degreeBatch || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, degreeBatch: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow/70 hover:bg-white/5 border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow btn-primary transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD STUDENT DIRECT MODAL ─────────── */}
      {isAddStudentModalOpen && selectedTeacherForStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => { setIsAddStudentModalOpen(false); setSelectedTeacherForStudent(null); }} />
          <div className="relative card-navy rounded-[24px] max-w-[460px] w-full p-8 border border-[rgba(196,124,62,0.25)] shadow-2xl animate-modal-in">
            <h3 className="text-[1.25rem] font-black text-snow mb-1">Add Student to Teacher</h3>
            <p className="text-[0.8rem] text-mist mb-6">
              Create a student account and link directly under <strong>Instructor {selectedTeacherForStudent.firstName} {selectedTeacherForStudent.lastName}</strong>.
            </p>
            
            <form onSubmit={handleAddStudentSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={addStudentForm.firstName}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, firstName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={addStudentForm.lastName}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, lastName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@school.edu"
                  value={addStudentForm.email}
                  onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Password</label>
                <input
                  type="text"
                  required
                  placeholder="Min 6 characters"
                  value={addStudentForm.password}
                  onChange={(e) => setAddStudentForm({ ...addStudentForm, password: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cs-101"
                    value={addStudentForm.rollNumber}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, rollNumber: e.target.value })}
                    className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Degree Batch</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BSCS 2022-2026"
                    value={addStudentForm.degreeBatch}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, degreeBatch: e.target.value })}
                    className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Select Assigned Subject</label>
                <select
                  required
                  value={addStudentForm.mappedSubject}
                  onChange={(e) => setAddStudentForm({ ...addStudentForm, mappedSubject: e.target.value })}
                  className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow"
                  style={{ background: "#152038" }}
                >
                  {selectedTeacherForStudent.subjects && selectedTeacherForStudent.subjects.length > 0 ? (
                    selectedTeacherForStudent.subjects.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))
                  ) : (
                    <option value="">No subjects assigned to this teacher</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsAddStudentModalOpen(false); setSelectedTeacherForStudent(null); }}
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow/70 hover:bg-white/5 border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow btn-primary transition-all"
                >
                  Register & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ───────────────────── */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative card-navy rounded-[24px] max-w-[460px] w-full p-8 border border-[rgba(196,124,62,0.25)] shadow-2xl animate-modal-in">
            <h3 className="text-[1.25rem] font-black text-snow mb-1">Edit User Profile</h3>
            <p className="text-[0.8rem] text-mist mb-6">Modify user credentials and system access permissions.</p>
            
            <form onSubmit={handleEditUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">First Name</label>
                  <input
                    type="text"
                    required
                    value={crudForm.firstName}
                    onChange={(e) => setCrudForm({ ...crudForm, firstName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.78rem] font-semibold text-snow/70">Last Name</label>
                  <input
                    type="text"
                    required
                    value={crudForm.lastName}
                    onChange={(e) => setCrudForm({ ...crudForm, lastName: e.target.value })}
                    className="neu-input px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Email Address</label>
                <input
                  type="email"
                  required
                  value={crudForm.email}
                  onChange={(e) => setCrudForm({ ...crudForm, email: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Reset Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={crudForm.password}
                  onChange={(e) => setCrudForm({ ...crudForm, password: e.target.value })}
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.78rem] font-semibold text-snow/70">Role</label>
                <select
                  value={crudForm.role}
                  onChange={(e) => setCrudForm({ ...crudForm, role: e.target.value })}
                  disabled={selectedUser.email === userEmail}
                  className="neu-input px-3.5 py-2.5 rounded-xl text-[0.88rem] outline-none cursor-pointer text-snow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#152038" }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {crudForm.role === "teacher" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={crudForm.department || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, department: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Subjects / Courses (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Science Core, Deep Learning"
                      value={crudForm.subjects || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, subjects: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                </>
              )}

              {crudForm.role === "student" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. cs-101"
                      value={crudForm.rollNumber || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, rollNumber: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.78rem] font-semibold text-snow/70">Degree Batch</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BSCS 2022-2026"
                      value={crudForm.degreeBatch || ""}
                      onChange={(e) => setCrudForm({ ...crudForm, degreeBatch: e.target.value })}
                      className="neu-input w-full px-4 py-2.5 rounded-xl text-[0.88rem] outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow/70 hover:bg-white/5 border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow btn-primary transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE USER MODAL ─────────────────── */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative card-navy rounded-[24px] max-w-[420px] w-full p-8 border border-red-500/20 shadow-2xl animate-modal-in">
            <h3 className="text-[1.25rem] font-black text-red-400 mb-2">Delete User Account</h3>
            <p className="text-[0.85rem] text-mist leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-white font-bold">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})? This action is irreversible.
            </p>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-snow/70 hover:bg-white/5 border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-3 rounded-xl font-bold text-[0.85rem] text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

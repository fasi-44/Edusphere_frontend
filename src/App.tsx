import { BrowserRouter as Router, Routes, Route } from "react-router";
import { useEffect, ReactNode, lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PermissionGuard } from "./components/auth/PermissionGuard";
import { ROUTE_PERMISSION_MAP } from "./config/permissions";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "./components";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Eager imports (critical for initial load)
import AppLayout from "./layout/AppLayout";

// Lazy loaded auth pages (loaded immediately for login)
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));

// Lazy loaded common pages
const DashboardRouter = lazy(() => import("./pages/Dashboard/DashboardRouter"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Blank = lazy(() => import("./pages/Blank"));

// Lazy loaded UI Elements (rarely used)
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));

// Lazy loaded School Management
const SchoolList = lazy(() => import("./pages/SchoolManagement").then(m => ({ default: m.SchoolList })));
const SchoolForm = lazy(() => import("./pages/SchoolManagement").then(m => ({ default: m.SchoolForm })));
const SchoolDetail = lazy(() => import("./pages/SchoolManagement").then(m => ({ default: m.SchoolDetail })));
const SchoolAdminsList = lazy(() => import("./pages/SchoolManagement").then(m => ({ default: m.SchoolAdminsList })));
const SystemAdminsList = lazy(() => import("./pages/SchoolManagement").then(m => ({ default: m.SystemAdminsList })));

// Lazy loaded User Management
const UserList = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.UserList })));
const UserForm = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.UserForm })));
const UserDetail = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.UserDetail })));
const TeacherList = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.TeacherList })));
const TeacherForm = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.TeacherForm })));
const StudentList = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.StudentList })));
const StudentForm = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.StudentForm })));
const StudentCreate = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.StudentCreate })));
const CertificateGenerator = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.CertificateGenerator })));
const ParentList = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.ParentList })));
const ParentForm = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.ParentForm })));
const RolePermissionsList = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.RolePermissionsList })));
const RoleForm = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.RoleForm })));

// Lazy loaded Class Management
const ClassList = lazy(() => import("./pages/ClassManagement").then(m => ({ default: m.ClassList })));
const ClassForm = lazy(() => import("./pages/ClassManagement").then(m => ({ default: m.ClassForm })));
const ClassDetail = lazy(() => import("./pages/ClassManagement").then(m => ({ default: m.ClassDetail })));

// Lazy loaded Room Management
const RoomList = lazy(() => import("./pages/RoomManagement").then(m => ({ default: m.RoomList })));
const RoomForm = lazy(() => import("./pages/RoomManagement").then(m => ({ default: m.RoomForm })));
const RoomDetail = lazy(() => import("./pages/RoomManagement").then(m => ({ default: m.RoomDetail })));

// Lazy loaded Attendance Management
const MarkAttendance = lazy(() => import("./pages/AttendanceManagement").then(m => ({ default: m.MarkAttendance })));
const AttendanceReport = lazy(() => import("./pages/AttendanceManagement").then(m => ({ default: m.AttendanceReport })));

// Lazy loaded Announcement Management
const AnnouncementList = lazy(() => import("./pages/AnnouncementManagement").then(m => ({ default: m.AnnouncementList })));
const AnnouncementForm = lazy(() => import("./pages/AnnouncementManagement").then(m => ({ default: m.AnnouncementForm })));

// Lazy loaded Timetable Management
const TimetableList = lazy(() => import("./pages/TimetableManagement").then(m => ({ default: m.TimetableList })));
const TimetableDetail = lazy(() => import("./pages/TimetableManagement").then(m => ({ default: m.TimetableDetail })));
const TimetableEdit = lazy(() => import("./pages/TimetableManagement").then(m => ({ default: m.TimetableEdit })));
const TimetableCreate = lazy(() => import("./pages/TimetableManagement").then(m => ({ default: m.TimetableCreate })));

// Lazy loaded Exam Management
const ExamList = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.ExamList })));
const ExamForm = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.ExamForm })));
const ExamDetail = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.ExamDetail })));
const ExamSubjectConfigList = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.ExamSubjectConfigList })));
const ExamTimetable = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.ExamTimetable })));
const SeatingArrangement = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.SeatingArrangement })));
const StudentExamTimetable = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.StudentExamTimetable })));
const TeacherInvigilatorSchedule = lazy(() => import("./pages/ExamManagement").then(m => ({ default: m.TeacherInvigilatorSchedule })));

// Lazy loaded Academics Management
const SubjectList = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.SubjectList })));
const MarksEntry = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.MarksEntry })));
const ClassProgress = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.ClassProgress })));
const ProgressCardView = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.ProgressCardView })));
const AnnualProgressReport = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.AnnualProgressReport })));
const TeacherSubjectAssignment = lazy(() => import("./pages/AcademicsManagement").then(m => ({ default: m.TeacherSubjectAssignment })));

// Lazy loaded Finance Management
const FeeStructureList = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.FeeStructureList })));
const FeeStructureForm = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.FeeStructureForm })));
const FeeCollection = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.FeeCollection })));
const ExpenseList = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.ExpenseList })));
const SalarySetup = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.SalarySetup })));
const SalaryPayments = lazy(() => import("./pages/FinanceManagement").then(m => ({ default: m.SalaryPayments })));

// Lazy loaded Syllabus Management
const SyllabusList = lazy(() => import("./pages/SyllabusManagement").then(m => ({ default: m.SyllabusList })));
const SyllabusDetail = lazy(() => import("./pages/SyllabusManagement").then(m => ({ default: m.SyllabusDetail })));
const SyllabusAnalytics = lazy(() => import("./pages/SyllabusManagement").then(m => ({ default: m.SyllabusAnalytics })));
const StudentSyllabusView = lazy(() => import("./pages/SyllabusManagement").then(m => ({ default: m.StudentSyllabusView })));
const StudentSyllabusDetail = lazy(() => import("./pages/SyllabusManagement").then(m => ({ default: m.StudentSyllabusDetail })));

// Lazy loaded Assignment Management
const Assignments = lazy(() => import("./pages/AssignmentManagement").then(m => ({ default: m.Assignments })));
const AssignmentReview = lazy(() => import("./pages/AssignmentManagement").then(m => ({ default: m.AssignmentReview })));
const StudentAssignments = lazy(() => import("./pages/AssignmentManagement").then(m => ({ default: m.StudentAssignments })));

/**
 * Wraps a route element with PermissionGuard if the path has a permission config.
 * Routes without a mapping remain freely accessible to any authenticated user.
 */
const guarded = (path: string, element: ReactNode) => {
    const config = ROUTE_PERMISSION_MAP[path];
    if (!config) return element;
    return (
        <PermissionGuard permission={config.permission} anyPermission={config.anyPermission} superAdminOnly={config.superAdminOnly}>
            {element}
        </PermissionGuard>
    );
};

function AppContent() {
    const { restoreAuth } = useAuth();

    useEffect(() => {
        // Restore authentication from localStorage on app load
        restoreAuth();
    }, [restoreAuth]);

    return (
        <>
            <Toaster
                position="top-right"
                containerStyle={{ zIndex: 999999 }}
                toastOptions={{
                    style: {
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    success: {
                        style: {
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                        },
                        iconTheme: { primary: '#10B981', secondary: '#ECFDF5' },
                    },
                    error: {
                        style: {
                            background: '#FEF2F2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                        },
                        iconTheme: { primary: '#EF4444', secondary: '#FEF2F2' },
                    },
                    loading: {
                        style: {
                            background: '#EFF6FF',
                            color: '#1E40AF',
                            border: '1px solid #BFDBFE',
                        },
                    },
                }}
            />
            <Router>
                <ScrollToTop />
                <Suspense fallback={<LoadingSpinner fullHeight message="Loading page..." />}>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Dashboard Layout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardRouter />} />

                        {/* Others Page */}
                        <Route path="/profile" element={<UserProfiles />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/blank" element={<Blank />} />

                        {/* Forms */}
                        <Route path="/form-elements" element={<FormElements />} />

                        {/* Tables */}
                        <Route path="/basic-tables" element={<BasicTables />} />

                        {/* Ui Elements */}
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/avatars" element={<Avatars />} />
                        <Route path="/badge" element={<Badges />} />
                        <Route path="/buttons" element={<Buttons />} />
                        <Route path="/images" element={<Images />} />
                        <Route path="/videos" element={<Videos />} />

                        {/* Charts */}
                        <Route path="/line-chart" element={<LineChart />} />
                        <Route path="/bar-chart" element={<BarChart />} />

                        {/* School Management Routes */}
                        <Route path="/schools" element={guarded('/schools', <SchoolList />)} />
                        <Route path="/schools/new" element={guarded('/schools/new', <SchoolForm />)} />
                        <Route path="/schools/:id/edit" element={guarded('/schools/:id/edit', <SchoolForm />)} />
                        <Route path="/schools/:id" element={guarded('/schools/:id', <SchoolDetail />)} />
                        <Route path="/school-admins" element={guarded('/school-admins', <SchoolAdminsList />)} />
                        <Route path="/system-admins" element={guarded('/system-admins', <SystemAdminsList />)} />

                        {/* User Management Routes */}
                        <Route path="/users" element={guarded('/users', <UserList />)} />
                        <Route path="/users/new" element={guarded('/users/new', <UserForm />)} />
                        <Route path="/users/:id/edit" element={guarded('/users/:id/edit', <UserForm />)} />
                        <Route path="/users/:id" element={guarded('/users/:id', <UserDetail />)} />

                        {/* Teacher Management Routes */}
                        <Route path="/teachers" element={guarded('/teachers', <TeacherList />)} />
                        <Route path="/teachers/new" element={guarded('/teachers/new', <TeacherForm />)} />
                        <Route path="/teachers/:id/edit" element={guarded('/teachers/:id/edit', <TeacherForm />)} />

                        {/* Student Management Routes */}
                        <Route path="/students" element={guarded('/students', <StudentList />)} />
                        <Route path="/students/new" element={guarded('/students/new', <StudentCreate />)} />
                        <Route path="/students/:id/edit" element={guarded('/students/:id/edit', <StudentForm />)} />
                        <Route path="/students/:studentId/certificates" element={guarded('/students/:studentId/certificates', <CertificateGenerator />)} />

                        {/* Parent Management Routes */}
                        <Route path="/parents" element={guarded('/parents', <ParentList />)} />
                        <Route path="/parents/new" element={guarded('/parents/new', <ParentForm />)} />
                        <Route path="/parents/:id/edit" element={guarded('/parents/:id/edit', <ParentForm />)} />

                        {/* Role & Permissions Management Routes */}
                        <Route path="/roles" element={guarded('/roles', <RolePermissionsList />)} />
                        <Route path="/roles/new" element={guarded('/roles/new', <RoleForm />)} />
                        <Route path="/roles/:id/edit" element={guarded('/roles/:id/edit', <RoleForm />)} />

                        {/* Class Management Routes */}
                        <Route path="/classes" element={guarded('/classes', <ClassList />)} />
                        <Route path="/classes/new" element={guarded('/classes/new', <ClassForm />)} />
                        <Route path="/classes/:id/edit" element={guarded('/classes/:id/edit', <ClassForm />)} />
                        <Route path="/classes/:id" element={guarded('/classes/:id', <ClassDetail />)} />

                        {/* Room Management Routes */}
                        <Route path="/rooms" element={guarded('/rooms', <RoomList />)} />
                        <Route path="/rooms/new" element={guarded('/rooms', <RoomForm />)} />
                        <Route path="/rooms/:id/edit" element={guarded('/rooms', <RoomForm />)} />
                        <Route path="/rooms/:id" element={guarded('/rooms', <RoomDetail />)} />

                        {/* Attendance Routes */}
                        <Route path="/attendance/mark" element={guarded('/attendance/mark', <MarkAttendance />)} />
                        <Route path="/attendance/report" element={guarded('/attendance/report', <AttendanceReport />)} />

                        {/* Announcements Routes */}
                        <Route path="/announcements" element={guarded('/announcements', <AnnouncementList />)} />
                        <Route path="/announcements/new" element={guarded('/announcements/new', <AnnouncementForm />)} />
                        <Route path="/announcements/:id/edit" element={guarded('/announcements/:id/edit', <AnnouncementForm />)} />

                        {/* Timetable Routes */}
                        <Route path="/timetable" element={guarded('/timetable', <TimetableList />)} />
                        <Route path="/timetable/new" element={guarded('/timetable/new', <TimetableCreate />)} />
                        <Route path="/timetable/:id" element={guarded('/timetable/:id', <TimetableDetail />)} />
                        <Route path="/timetable/:id/edit" element={guarded('/timetable/:id/edit', <TimetableEdit />)} />

                        {/* Exam Management Routes */}
                        <Route path="/exams" element={guarded('/exams', <ExamList />)} />
                        <Route path="/exams/new" element={guarded('/exams/new', <ExamForm />)} />
                        <Route path="/exams/:id/edit" element={guarded('/exams/:id/edit', <ExamForm />)} />
                        <Route path="/exams/:id" element={guarded('/exams/:id', <ExamDetail />)} />

                        {/* Exam Subject Configuration Routes */}
                        <Route path="/exams/configs" element={guarded('/exams/configs', <ExamSubjectConfigList />)} />

                        {/* Exam Timetable Route */}
                        <Route path="/exams/timetable" element={guarded('/exams/timetable', <ExamTimetable />)} />

                        {/* Seating Arrangement Route */}
                        <Route path="/exams/seating" element={guarded('/exams/seating', <SeatingArrangement />)} />

                        {/* Student Exam Timetable Route */}
                        <Route path="/exams/my-timetable" element={guarded('/exams/my-timetable', <StudentExamTimetable />)} />

                        {/* Teacher Invigilator Schedule Route */}
                        <Route path="/exams/invigilator-schedule" element={guarded('/exams/invigilator-schedule', <TeacherInvigilatorSchedule />)} />

                        {/* Academics Management Routes */}
                        <Route path="/academics/subjects" element={guarded('/academics/subjects', <SubjectList />)} />
                        <Route path="/academics/marks/entry" element={guarded('/academics/marks/entry', <MarksEntry />)} />
                        <Route path="/academics/progress/class" element={guarded('/academics/progress/class', <ClassProgress />)} />
                        <Route path="/academics/progress-card/:studentId/:examId" element={guarded('/academics/progress-card/:studentId/:examId', <ProgressCardView />)} />
                        <Route path="/academics/annual-progress/:studentId" element={guarded('/academics/annual-progress/:studentId', <AnnualProgressReport />)} />
                        <Route path="/academics/assign-subjects" element={guarded('/academics/assign-subjects', <TeacherSubjectAssignment />)} />

                        {/* Finance Management Routes */}
                        <Route path="/finance/fee-structure" element={guarded('/finance/fee-structure', <FeeStructureList />)} />
                        <Route path="/finance/fee-structure/create" element={guarded('/finance/fee-structure/create', <FeeStructureForm />)} />
                        <Route path="/finance/fee-structure/edit/:classId" element={guarded('/finance/fee-structure/edit/:classId', <FeeStructureForm />)} />
                        <Route path="/finance/fee-collection" element={guarded('/finance/fee-collection', <FeeCollection />)} />
                        <Route path="/finance/expenses" element={guarded('/finance/expenses', <ExpenseList />)} />
                        <Route path="/finance/salary-setup" element={guarded('/finance/salary-setup', <SalarySetup />)} />
                        <Route path="/finance/salary-payments" element={guarded('/finance/salary-payments', <SalaryPayments />)} />

                        {/* Assignment Management Routes */}
                        <Route path="/assignments" element={guarded('/assignments', <Assignments />)} />
                        <Route path="/assignments/:id/review" element={guarded('/assignments/:id/review', <AssignmentReview />)} />
                        <Route path="/assignments/my-assignments" element={guarded('/assignments/my-assignments', <StudentAssignments />)} />

                        {/* Syllabus Management Routes */}
                        <Route path="/syllabus" element={guarded('/syllabus', <SyllabusList />)} />
                        <Route path="/syllabus/analytics" element={guarded('/syllabus/analytics', <SyllabusAnalytics />)} />
                        <Route path="/syllabus/:id/analytics" element={guarded('/syllabus/analytics', <SyllabusAnalytics />)} />
                        <Route path="/syllabus/my-progress" element={guarded('/syllabus/my-progress', <StudentSyllabusView />)} />
                        <Route path="/syllabus/my-progress/:id" element={guarded('/syllabus/my-progress/:id', <StudentSyllabusDetail />)} />
                        <Route path="/syllabus/:id" element={guarded('/syllabus/:id', <SyllabusDetail />)} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
            </Router>
        </>
    );
}

export default function App() {
    return <AppContent />;
}

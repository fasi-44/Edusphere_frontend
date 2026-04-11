import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { usePermissions } from "../hooks/usePermissions";

// Assume these icons are imported from an icon library
import { useSidebar } from "../context/SidebarContext";
import {
    BoxCubeIcon,
    CalenderIcon,
    ChevronDownIcon,
    GridIcon,
    ListIcon,
    PageIcon,
    PieChartIcon,
    PlugInIcon,
    TableIcon,
    TaskIcon,
    UserCircleIcon
} from "../icons";
import { SIDEBAR_PERMISSION_MAP } from "../config/permissions";
// import SidebarWidget from "./SidebarWidget";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const allMenuItems: NavItem[] = [
    // Dashboard (All roles)
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/dashboard",
    },
    // School Management (SuperAdmin Only)
    {
        icon: <BoxCubeIcon />,
        name: "School Management",
        subItems: [
            { name: "List Schools", path: "/schools", pro: false },
            { name: "Create School", path: "/schools/new", pro: false },
            { name: "School Admins", path: "/school-admins", pro: false },
            { name: "System Admins", path: "/system-admins", pro: false },
        ],
    },
    // Announcements (SchoolAdmin, Principal, Teacher, Student)
    {
        icon: <TableIcon />,
        name: "Announcements",
        path: "/announcements",
    },
    // Timetable (SchoolAdmin, Principal, Teacher)
    {
        icon: <CalenderIcon />,
        name: "Timetable",
        path: "/timetable",
    },
    // Assignments – Teacher / Admin
    {
        icon: <ListIcon />,
        name: "Assignments",
        path: "/assignments",
    },
    // Assignments – Student
    {
        icon: <ListIcon />,
        name: "My Assignments",
        path: "/assignments/my-assignments",
    },
    // Attendance (SchoolAdmin, Principal, Teacher)
    {
        icon: <ListIcon />,
        name: "Attendance",
        subItems: [
            { name: "Mark Attendance", path: "/attendance/mark", pro: false },
            { name: "Attendance Report", path: "/attendance/report", pro: false },
        ],
    },
    // Class Management (SchoolAdmin, Principal)
    {
        icon: <PageIcon />,
        name: "Class Management",
        subItems: [
            { name: "Classes", path: "/classes", pro: false },
            { name: "Rooms", path: "/rooms", pro: false },
        ],
    },
    // Exam Management (SchoolAdmin, Principal)
    {
        icon: <PieChartIcon />,
        name: "Exam Management",
        subItems: [
            { name: "Exams Type", path: "/exams", pro: false },
            { name: "Exam Timetable", path: "/exams/timetable", pro: false },
            { name: "Subject Configuration", path: "/exams/configs", pro: false },
            { name: "Seating Arrangement", path: "/exams/seating", pro: false },
        ],
    },
    // My Exam Timetable (Student)
    {
        icon: <PieChartIcon />,
        name: "My Exam Timetable",
        path: "/exams/my-timetable",
    },
    // My Invigilator Schedule (Teacher)
    {
        icon: <TaskIcon />,
        name: "My Invigilator Schedule",
        path: "/exams/invigilator-schedule",
    },
    // Academics Management (SchoolAdmin, Principal, Teacher)
    {
        icon: <PlugInIcon />,
        name: "Academics Management",
        subItems: [
            { name: "Subjects", path: "/academics/subjects", pro: false },
            { name: "Assign Subjects", path: "/academics/assign-subjects", pro: false },
            { name: "Marks Entry", path: "/academics/marks/entry", pro: false },
            { name: "Class Progress", path: "/academics/progress/class", pro: false },
        ],
    },
    // Syllabus Management (SchoolAdmin, Principal, Teacher)
    {
        icon: <PageIcon />,
        name: "Syllabus Management",
        subItems: [
            { name: "All Syllabi", path: "/syllabus", pro: false },
            { name: "Analytics", path: "/syllabus/analytics", pro: false },
            { name: "My Syllabus Progress", path: "/syllabus/my-progress", pro: false },
        ],
    },
    // Bus Management (SchoolAdmin, Principal, Bus Staff)
    {
        icon: <TaskIcon />,
        name: "Bus Management",
        subItems: [
            { name: "Scan QR Code", path: "/bus-scan/scan", pro: false },
            { name: "Tracking Report", path: "/bus-scan/report", pro: false },
        ],
    },
    // Finance Management (SchoolAdmin)
    {
        icon: <GridIcon />,
        name: "Finance Management",
        subItems: [
            { name: "Fee Structure", path: "/finance/fee-structure", pro: false },
            { name: "Fee Collection", path: "/finance/fee-collection", pro: false },
            { name: "Expenses", path: "/finance/expenses", pro: false },
            { name: "Salary Setup", path: "/finance/salary-setup", pro: false },
            { name: "Salary Payments", path: "/finance/salary-payments", pro: false },
        ],
    },
    // User Management (SchoolAdmin, Principal)
    {
        icon: <UserCircleIcon />,
        name: "User Management",
        subItems: [
            { name: "Users List", path: "/users", pro: false },
            { name: "Create User", path: "/users/new", pro: false },
            { name: "Teachers", path: "/teachers", pro: false },
            { name: "Students", path: "/students", pro: false },
            { name: "Parents", path: "/parents", pro: false },
            { name: "Roles & Permissions", path: "/roles", pro: false },
        ],
    },
];

const AppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const location = useLocation();
    const { hasPermission, hasAnyPermission, isFullAccess, isSuperAdmin } = usePermissions();

    const [openSubmenuName, setOpenSubmenuName] = useState<string | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
        {}
    );
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // const isActive = (path: string) => location.pathname === path;
    const isActive = useCallback(
        (path: string) => location.pathname === path,
        [location.pathname]
    );

    useEffect(() => {
        let submenuMatched = false;
        allMenuItems.forEach((nav) => {
            if (nav.subItems) {
                nav.subItems.forEach((subItem) => {
                    if (isActive(subItem.path)) {
                        setOpenSubmenuName(nav.name);
                        submenuMatched = true;
                    }
                });
            }
        });

        if (!submenuMatched) {
            setOpenSubmenuName(null);
        }
    }, [location, isActive]);

    useEffect(() => {
        if (openSubmenuName !== null) {
            if (subMenuRefs.current[openSubmenuName]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [openSubmenuName]: subMenuRefs.current[openSubmenuName]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenuName]);

    const handleSubmenuToggle = (menuName: string) => {
        setOpenSubmenuName((prevName) => {
            if (prevName === menuName) {
                return null;
            }
            return menuName;
        });
    };

    // Permission-based menu filtering
    const filteredMenuItems = useMemo(() => {
        return allMenuItems.reduce<NavItem[]>((acc, nav) => {
            // Dashboard is always visible
            if (nav.name === "Dashboard") {
                acc.push(nav);
                return acc;
            }

            const sidebarConfig = SIDEBAR_PERMISSION_MAP[nav.name];

            // If no sidebar config exists, hide the item (safe default)
            if (!sidebarConfig) return acc;

            // SuperAdmin-only groups
            if (sidebarConfig.superAdminOnly) {
                if (isSuperAdmin) acc.push(nav);
                return acc;
            }

            // SuperAdmin only sees Dashboard + superAdmin-only groups (School Management)
            // All other groups are school-specific and not relevant to SuperAdmin
            if (isSuperAdmin) return acc;

            // Full-access roles (SCHOOL_ADMIN) see everything, except excluded paths
            if (isFullAccess) {
                const excluded = sidebarConfig.excludeFromFullAccess;
                if (excluded && excluded.length > 0) {
                    // Hide entire single-path item if its path is excluded
                    if (!nav.subItems && nav.path && excluded.includes(nav.path)) return acc;
                    // Filter sub-items
                    if (nav.subItems) {
                        const filtered = nav.subItems.filter((sub) => !excluded.includes(sub.path));
                        if (filtered.length === 0) return acc;
                        acc.push({ ...nav, subItems: filtered });
                        return acc;
                    }
                }
                acc.push(nav);
                return acc;
            }

            // Check if user has any of the group-level permissions
            if (!hasAnyPermission(sidebarConfig.groupPermissions)) return acc;

            // For single-path items (no sub-items), also check excludeIfHasPermission
            if (!nav.subItems) {
                const excludePerm = sidebarConfig.excludeIfHasPermission?.[nav.path || ''];
                if (excludePerm && hasPermission(excludePerm)) return acc;
                acc.push(nav);
                return acc;
            }

            // Filter sub-items by individual item permissions
            const visibleSubItems = nav.subItems.filter((sub) => {
                const excludePerm = sidebarConfig.excludeIfHasPermission?.[sub.path];
                if (excludePerm && hasPermission(excludePerm)) return false;

                const requiredPerm = sidebarConfig.itemPermissions[sub.path];
                if (!requiredPerm) return true;
                return hasPermission(requiredPerm);
            });

            // Hide the entire group if no sub-items are visible
            if (visibleSubItems.length === 0) return acc;

            acc.push({ ...nav, subItems: visibleSubItems });

            return acc;
        }, []);
    }, [isFullAccess, isSuperAdmin, hasPermission, hasAnyPermission]);

    const renderMenuItems = (items: NavItem[], _menuType: "main" | "others") => (
        <ul className="flex flex-col gap-4">
            {items.map((nav) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(nav.name)}
                            className={`menu-item group ${openSubmenuName === nav.name
                                ? "menu-item-active"
                                : "menu-item-inactive"
                                } cursor-pointer ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "lg:justify-start"
                                }`}
                        >
                            <span
                                className={`menu-item-icon-size  ${openSubmenuName === nav.name
                                    ? "menu-item-icon-active"
                                    : "menu-item-icon-inactive"
                                    }`}
                            >
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className="menu-item-text">{nav.name}</span>
                            )}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <ChevronDownIcon
                                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenuName === nav.name
                                        ? "rotate-180 text-brand-500"
                                        : ""
                                        }`}
                                />
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                to={nav.path}
                                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                    }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${isActive(nav.path)
                                        ? "menu-item-icon-active"
                                        : "menu-item-icon-inactive"
                                        }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                        <div
                            ref={(el) => {
                                subMenuRefs.current[nav.name] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{
                                height:
                                    openSubmenuName === nav.name
                                        ? `${subMenuHeight[nav.name]}px`
                                        : "0px",
                            }}
                        >
                            <ul className="mt-2 space-y-1 ml-9">
                                {nav.subItems.map((subItem) => (
                                    <li key={subItem.name}>
                                        <Link
                                            to={subItem.path}
                                            className={`menu-dropdown-item ${isActive(subItem.path)
                                                ? "menu-dropdown-item-active"
                                                : "menu-dropdown-item-inactive"
                                                }`}
                                        >
                                            {subItem.name}
                                            <span className="flex items-center gap-1 ml-auto">
                                                {subItem.new && (
                                                    <span
                                                        className={`ml-auto ${isActive(subItem.path)
                                                            ? "menu-dropdown-badge-active"
                                                            : "menu-dropdown-badge-inactive"
                                                            } menu-dropdown-badge`}
                                                    >
                                                        new
                                                    </span>
                                                )}
                                                {subItem.pro && (
                                                    <span
                                                        className={`ml-auto ${isActive(subItem.path)
                                                            ? "menu-dropdown-badge-active"
                                                            : "menu-dropdown-badge-inactive"
                                                            } menu-dropdown-badge`}
                                                    >
                                                        pro
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : "w-[90px]"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="py-5 flex justify-center"
            >
                <Link to="/dashboard">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <img
                                className="dark:hidden"
                                src="/images/logo/edusphere-light.png"
                                alt="Edusphere"
                                width={180}
                                height={48}
                            />
                            <img
                                className="hidden dark:block"
                                src="/images/logo/edusphere-dark.png"
                                alt="Edusphere"
                                width={180}
                                height={48}
                            />
                        </>
                    ) : (
                        <img
                            src="/images/logo/edusphere-light.png"
                            alt="Edusphere"
                            width={40}
                            height={40}
                        />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    {renderMenuItems(filteredMenuItems, "main")}
                </nav>
                {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
            </div>
        </aside>
    );
};

export default AppSidebar;

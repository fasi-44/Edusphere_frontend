/**
 * Room Management - List Page
 * View and manage rooms/halls for the school
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    Badge,
    DataTable,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
    FormField,
    FormSelect,
    FormInput,
} from '@/components';
import { roomService } from '@/services/modules/roomService';
import { usePermissions } from '@/hooks/usePermissions';

// ──────────── Constants ────────────

const ROOM_TYPES = [
    { value: 'Classroom', label: 'Classroom' },
    { value: 'Laboratory', label: 'Laboratory' },
    { value: 'Auditorium', label: 'Auditorium' },
    { value: 'Exam Hall', label: 'Exam Hall' },
    { value: 'Computer Lab', label: 'Computer Lab' },
    { value: 'Library', label: 'Library' },
    { value: 'Staff Room', label: 'Staff Room' },
    { value: 'Other', label: 'Other' },
];

const ROOM_TYPE_BADGE_VARIANT: Record<string, string> = {
    'Classroom': 'info',
    'Laboratory': 'warning',
    'Auditorium': 'primary',
    'Exam Hall': 'danger',
    'Computer Lab': 'info',
    'Library': 'success',
    'Staff Room': 'secondary',
    'Other': 'secondary',
};

interface IRoom {
    id: number;
    room_name: string;
    room_type: string;
    building?: string;
    floor?: number | null;
    seating_layout?: any[] | null;
    capacity: number;
    has_projector?: boolean;
    has_ac?: boolean;
    has_computers?: boolean;
    notes?: string;
    is_active?: boolean;
}

// ──────────── Component ────────────

const RoomList: FC = () => {
    const navigate = useNavigate();
    const { isFullAccess, isSuperAdmin } = usePermissions();
    const canManage = isFullAccess || isSuperAdmin;

    const [filterType, setFilterType] = useState<string>('');
    const [filterBuilding, setFilterBuilding] = useState<string>('');
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [loading, setLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, [filterType, filterBuilding]);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filterType) filters.room_type = filterType;
            if (filterBuilding) filters.building = filterBuilding;
            const data = await roomService.list(filters);
            setRooms(Array.isArray(data) ? data : (data?.data || []));
        } catch (err: any) {
            toast.error(err.message || 'Failed to load rooms');
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await roomService.delete(String(deleteTarget));
            toast.success('Room deleted successfully');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            await fetchRooms();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete room');
        }
    };

    const columns = [
        {
            key: 'room_name',
            label: 'Room',
            render: (value: string) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            ),
        },
        {
            key: 'room_type',
            label: 'Type',
            render: (value: string) => (
                <Badge variant={ROOM_TYPE_BADGE_VARIANT[value] || 'secondary' as any}>
                    {value}
                </Badge>
            ),
        },
        {
            key: 'building',
            label: 'Building / Floor',
            render: (_: any, row: IRoom) => {
                const parts: string[] = [];
                if (row.building) parts.push(row.building);
                if (row.floor != null) parts.push(`Floor ${row.floor}`);
                return (
                    <div className="text-sm text-gray-900 dark:text-white">
                        {parts.length > 0 ? parts.join(', ') : '-'}
                    </div>
                );
            },
        },
        {
            key: 'capacity',
            label: 'Capacity / Layout',
            render: (_: number, row: IRoom) => (
                <div className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{row.capacity} seats</span>
                    {row.seating_layout && row.seating_layout.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                            ({row.seating_layout.map((s: any) => `${s.rows}x${s.columns}`).join(' + ')})
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'facilities',
            label: 'Facilities',
            render: (_: any, row: IRoom) => (
                <div className="flex flex-wrap gap-1">
                    {row.has_projector && <Badge variant="info">Projector</Badge>}
                    {row.has_ac && <Badge variant="info">AC</Badge>}
                    {row.has_computers && <Badge variant="info">Computers</Badge>}
                    {!row.has_projector && !row.has_ac && !row.has_computers && (
                        <span className="text-sm text-gray-400">-</span>
                    )}
                </div>
            ),
        },
    ];

    if (loading && rooms.length === 0) {
        return <LoadingSpinner fullHeight message="Loading rooms..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Room Management"
                subtitle="Manage rooms, labs, halls, and other facilities"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Room Management', href: '#' },
                ]}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <FormField label="Room Type">
                        <FormSelect
                            value={filterType}
                            placeholder="All Types"
                            onChange={(e) => setFilterType(e.target.value)}
                            options={ROOM_TYPES}
                        />
                    </FormField>
                    <FormField label="Building">
                        <FormInput
                            type="text"
                            value={filterBuilding}
                            onChange={(e) => setFilterBuilding(e.target.value)}
                            placeholder="Filter by building..."
                        />
                    </FormField>
                    <div className="flex gap-3 sm:col-span-2 lg:col-span-3 lg:justify-end items-end">
                        {canManage && (
                            <Button variant="success" onClick={() => navigate('/rooms/new')}>
                                + Add Room
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {rooms.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={rooms}
                        loading={loading}
                        actions={(row: IRoom) => (
                            <div className="flex gap-2">
                                <Button size="sm" variant="primary" onClick={() => navigate(`/rooms/${row.id}`)}>
                                    View
                                </Button>
                                {canManage && (
                                    <>
                                        <Button size="sm" variant="info" onClick={() => navigate(`/rooms/${row.id}/edit`)}>
                                            Edit
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    />
                </div>
            ) : loading ? (
                <LoadingSpinner message="Loading rooms..." />
            ) : (
                <EmptyState
                    icon="🏠"
                    title="No Rooms Found"
                    description="No rooms match the current filters. Add a room to get started."
                    action={canManage ? (
                        <Button variant="primary" onClick={() => navigate('/rooms/new')}>
                            + Add First Room
                        </Button>
                    ) : undefined}
                />
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                type="danger"
                title="Delete Room"
                message="Are you sure you want to delete this room? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
};

export default RoomList;

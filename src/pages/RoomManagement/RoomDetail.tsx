/**
 * Room Detail - View Page
 * Read-only view of room details with layout preview
 */

import { FC, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    Badge,
    LoadingSpinner,
} from '@/components';
import { roomService } from '@/services/modules/roomService';
import { usePermissions } from '@/hooks/usePermissions';

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

const SIDE_COLORS = [
    'bg-blue-200 dark:bg-blue-800',
    'bg-green-200 dark:bg-green-800',
    'bg-purple-200 dark:bg-purple-800',
    'bg-orange-200 dark:bg-orange-800',
    'bg-pink-200 dark:bg-pink-800',
];

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
    created_at?: string;
    updated_at?: string;
}

const RoomDetail: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { isFullAccess, isSuperAdmin } = usePermissions();
    const canManage = isFullAccess || isSuperAdmin;

    const [room, setRoom] = useState<IRoom | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchRoom(id);
    }, [id]);

    const fetchRoom = async (roomId: string) => {
        try {
            setLoading(true);
            const res = await roomService.getById(roomId);
            setRoom(res?.data || res);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load room');
            navigate('/rooms');
        } finally {
            setLoading(false);
        }
    };

    const totalSeats = useMemo(() => {
        if (!room?.seating_layout || room.seating_layout.length === 0) return 0;
        return room.seating_layout.reduce(
            (sum: number, s: any) => sum + (s.rows || 0) * (s.columns || 0),
            0,
        );
    }, [room]);

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading room..." />;
    }

    if (!room) return null;

    const layout = room.seating_layout || [];
    const facilities = [
        room.has_projector && 'Projector',
        room.has_ac && 'AC',
        room.has_computers && 'Computers',
    ].filter(Boolean);

    return (
        <div className="space-y-6">
            <PageHeader
                title={room.room_name}
                subtitle="Room details and seating layout"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Rooms', href: '/rooms' },
                    { label: room.room_name, href: '#' },
                ]}
            />

            {/* Info Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <InfoCard label="Room Type">
                    <Badge variant={ROOM_TYPE_BADGE_VARIANT[room.room_type] || 'secondary' as any}>
                        {room.room_type}
                    </Badge>
                </InfoCard>
                <InfoCard label="Building" value={room.building || '-'} />
                <InfoCard label="Floor" value={room.floor != null ? `Floor ${room.floor}` : '-'} />
                <InfoCard label="Total Capacity" value={`${room.capacity} seats`} />
                <InfoCard label="Layout Seats" value={totalSeats > 0 ? `${totalSeats} seats` : 'Not configured'} />
                <InfoCard label="Status">
                    <Badge variant={room.is_active !== false ? 'success' : 'danger'}>
                        {room.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                </InfoCard>
            </div>

            {/* Seating Layout + Preview */}
            {layout.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Layout Details */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Seating Layout Details
                        </h3>
                        <div className="space-y-3">
                            {layout.map((side: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${SIDE_COLORS[i % SIDE_COLORS.length]}`} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {side.name || `Side ${i + 1}`}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {side.rows} rows x {side.columns} cols = <span className="font-medium text-gray-700 dark:text-gray-300">{side.rows * side.columns}</span> seats
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalSeats} seats</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Layout Preview
                        </h3>
                        <LayoutPreview sides={layout} />
                    </div>
                </div>
            )}

            {/* Facilities & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Facilities</h3>
                    {facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {facilities.map((f) => (
                                <Badge key={f as string} variant="info">{f as string}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">No facilities listed</p>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Notes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {room.notes || 'No notes added'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => navigate('/rooms')}>
                    Back to Rooms
                </Button>
                {canManage && (
                    <Button variant="primary" onClick={() => navigate(`/rooms/${room.id}/edit`)}>
                        Edit Room
                    </Button>
                )}
            </div>
        </div>
    );
};

// ──────────── Info Card ────────────

const InfoCard: FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        {children || <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>}
    </div>
);

// ──────────── Layout Preview ────────────

const LayoutPreview: FC<{ sides: any[] }> = ({ sides }) => {
    const validSides = sides.filter((s: any) => s.rows > 0 && s.columns > 0);
    if (validSides.length === 0) return null;

    const maxRows = Math.max(...validSides.map((s: any) => s.rows || 0));
    const scale = Math.min(1, 14 / maxRows);

    return (
        <div className="flex items-start justify-center gap-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {validSides.map((side: any, sIdx: number) => {
                const rows = Math.min(side.rows || 0, 15);
                const cols = Math.min(side.columns || 0, 10);
                return (
                    <div key={sIdx} className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {side.name || `Side ${sIdx + 1}`}
                        </span>
                        <div className="flex flex-col gap-[2px]">
                            {Array.from({ length: rows }, (_, r) => (
                                <div key={r} className="flex gap-[2px]">
                                    {Array.from({ length: cols }, (_, c) => (
                                        <div
                                            key={c}
                                            className={`rounded-sm ${SIDE_COLORS[sIdx % SIDE_COLORS.length]}`}
                                            style={{
                                                width: `${Math.max(10, 16 * scale)}px`,
                                                height: `${Math.max(8, 12 * scale)}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1.5">
                            {side.rows}x{side.columns}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default RoomDetail;

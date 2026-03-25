/**
 * Room Form - Create / Edit Room
 * Full-page form with template picker, dynamic sides, and live preview
 */

import { FC, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    FormField,
    FormSelect,
    FormInput,
    FormTextarea,
    LoadingSpinner,
} from '@/components';
import { roomService } from '@/services/modules/roomService';

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

const LAYOUT_TEMPLATES = [
    { value: 'single', label: 'Single Block', description: 'No aisle - one continuous block', sides: 1 },
    { value: 'two-sides', label: 'Two Sides with Center Aisle', description: 'Most common exam hall layout', sides: 2 },
    { value: 'three-sections', label: 'Three Sections', description: 'Two aisles dividing three blocks', sides: 3 },
    { value: 'custom', label: 'Custom', description: 'Add any number of sides manually', sides: 0 },
];

const SIDE_COLORS = [
    'bg-blue-200 dark:bg-blue-800',
    'bg-green-200 dark:bg-green-800',
    'bg-purple-200 dark:bg-purple-800',
    'bg-orange-200 dark:bg-orange-800',
    'bg-pink-200 dark:bg-pink-800',
];

// ──────────── Types ────────────

interface ISide {
    name: string;
    rows: string;
    columns: string;
}

interface IFormData {
    room_name: string;
    room_type: string;
    building: string;
    floor: string;
    capacity: string;
    has_projector: boolean;
    has_ac: boolean;
    has_computers: boolean;
    notes: string;
    layout_template: string;
    sides: ISide[];
}

interface IFormErrors {
    room_name?: string;
    room_type?: string;
    capacity?: string;
}

const DEFAULT_SIDE = (name: string): ISide => ({ name, rows: '', columns: '' });

const INITIAL_FORM: IFormData = {
    room_name: '',
    room_type: '',
    building: '',
    floor: '',
    capacity: '',
    has_projector: false,
    has_ac: false,
    has_computers: false,
    notes: '',
    layout_template: '',
    sides: [],
};

// ──────────── Component ────────────

const RoomForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [formData, setFormData] = useState<IFormData>(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState<IFormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingRoom, setLoadingRoom] = useState(false);

    // Load room data for edit
    useEffect(() => {
        if (isEdit && id) {
            loadRoom(id);
        }
    }, [id]);

    const loadRoom = async (roomId: string) => {
        try {
            setLoadingRoom(true);
            const room = await roomService.getById(roomId);
            const data = room?.data || room;
            const layout = data.seating_layout || [];
            let template = 'custom';
            if (layout.length === 1) template = 'single';
            else if (layout.length === 2) template = 'two-sides';
            else if (layout.length === 3) template = 'three-sections';

            setFormData({
                room_name: data.room_name || '',
                room_type: data.room_type || '',
                building: data.building || '',
                floor: data.floor != null ? String(data.floor) : '',
                capacity: String(data.capacity || ''),
                has_projector: !!data.has_projector,
                has_ac: !!data.has_ac,
                has_computers: !!data.has_computers,
                notes: data.notes || '',
                layout_template: layout.length > 0 ? template : '',
                sides: layout.map((s: any) => ({
                    name: s.name || '',
                    rows: s.rows != null ? String(s.rows) : '',
                    columns: s.columns != null ? String(s.columns) : '',
                })),
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to load room');
            navigate('/rooms');
        } finally {
            setLoadingRoom(false);
        }
    };

    // ── Computed capacity ──

    const computedCapacity = useMemo(() => {
        if (formData.sides.length === 0) return 0;
        return formData.sides.reduce((sum, side) => {
            const r = parseInt(side.rows) || 0;
            const c = parseInt(side.columns) || 0;
            return sum + r * c;
        }, 0);
    }, [formData.sides]);

    useEffect(() => {
        if (formData.sides.length > 0 && computedCapacity > 0) {
            setFormData((prev) => ({ ...prev, capacity: String(computedCapacity) }));
        }
    }, [computedCapacity]);

    // ── Template / Sides ──

    const handleTemplateChange = (template: string) => {
        let sides: ISide[] = [];
        if (template === 'single') {
            sides = [DEFAULT_SIDE('Main')];
        } else if (template === 'two-sides') {
            sides = [DEFAULT_SIDE('Side-A'), DEFAULT_SIDE('Side-B')];
        } else if (template === 'three-sections') {
            sides = [DEFAULT_SIDE('Left'), DEFAULT_SIDE('Center'), DEFAULT_SIDE('Right')];
        }
        setFormData({
            ...formData,
            layout_template: template,
            sides: template === 'custom' ? formData.sides : sides,
        });
    };

    const handleSideChange = (index: number, field: keyof ISide, value: string) => {
        const updated = [...formData.sides];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, sides: updated });
    };

    const addSide = () => {
        const nextLetter = String.fromCharCode(65 + formData.sides.length);
        setFormData({
            ...formData,
            sides: [...formData.sides, DEFAULT_SIDE(`Side-${nextLetter}`)],
        });
    };

    const removeSide = (index: number) => {
        if (formData.sides.length <= 1) return;
        setFormData({
            ...formData,
            sides: formData.sides.filter((_, i) => i !== index),
        });
    };

    // ── Validation & Save ──

    const validateForm = (): boolean => {
        const errors: IFormErrors = {};
        if (!formData.room_name.trim()) errors.room_name = 'Room name is required';
        if (!formData.room_type) errors.room_type = 'Room type is required';
        if (!formData.capacity || parseInt(formData.capacity) <= 0) {
            errors.capacity = 'Capacity must be a positive number';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const validSides = formData.sides.filter((s) => s.rows && s.columns);
            const seatingLayout = validSides.length > 0
                ? validSides.map((s) => ({
                      name: s.name || 'Side',
                      rows: parseInt(s.rows),
                      columns: parseInt(s.columns),
                  }))
                : null;

            const payload: any = {
                room_name: formData.room_name.trim(),
                room_type: formData.room_type,
                building: formData.building.trim() || null,
                floor: formData.floor ? parseInt(formData.floor) : null,
                seating_layout: seatingLayout,
                capacity: parseInt(formData.capacity),
                has_projector: formData.has_projector,
                has_ac: formData.has_ac,
                has_computers: formData.has_computers,
                notes: formData.notes.trim() || null,
            };

            if (isEdit && id) {
                await roomService.update(id, payload);
                toast.success('Room updated successfully');
            } else {
                await roomService.create(payload);
                toast.success('Room created successfully');
            }
            navigate('/rooms');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save room');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingRoom) {
        return <LoadingSpinner fullHeight message="Loading room..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={isEdit ? 'Edit Room' : 'Add Room'}
                subtitle={isEdit ? 'Update room details and seating layout' : 'Create a new room with seating layout'}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Rooms', href: '/rooms' },
                    { label: isEdit ? 'Edit' : 'Add', href: '#' },
                ]}
            />

            {/* Basic Info - Full Width */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField label="Room Name / Number" required error={formErrors.room_name}>
                        <FormInput
                            type="text"
                            value={formData.room_name}
                            onChange={(e) => {
                                setFormData({ ...formData, room_name: e.target.value });
                                setFormErrors({ ...formErrors, room_name: undefined });
                            }}
                            placeholder="e.g., Room-101"
                        />
                    </FormField>
                    <FormField label="Room Type" required error={formErrors.room_type}>
                        <FormSelect
                            value={formData.room_type}
                            placeholder="Select Room Type"
                            onChange={(e) => {
                                setFormData({ ...formData, room_type: e.target.value });
                                setFormErrors({ ...formErrors, room_type: undefined });
                            }}
                            options={ROOM_TYPES}
                        />
                    </FormField>
                    <FormField label="Building">
                        <FormInput
                            type="text"
                            value={formData.building}
                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                            placeholder="e.g., Block A"
                        />
                    </FormField>
                    <FormField label="Floor">
                        <FormInput
                            type="number"
                            value={formData.floor}
                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                            placeholder="e.g., 2"
                        />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <FormField label="Total Capacity" required error={formErrors.capacity}>
                        <FormInput
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => {
                                setFormData({ ...formData, capacity: e.target.value });
                                setFormErrors({ ...formErrors, capacity: undefined });
                            }}
                            placeholder="e.g., 60"
                        />
                    </FormField>
                    <FormField label="Facilities">
                        <div className="flex flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.has_projector}
                                    onChange={(e) => setFormData({ ...formData, has_projector: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Projector</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.has_ac}
                                    onChange={(e) => setFormData({ ...formData, has_ac: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">AC</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.has_computers}
                                    onChange={(e) => setFormData({ ...formData, has_computers: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Computers</span>
                            </label>
                        </div>
                    </FormField>
                </div>
                <div className="mt-4">
                    <FormField label="Notes">
                        <FormTextarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes about the room..."
                            rows={2}
                        />
                    </FormField>
                </div>
            </div>

            {/* Seating Layout + Preview - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Seating Layout */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                            Seating Layout
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Define the physical desk arrangement. Each side represents a block of seats separated by an aisle. Capacity auto-calculates from the layout.
                        </p>

                        {/* Template Picker */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {LAYOUT_TEMPLATES.map((tmpl) => (
                                <button
                                    key={tmpl.value}
                                    type="button"
                                    onClick={() => handleTemplateChange(tmpl.value)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                        formData.layout_template === tmpl.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex justify-center gap-1 mb-3 h-8">
                                        {tmpl.value === 'single' && (
                                            <div className="w-12 h-8 bg-blue-200 dark:bg-blue-800 rounded" />
                                        )}
                                        {tmpl.value === 'two-sides' && (
                                            <>
                                                <div className="w-6 h-8 bg-blue-200 dark:bg-blue-800 rounded" />
                                                <div className="w-1.5 h-8" />
                                                <div className="w-6 h-8 bg-green-200 dark:bg-green-800 rounded" />
                                            </>
                                        )}
                                        {tmpl.value === 'three-sections' && (
                                            <>
                                                <div className="w-4 h-8 bg-blue-200 dark:bg-blue-800 rounded" />
                                                <div className="w-1 h-8" />
                                                <div className="w-4 h-8 bg-green-200 dark:bg-green-800 rounded" />
                                                <div className="w-1 h-8" />
                                                <div className="w-4 h-8 bg-purple-200 dark:bg-purple-800 rounded" />
                                            </>
                                        )}
                                        {tmpl.value === 'custom' && (
                                            <div className="flex items-center justify-center w-12 h-8 text-xl text-gray-400">+</div>
                                        )}
                                    </div>
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {tmpl.label}
                                    </div>
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        {tmpl.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Side Inputs */}
                        {formData.sides.length > 0 && (
                            <div className="space-y-3">
                                {formData.sides.map((side, index) => (
                                    <div key={index} className="flex items-end gap-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                                        <div className="w-32">
                                            <FormField label={index === 0 ? 'Side Name' : ''}>
                                                <FormInput
                                                    type="text"
                                                    value={side.name}
                                                    onChange={(e) => handleSideChange(index, 'name', e.target.value)}
                                                    placeholder="Side-A"
                                                />
                                            </FormField>
                                        </div>
                                        <div className="w-24">
                                            <FormField label={index === 0 ? 'Rows' : ''}>
                                                <FormInput
                                                    type="number"
                                                    value={side.rows}
                                                    onChange={(e) => handleSideChange(index, 'rows', e.target.value)}
                                                    placeholder="10"
                                                    min="1"
                                                />
                                            </FormField>
                                        </div>
                                        <div className="w-24">
                                            <FormField label={index === 0 ? 'Columns' : ''}>
                                                <FormInput
                                                    type="number"
                                                    value={side.columns}
                                                    onChange={(e) => handleSideChange(index, 'columns', e.target.value)}
                                                    placeholder="3"
                                                    min="1"
                                                />
                                            </FormField>
                                        </div>
                                        <div className="pb-1 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            = {(parseInt(side.rows) || 0) * (parseInt(side.columns) || 0)} seats
                                        </div>
                                        {formData.sides.length > 1 && (
                                            <Button size="sm" variant="danger" onClick={() => removeSide(index)} className="mb-0.5">
                                                x
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {formData.layout_template === 'custom' && (
                                    <Button size="sm" variant="outline" onClick={addSide}>
                                        + Add Side
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Layout Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6 h-full">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                            Layout Preview
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                            Visual representation of the room layout
                        </p>

                        {formData.sides.some((s) => parseInt(s.rows) > 0 && parseInt(s.columns) > 0) ? (
                            <>
                                <LayoutPreview sides={formData.sides} />
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Total Seats</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{computedCapacity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500 dark:text-gray-400">Sides</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formData.sides.filter(s => parseInt(s.rows) > 0).length}</span>
                                    </div>
                                    {formData.sides.filter(s => parseInt(s.rows) > 0 && parseInt(s.columns) > 0).map((s, i) => (
                                        <div key={i} className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-400">{s.name || `Side ${i + 1}`}</span>
                                            <span className="text-gray-500">{s.rows} x {s.columns} = {(parseInt(s.rows) || 0) * (parseInt(s.columns) || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                Select a layout template to see preview
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => navigate('/rooms')}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} isLoading={submitting} loadingText="Saving...">
                    {isEdit ? 'Update Room' : 'Create Room'}
                </Button>
            </div>
        </div>
    );
};

// ──────────── Layout Preview ────────────

const LayoutPreview: FC<{ sides: ISide[] }> = ({ sides }) => {
    const validSides = sides.filter((s) => parseInt(s.rows) > 0 && parseInt(s.columns) > 0);
    if (validSides.length === 0) return null;

    const maxRows = Math.max(...validSides.map((s) => parseInt(s.rows) || 0));
    const scale = Math.min(1, 12 / maxRows);

    return (
        <div className="flex items-start justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {validSides.map((side, sIdx) => {
                const rows = Math.min(parseInt(side.rows) || 0, 15);
                const cols = Math.min(parseInt(side.columns) || 0, 10);
                return (
                    <div key={sIdx} className="flex flex-col items-center">
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
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
                                                width: `${Math.max(8, 14 * scale)}px`,
                                                height: `${Math.max(6, 10 * scale)}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">
                            {side.rows}x{side.columns}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default RoomForm;

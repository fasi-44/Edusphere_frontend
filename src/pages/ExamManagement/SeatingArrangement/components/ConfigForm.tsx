/**
 * ConfigForm
 * Modal form for creating/editing a seating configuration.
 * Includes column picker per class assignment.
 */

import { FC, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, FormField, FormSelect, FormTextarea, Button } from '@/components';
import { classService } from '@/services/modules/classService';
import { roomService } from '@/services/modules/roomService';
import { teacherService } from '@/services/modules/teacherService';
import { examService } from '@/services/modules/examService';
import { seatingService } from '@/services/modules/seatingService';
import { useAuthStore } from '@/stores/authStore';
import type { ISeatingConfig, IFormData, IFormClassAssignment } from '../types';
import { CLASS_COLORS, INITIAL_FORM } from '../types';
import { formatDate, formatTime, getTotalColumns } from '../utils';
import ColumnPicker from './ColumnPicker';

interface ConfigFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingConfig: ISeatingConfig | null;
}

const ConfigForm: FC<ConfigFormProps> = ({ isOpen, onClose, onSaved, editingConfig }) => {
    const currentAcademicYear = useAuthStore((s) => s.user?.current_academic_year);

    const [formData, setFormData] = useState<IFormData>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    // Dropdown data
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [sectionsByClass, setSectionsByClass] = useState<Record<string, any[]>>({});
    const [examSlots, setExamSlots] = useState<any[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    const isEditing = !!editingConfig;
    const isGenerated = editingConfig?.is_generated ?? false;

    useEffect(() => {
        if (isOpen) {
            loadDropdowns();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && editingConfig) {
            setFormData({
                exam_type_id: String(editingConfig.exam_type_id),
                room_id: String(editingConfig.room_id),
                invigilator_id: editingConfig.invigilator_id ? String(editingConfig.invigilator_id) : '',
                exam_date: editingConfig.exam_date,
                start_time: editingConfig.start_time,
                end_time: editingConfig.end_time,
                notes: editingConfig.notes || '',
                class_assignments: editingConfig.class_assignments.map(a => ({
                    class_id: String(a.class_id),
                    section_id: a.section_id ? String(a.section_id) : '',
                    columns: a.columns || [],
                })),
            });
            editingConfig.class_assignments.forEach(a => loadSectionsForClass(String(a.class_id)));
            if (editingConfig.exam_type_id) loadExamSlots(String(editingConfig.exam_type_id));
        } else if (isOpen && !editingConfig) {
            setFormData(INITIAL_FORM);
            setFormErrors([]);
        }
    }, [isOpen, editingConfig]);

    const loadDropdowns = async () => {
        setLoadingDropdowns(true);
        try {
            const [examRes, classRes, roomRes, teacherRes] = await Promise.all([
                examService.list(),
                classService.list(),
                roomService.list(),
                teacherService.list(),
            ]);
            setExamTypes(Array.isArray(examRes) ? examRes : examRes?.data || []);
            setClasses(Array.isArray(classRes) ? classRes : classRes?.data || []);
            const roomList = Array.isArray(roomRes) ? roomRes : roomRes?.data || [];
            setRooms(roomList.filter((r: any) => r.seating_layout?.length > 0));
            setTeachers(teacherRes?.data || []);
        } catch {
            toast.error('Failed to load form data');
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const loadExamSlots = async (examTypeId: string) => {
        if (!examTypeId) { setExamSlots([]); return; }
        try {
            const filters: any = { exam_type_id: Number(examTypeId) };
            if (currentAcademicYear?.id) filters.academic_year_id = currentAcademicYear.id;
            const data = await examService.getExamTimetables(filters);
            const slots = Array.isArray(data) ? data : (data?.data || []);
            const seen = new Set<string>();
            const unique: any[] = [];
            for (const e of slots) {
                const key = `${e.exam_date}|${e.start_time}|${e.end_time}`;
                if (!seen.has(key)) { seen.add(key); unique.push(e); }
            }
            setExamSlots(unique);
        } catch {
            setExamSlots([]);
        }
    };

    const loadSectionsForClass = async (classId: string) => {
        if (!classId || sectionsByClass[classId]) return;
        try {
            const sections = await classService.getSections(classId);
            setSectionsByClass(prev => ({ ...prev, [classId]: sections }));
        } catch { /* ignore */ }
    };

    // The selected room object
    const selectedRoom = useMemo(
        () => rooms.find((r: any) => String(r.id) === formData.room_id),
        [rooms, formData.room_id]
    );

    const totalRoomCols = useMemo(
        () => selectedRoom ? getTotalColumns(selectedRoom.seating_layout || []) : 0,
        [selectedRoom]
    );

    // Map of absCol → class assignment index (for all OTHER assignments)
    const takenColumnsFor = (assignmentIndex: number): Record<number, number> => {
        const taken: Record<number, number> = {};
        formData.class_assignments.forEach((a, i) => {
            if (i !== assignmentIndex) {
                a.columns.forEach(col => { taken[col] = i; });
            }
        });
        return taken;
    };

    const handleClassAssignmentChange = (index: number, field: keyof IFormClassAssignment, value: any) => {
        const updated = [...formData.class_assignments];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'class_id') {
            updated[index].section_id = '';
            updated[index].columns = [];
            if (value) loadSectionsForClass(value);
        }
        if (field === 'room_id') {
            // reset all columns when room changes
            updated.forEach(a => { a.columns = []; });
        }
        setFormData(prev => ({ ...prev, class_assignments: updated }));
    };

    const addClassAssignment = () => {
        setFormData(prev => ({
            ...prev,
            class_assignments: [...prev.class_assignments, { class_id: '', section_id: '', columns: [] }],
        }));
    };

    const removeClassAssignment = (index: number) => {
        if (formData.class_assignments.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            class_assignments: prev.class_assignments.filter((_, i) => i !== index),
        }));
    };

    const buildPayload = () => {
        const validAssignments = formData.class_assignments.filter(a => a.class_id);
        return {
            academic_year_id: currentAcademicYear!.id,
            exam_type_id: Number(formData.exam_type_id),
            room_id: Number(formData.room_id),
            invigilator_id: formData.invigilator_id ? Number(formData.invigilator_id) : null,
            exam_date: formData.exam_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            notes: formData.notes || undefined,
            class_assignments: validAssignments.map(a => ({
                class_id: Number(a.class_id),
                section_id: a.section_id ? Number(a.section_id) : undefined,
                columns: a.columns,
            })),
        };
    };

    const handleSave = async () => {
        if (!currentAcademicYear?.id) { toast.error('No academic year selected'); return; }
        if (!formData.exam_type_id || !formData.room_id || !formData.exam_date || !formData.start_time || !formData.end_time) {
            toast.error('Please fill all required fields'); return;
        }
        const validAssignments = formData.class_assignments.filter(a => a.class_id);
        if (validAssignments.length === 0) { toast.error('Add at least one class assignment'); return; }

        const missingColumns = validAssignments.filter(a => a.columns.length === 0);
        if (missingColumns.length > 0) {
            toast.error('Select at least one column for each class assignment'); return;
        }

        // Validate conflicts
        setValidating(true);
        try {
            const payload = buildPayload();
            const { valid, errors } = await seatingService.validateConfig(
                payload,
                isEditing ? editingConfig!.id : undefined
            );
            if (!valid) {
                setFormErrors(errors);
                errors.forEach(e => toast.error(e));
                setValidating(false);
                return;
            }
            setFormErrors([]);
        } catch {
            toast.error('Validation failed'); setValidating(false); return;
        }
        setValidating(false);

        setSaving(true);
        try {
            const payload = buildPayload();
            if (isEditing) {
                // When generated, only send mutable fields, then auto-generate incrementally
                const updatePayload = isGenerated
                    ? { class_assignments: payload.class_assignments, invigilator_id: payload.invigilator_id, notes: payload.notes }
                    : payload;
                await seatingService.updateConfig(editingConfig!.id, updatePayload);
                if (isGenerated) {
                    // Auto-generate to seat students from any newly added class assignments
                    const result = await seatingService.generateSeating(editingConfig!.id);
                    toast.success(result.message || `${result.newly_seated} new students seated`);
                    if (result.unassigned_remaining > 0) {
                        toast(`${result.unassigned_remaining} students could not be seated (columns full)`, { icon: '⚠️' });
                    }
                } else {
                    toast.success('Configuration updated');
                }
            } else {
                await seatingService.createConfig(payload);
                toast.success('Configuration created');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const slotValue = formData.exam_date && formData.start_time
        ? `${formData.exam_date}|${formData.start_time}|${formData.end_time}`
        : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? (isGenerated ? 'Add Classes to Configuration' : 'Edit Seating Configuration') : 'New Seating Configuration'}
            size="5xl"
        >
            <div className="space-y-5">
                {/* Conflict errors from validation */}
                {formErrors.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-1">
                        {formErrors.map((e, i) => (
                            <p key={i} className="text-sm text-red-600 dark:text-red-400">⚠ {e}</p>
                        ))}
                    </div>
                )}

                {/* Core fields — locked after generation */}
                {isGenerated && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                        Seating is already generated. You can add new class assignments — they will be seated automatically on save. Clear the plan to change room or slot.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Exam Type" required>
                        <FormSelect
                            value={formData.exam_type_id}
                            onChange={e => {
                                const val = e.target.value;
                                setFormData(prev => ({ ...prev, exam_type_id: val, exam_date: '', start_time: '', end_time: '' }));
                                loadExamSlots(val);
                            }}
                            disabled={isGenerated}
                            placeholder="Select Exam Type"
                            options={examTypes.map((et: any) => ({ value: String(et.id), label: et.exam_name }))}
                        />
                    </FormField>

                    <FormField label="Room" required>
                        <FormSelect
                            value={formData.room_id}
                            onChange={e => {
                                const val = e.target.value;
                                // Reset columns for all assignments when room changes
                                setFormData(prev => ({
                                    ...prev,
                                    room_id: val,
                                    class_assignments: prev.class_assignments.map(a => ({ ...a, columns: [] })),
                                }));
                            }}
                            disabled={isGenerated}
                            placeholder="Select Room"
                            options={rooms.map((r: any) => ({
                                value: String(r.id),
                                label: `${r.room_name} (${r.capacity} seats)`,
                            }))}
                        />
                    </FormField>
                </div>

                {selectedRoom && !isGenerated && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                        <strong>{selectedRoom.room_name}</strong> — {selectedRoom.capacity} seats |{' '}
                        Layout: {selectedRoom.seating_layout?.map((s: any) => `${s.name}: ${s.rows}×${s.columns}`).join(', ')}
                        {selectedRoom.building && ` | Building: ${selectedRoom.building}`}
                    </div>
                )}

                <FormField label="Exam Slot" required>
                    <FormSelect
                        value={slotValue}
                        onChange={e => {
                            const val = e.target.value;
                            if (val) {
                                const [date, start, end] = val.split('|');
                                setFormData(prev => ({ ...prev, exam_date: date, start_time: start, end_time: end }));
                            } else {
                                setFormData(prev => ({ ...prev, exam_date: '', start_time: '', end_time: '' }));
                            }
                        }}
                        disabled={isGenerated || !formData.exam_type_id || examSlots.length === 0}
                        placeholder={
                            !formData.exam_type_id ? 'Select Exam Type first'
                            : examSlots.length === 0 ? 'No timetable slots found'
                            : 'Select Exam Slot'
                        }
                        options={examSlots.map((slot: any) => ({
                            value: `${slot.exam_date}|${slot.start_time}|${slot.end_time}`,
                            label: `${formatDate(slot.exam_date)} | ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}${slot.subject_name ? ` (${slot.subject_name})` : ''}`,
                        }))}
                    />
                </FormField>

                <FormField label="Invigilator">
                    <FormSelect
                        value={formData.invigilator_id}
                        onChange={e => setFormData(prev => ({ ...prev, invigilator_id: e.target.value }))}
                        placeholder="Select Invigilator (optional)"
                        options={teachers.map((t: any) => ({
                            value: String(t.user_id || t.id),
                            label: `${t.first_name} ${t.last_name}`,
                        }))}
                    />
                </FormField>

                {/* Class Assignments */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Class Assignments <span className="text-red-500">*</span>
                        </label>
                        <Button size="sm" variant="outline" onClick={addClassAssignment}>
                            + Add Class
                        </Button>
                    </div>

                    {!selectedRoom && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Select a room first to enable column assignment.
                        </p>
                    )}

                    <div className="space-y-4">
                        {formData.class_assignments.map((assignment, index) => {
                            const color = CLASS_COLORS[index % CLASS_COLORS.length];
                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg border p-3 ${color.bg} ${color.border} border`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-semibold ${color.text}`}>
                                            Class Assignment {index + 1}
                                        </span>
                                        {formData.class_assignments.length > 1 && (
                                            <Button size="sm" variant="danger" onClick={() => removeClassAssignment(index)}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <FormField label="Class" required>
                                            <FormSelect
                                                value={assignment.class_id}
                                                onChange={e => handleClassAssignmentChange(index, 'class_id', e.target.value)}
                                                placeholder="Select Class"
                                                options={classes.map((c: any) => ({ value: String(c.id), label: c.class_name }))}
                                            />
                                        </FormField>
                                        <FormField label="Section (optional)">
                                            <FormSelect
                                                value={assignment.section_id}
                                                onChange={e => handleClassAssignmentChange(index, 'section_id', e.target.value)}
                                                placeholder="All Sections"
                                                options={(sectionsByClass[assignment.class_id] || []).map((s: any) => ({
                                                    value: String(s.id),
                                                    label: s.section_name,
                                                }))}
                                            />
                                        </FormField>
                                    </div>

                                    {/* Column Picker */}
                                    {selectedRoom && selectedRoom.seating_layout?.length > 0 ? (
                                        <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Select columns for this class:
                                            </p>
                                            <ColumnPicker
                                                layout={selectedRoom.seating_layout}
                                                selectedColumns={assignment.columns}
                                                takenColumns={takenColumnsFor(index)}
                                                classIndex={index}
                                                onChange={cols => handleClassAssignmentChange(index, 'columns', cols)}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            Select a room to assign columns.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <FormField label="Notes">
                    <FormTextarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes for this configuration"
                        rows={2}
                    />
                </FormField>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || validating}>
                        {validating ? 'Validating...' : saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfigForm;

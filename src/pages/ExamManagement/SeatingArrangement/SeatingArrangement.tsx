/**
 * Seating Arrangement — Main Page
 * Orchestrates ConfigCard, ConfigForm, and SeatingGridModal.
 */

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
    FormSelect,
} from '@/components';
import { seatingService } from '@/services/modules/seatingService';
import { examService } from '@/services/modules/examService';
import { useAuthStore } from '@/stores/authStore';
import type { ISeatingConfig } from './types';
import ConfigCard from './components/ConfigCard';
import ConfigForm from './components/ConfigForm';
import SeatingGridModal from './components/SeatingGridModal';

const SeatingArrangement: FC = () => {
    const currentAcademicYear = useAuthStore((s) => s.user?.current_academic_year);
    const academicYearVersion = useAuthStore((s) => s.academicYearVersion);

    // ── Data state ──
    const [configs, setConfigs] = useState<ISeatingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [conflictsMap, setConflictsMap] = useState<Record<number, string[]>>({});

    // ── Filter ──
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [filterExamType, setFilterExamType] = useState('');

    // ── Form modal ──
    const [formOpen, setFormOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<ISeatingConfig | null>(null);

    // ── Grid modal ──
    const [gridOpen, setGridOpen] = useState(false);
    const [gridLoading, setGridLoading] = useState(false);
    const [gridConfigs, setGridConfigs] = useState<ISeatingConfig[]>([]);

    // ── Delete confirm ──
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // ── Load configs ──

    const loadConfigs = useCallback(async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (currentAcademicYear?.id) filters.academic_year_id = currentAcademicYear.id;
            if (filterExamType) filters.exam_type_id = Number(filterExamType);
            const data = await seatingService.getConfigs(filters);
            setConfigs(data);
            // Validate each config for conflicts
            validateAllConfigs(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load seating configurations');
        } finally {
            setLoading(false);
        }
    }, [currentAcademicYear?.id, filterExamType]);

    useEffect(() => { loadConfigs(); }, [loadConfigs, academicYearVersion]);

    useEffect(() => {
        examService.list()
            .then(res => setExamTypes(Array.isArray(res) ? res : res?.data || []))
            .catch(() => {});
    }, []);

    // ── Validate all configs for conflict detection ──

    const validateAllConfigs = async (cfgList: ISeatingConfig[]) => {
        const newMap: Record<number, string[]> = {};
        await Promise.all(
            cfgList.map(async (cfg) => {
                try {
                    const payload = {
                        academic_year_id: cfg.academic_year_id,
                        exam_type_id: cfg.exam_type_id,
                        room_id: cfg.room_id,
                        exam_date: cfg.exam_date,
                        start_time: cfg.start_time,
                        end_time: cfg.end_time,
                        class_assignments: cfg.class_assignments,
                    };
                    const { valid, errors } = await seatingService.validateConfig(payload, cfg.id);
                    newMap[cfg.id] = valid ? [] : errors;
                } catch {
                    newMap[cfg.id] = [];
                }
            })
        );
        setConflictsMap(newMap);
    };

    // ── Generate ──

    const handleGenerate = async (configId: number) => {
        try {
            setSaving(true);
            const result = await seatingService.generateSeating(configId);
            toast.success(result.message || `${result.newly_seated} students seated`);
            if (result.unassigned_remaining > 0) {
                toast(`${result.unassigned_remaining} students could not be seated (columns full)`, {
                    icon: '⚠️',
                });
            }
            loadConfigs();
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate seating');
        } finally {
            setSaving(false);
        }
    };

    // ── Clear ──

    const handleClear = async (configId: number) => {
        try {
            setSaving(true);
            await seatingService.clearSeating(configId);
            toast.success('Seating plan cleared');
            loadConfigs();
        } catch (err: any) {
            toast.error(err.message || 'Failed to clear seating');
        } finally {
            setSaving(false);
        }
    };

    // ── View grid ──

    const handleViewGrid = async (config: ISeatingConfig) => {
        setGridLoading(true);
        setGridOpen(true);
        try {
            const detail = await seatingService.getConfigById(config.id);
            setGridConfigs([detail]);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load seating plan');
            setGridOpen(false);
        } finally {
            setGridLoading(false);
        }
    };

    // ── Delete ──

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await seatingService.deleteConfig(deleteId);
            toast.success('Configuration deleted');
            setDeleteId(null);
            loadConfigs();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete');
        }
    };

    // ── Edit ──

    const handleEdit = (config: ISeatingConfig) => {
        setEditingConfig(config);
        setFormOpen(true);
    };

    // ── Group configs by exam type for display ──

    const groupedConfigs = useMemo(() => {
        const groups: Record<string, ISeatingConfig[]> = {};
        configs.forEach(cfg => {
            const key = cfg.exam_type_name || String(cfg.exam_type_id);
            if (!groups[key]) groups[key] = [];
            groups[key].push(cfg);
        });
        return groups;
    }, [configs]);

    const totalConflicts = Object.values(conflictsMap).flat().length;

    return (
        <div>
            <PageHeader
                title="Seating Arrangement"
                subtitle="Configure rooms with classes and generate column-wise exam seating plans"
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <FormSelect
                            value={filterExamType}
                            onChange={(e) => setFilterExamType(e.target.value)}
                            placeholder="All Exam Types"
                            options={examTypes.map((et: any) => ({
                                value: String(et.id),
                                label: et.exam_name,
                            }))}
                            className="w-44"
                        />
                        <Button onClick={() => { setEditingConfig(null); setFormOpen(true); }}>
                            + New Configuration
                        </Button>
                    </div>
                }
            />

            {/* Conflict summary banner */}
            {totalConflicts > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        ⚠ {Object.keys(conflictsMap).filter(k => (conflictsMap[Number(k)] || []).length > 0).length} configuration(s) have conflicts.
                        Resolve them before generating.
                    </p>
                </div>
            )}

            {loading ? (
                <LoadingSpinner message="Loading seating configurations..." />
            ) : configs.length === 0 ? (
                <EmptyState
                    title="No Seating Configurations"
                    message="Create a new configuration to assign classes to rooms for exams."
                    action={
                        <Button onClick={() => { setEditingConfig(null); setFormOpen(true); }}>
                            + New Configuration
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedConfigs).map(([examTypeName, cfgList]) => (
                        <div key={examTypeName}>
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                {examTypeName}
                            </h2>
                            <div className="grid gap-3">
                                {cfgList.map(config => (
                                    <ConfigCard
                                        key={config.id}
                                        config={config}
                                        onEdit={handleEdit}
                                        onDelete={(id) => setDeleteId(id)}
                                        onGenerate={handleGenerate}
                                        onClear={handleClear}
                                        onViewGrid={handleViewGrid}
                                        saving={saving}
                                        conflicts={conflictsMap[config.id] || []}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Form Modal */}
            <ConfigForm
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={loadConfigs}
                editingConfig={editingConfig}
            />

            {/* Seating Grid Modal */}
            <SeatingGridModal
                isOpen={gridOpen}
                onClose={() => { setGridOpen(false); setGridConfigs([]); }}
                configs={gridConfigs}
                loading={gridLoading}
                onRefresh={loadConfigs}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteId !== null}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Seating Configuration"
                message="This will permanently delete this configuration and any generated seating plan. Continue?"
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default SeatingArrangement;

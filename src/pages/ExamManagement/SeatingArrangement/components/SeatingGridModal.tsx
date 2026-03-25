/**
 * SeatingGridModal
 * Full seating grid view with drag-and-drop support.
 * Supports cross-room DnD when multiple configs are passed.
 */

import { FC, useCallback, useMemo, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import toast from 'react-hot-toast';
import { Modal, LoadingSpinner, EmptyState, Button, PrintActions } from '@/components';
import { seatingService } from '@/services/modules/seatingService';
import { generateSeatingArrangementPdf } from '@/prints';
import { useAuthStore } from '@/stores/authStore';
import type { SchoolData, PdfAction } from '@/prints';
import type { ISeatingConfig, ISeatingPlan } from '../types';
import { CLASS_COLORS } from '../types';
import { formatDate, formatTime } from '../utils';

const DND_SEAT = 'SEAT';

// ── Draggable / Droppable Seat Cell ──

interface SeatCellProps {
    plan: ISeatingPlan | null;
    row: number;
    absCol: number;
    configId: number;
    seatLabel: string;
    classColorMap: Record<number, string>;
    onDrop: (
        srcStudent: number, srcConfig: number,
        dstStudent: number | null, dstRow: number, dstCol: number, dstConfig: number, dstLabel: string
    ) => void;
}

const SeatCell: FC<SeatCellProps> = ({ plan, row, absCol, configId, seatLabel, classColorMap, onDrop }) => {
    const [{ isDragging }, drag] = useDrag({
        type: DND_SEAT,
        item: { student_id: plan?.student_id, config_id: configId, seat_row: row, seat_col: absCol },
        canDrag: !!plan,
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_SEAT,
        canDrop: (item: any) => item.student_id !== plan?.student_id,
        drop: (item: any) => {
            onDrop(
                item.student_id, item.config_id,
                plan?.student_id ?? null, row, absCol, configId, seatLabel
            );
        },
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const colorClass = plan?.class_id ? classColorMap[plan.class_id] : '';
    const baseClass = plan
        ? `${colorClass || 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`
        : 'bg-white dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700';

    return (
        <div
            ref={node => { drag(node); drop(node); }}
            className={`
                w-28 h-16 rounded border text-center flex flex-col items-center justify-center p-1 select-none
                transition-all
                ${baseClass}
                ${isDragging ? 'opacity-40 scale-95' : ''}
                ${isOver && canDrop ? 'ring-2 ring-blue-400 scale-105' : ''}
                ${isOver && !canDrop ? 'ring-2 ring-red-400' : ''}
                ${plan ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
            `}
        >
            {plan ? (
                <>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate w-full text-center leading-tight">
                        {plan.student_name}
                    </span>
                    {plan.roll_no && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {plan.roll_no}
                        </span>
                    )}
                    <span className="text-[10px] text-gray-400">{plan.seat_label}</span>
                </>
            ) : (
                <span className="text-[10px] text-gray-300 dark:text-gray-600">Empty</span>
            )}
        </div>
    );
};

// ── Single Room Grid ──

interface RoomGridProps {
    config: ISeatingConfig;
    classColorMap: Record<number, string>;
    onDrop: (
        srcStudent: number, srcConfig: number,
        dstStudent: number | null, dstRow: number, dstCol: number, dstConfig: number, dstLabel: string
    ) => void;
    onPrint: (config: ISeatingConfig, action: PdfAction) => void;
}

const RoomGrid: FC<RoomGridProps> = ({ config, classColorMap, onDrop, onPrint }) => {
    const room = config.room;
    const sides = room?.seating_layout || [];
    const grid = config.seating_grid || [];

    const sideGrids = useMemo(() => {
        let colOffset = 0;
        return sides.map(side => {
            const rows = side.rows;
            const cols = side.columns;
            const map: (ISeatingPlan | null)[][] = [];
            for (let r = 1; r <= rows; r++) {
                const row: (ISeatingPlan | null)[] = [];
                for (let c = 1; c <= cols; c++) {
                    const absCol = colOffset + c;
                    const plan = grid.find(p => p.seat_row === r && p.seat_column === absCol) ?? null;
                    row.push(plan);
                }
                map.push(row);
            }
            colOffset += cols;
            return { side, map, colOffset: colOffset - cols, cols };
        });
    }, [grid, sides]);

    const legend = useMemo(() => {
        const seen = new Map<number, { class_name: string; section_name: string }>();
        grid.forEach(p => {
            if (p.class_id && !seen.has(p.class_id)) {
                seen.set(p.class_id, { class_name: p.class_name || 'Unknown', section_name: p.section_name || '' });
            }
        });
        return Array.from(seen.entries()).map(([id, info]) => ({ class_id: id, ...info, colorClass: classColorMap[id] }));
    }, [grid, classColorMap]);

    return (
        <div className="mb-8">
            {/* Room header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {room?.room_name} — {formatDate(config.exam_date)} | {formatTime(config.start_time)}–{formatTime(config.end_time)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.student_count} students seated
                    </p>
                </div>
                <PrintActions onAction={action => onPrint(config, action)} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-3">
                {legend.map(l => (
                    <div key={l.class_id} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded border ${l.colorClass || 'bg-gray-200'}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {l.class_name}{l.section_name ? ` – ${l.section_name}` : ''}
                        </span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border border-dashed border-gray-300 dark:border-gray-600" />
                    <span className="text-xs text-gray-500">Empty</span>
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <div className="flex gap-6 items-start min-w-max">
                    {sideGrids.map(({ side, map, colOffset, cols }, sIdx) => (
                        <div key={sIdx}>
                            <p className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {side.name || `Side ${sIdx + 1}`}
                            </p>
                            {/* Column headers */}
                            <div className="flex gap-1 mb-1 pl-10">
                                {Array.from({ length: cols }, (_, c) => (
                                    <div key={c} className="w-28 text-center text-[10px] font-medium text-gray-400">
                                        C{colOffset + c + 1}
                                    </div>
                                ))}
                            </div>
                            {/* Rows */}
                            {map.map((row, rIdx) => (
                                <div key={rIdx} className="flex gap-1 mb-1">
                                    <div className="w-10 flex items-center justify-center text-[10px] font-medium text-gray-400">
                                        R{rIdx + 1}
                                    </div>
                                    {row.map((plan, cIdx) => {
                                        const absCol = colOffset + cIdx + 1;
                                        const label = plan?.seat_label || `${side.name || 'S'}-R${rIdx + 1}-C${cIdx + 1}`;
                                        return (
                                            <SeatCell
                                                key={cIdx}
                                                plan={plan}
                                                row={rIdx + 1}
                                                absCol={absCol}
                                                configId={config.id}
                                                seatLabel={label}
                                                classColorMap={classColorMap}
                                                onDrop={onDrop}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main Modal ──

interface SeatingGridModalProps {
    isOpen: boolean;
    onClose: () => void;
    configs: ISeatingConfig[]; // pass 1 for single room, 2+ for cross-room DnD
    loading: boolean;
    onRefresh: () => void;
}

const SeatingGridModal: FC<SeatingGridModalProps> = ({ isOpen, onClose, configs, loading, onRefresh }) => {
    const [pendingChanges, setPendingChanges] = useState<any[]>([]);
    const [localConfigs, setLocalConfigs] = useState<ISeatingConfig[]>([]);
    const [saving, setSaving] = useState(false);

    // Keep local copy for optimistic UI
    useMemo(() => { setLocalConfigs(configs); }, [configs]);

    // Build class color map across all configs
    const classColorMap = useMemo(() => {
        const ids = new Set<number>();
        localConfigs.forEach(c => (c.seating_grid || []).forEach(p => { if (p.class_id) ids.add(p.class_id); }));
        const map: Record<number, string> = {};
        Array.from(ids).forEach((id, idx) => {
            map[id] = `${CLASS_COLORS[idx % CLASS_COLORS.length].bg} ${CLASS_COLORS[idx % CLASS_COLORS.length].border}`;
        });
        return map;
    }, [localConfigs]);

    const handleDrop = useCallback((
        srcStudentId: number, srcConfigId: number,
        dstStudentId: number | null, dstRow: number, dstCol: number, dstConfigId: number, dstLabel: string
    ) => {
        // Optimistic local update
        setLocalConfigs(prev => {
            const next = prev.map(cfg => ({ ...cfg, seating_grid: [...(cfg.seating_grid || [])] }));

            const srcCfg = next.find(c => c.id === srcConfigId)!;
            const dstCfg = next.find(c => c.id === dstConfigId)!;
            const srcPlanIdx = srcCfg.seating_grid!.findIndex(p => p.student_id === srcStudentId);
            const srcPlan = srcCfg.seating_grid![srcPlanIdx];

            if (dstStudentId) {
                // Swap
                const dstPlanIdx = dstCfg.seating_grid!.findIndex(p => p.student_id === dstStudentId);
                const dstPlan = dstCfg.seating_grid![dstPlanIdx];

                const tmpRow = srcPlan.seat_row, tmpCol = srcPlan.seat_column;
                const tmpLabel = srcPlan.seat_label, tmpCfg = srcPlan.config_id;

                srcCfg.seating_grid![srcPlanIdx] = { ...srcPlan, seat_row: dstPlan.seat_row, seat_column: dstPlan.seat_column, seat_label: dstPlan.seat_label, config_id: dstPlan.config_id };
                dstCfg.seating_grid![dstPlanIdx] = { ...dstPlan, seat_row: tmpRow, seat_column: tmpCol, seat_label: tmpLabel, config_id: tmpCfg };

                if (srcConfigId !== dstConfigId) {
                    // Move plans between config arrays
                    const movedSrc = srcCfg.seating_grid!.splice(srcPlanIdx, 1)[0];
                    dstCfg.seating_grid!.push(movedSrc);
                    const movedDst = dstCfg.seating_grid!.splice(dstPlanIdx, 1)[0];
                    srcCfg.seating_grid!.push(movedDst);
                }
            } else {
                // Move to empty
                const moved = { ...srcPlan, seat_row: dstRow, seat_column: dstCol, seat_label: dstLabel, config_id: dstConfigId };
                srcCfg.seating_grid!.splice(srcPlanIdx, 1);
                dstCfg.seating_grid!.push(moved);
            }

            return next;
        });

        // Queue the change
        setPendingChanges(prev => [...prev, {
            seat_a: { config_id: srcConfigId, student_id: srcStudentId },
            seat_b: { config_id: dstConfigId, student_id: dstStudentId ?? undefined, seat_row: dstRow, seat_col: dstCol, seat_label: dstLabel },
        }]);
    }, []);

    const handleSaveChanges = async () => {
        if (pendingChanges.length === 0) return;
        setSaving(true);
        try {
            // Apply changes sequentially
            for (const change of pendingChanges) {
                await seatingService.swapSeats(change);
            }
            setPendingChanges([]);
            toast.success('Seating changes saved');
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save changes');
            setLocalConfigs(configs); // revert
            setPendingChanges([]);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardChanges = () => {
        setLocalConfigs(configs);
        setPendingChanges([]);
    };

    const getSchoolData = (): SchoolData => {
        const authUser = useAuthStore.getState().user;
        return {
            schoolName: authUser?.school_name || 'School Name',
            schoolAddress: '',
            schoolPhone: '',
            schoolEmail: authUser?.email || '',
            logo: null,
            generatedBy: authUser?.full_name || authUser?.name || 'System',
        };
    };

    const handlePrint = async (config: ISeatingConfig, action: PdfAction) => {
        try {
            await generateSeatingArrangementPdf(
                {
                    examTypeName: config.exam_type_name || '',
                    examDate: config.exam_date,
                    startTime: config.start_time,
                    endTime: config.end_time,
                    room: {
                        room_name: config.room?.room_name || '',
                        capacity: config.room?.capacity || 0,
                        seating_layout: config.room?.seating_layout || [],
                    },
                    studentCount: config.student_count || 0,
                    seatingGrid: config.seating_grid || [],
                    classAssignmentDetails: config.class_assignment_details,
                },
                getSchoolData(),
                action
            );
            toast.success(action === 'download' ? 'PDF downloaded' : action === 'print' ? 'Sent to printer' : 'PDF opened');
        } catch {
            toast.error('Failed to generate PDF');
        }
    };

    const title = localConfigs.length === 1
        ? `Seating Plan — ${localConfigs[0]?.room?.room_name || ''}`
        : `Cross-Room Seating (${localConfigs.length} rooms)`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="7xl">
            {loading ? (
                <LoadingSpinner message="Loading seating plan..." />
            ) : localConfigs.length === 0 ? (
                <EmptyState title="No Data" />
            ) : (
                <DndProvider backend={HTML5Backend}>
                    {/* Unsaved changes bar */}
                    {pendingChanges.length > 0 && (
                        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                {pendingChanges.length} unsaved change{pendingChanges.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleDiscardChanges}>Discard</Button>
                                <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {localConfigs.map(cfg => (
                        <RoomGrid
                            key={cfg.id}
                            config={cfg}
                            classColorMap={classColorMap}
                            onDrop={handleDrop}
                            onPrint={handlePrint}
                        />
                    ))}
                </DndProvider>
            )}
        </Modal>
    );
};

export default SeatingGridModal;

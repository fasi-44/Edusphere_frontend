import { useRef, useState, useEffect, useCallback } from 'react';

interface DrawingCanvasProps {
    onDrawingChange: (base64: string | null) => void;
    initialDrawing?: string;
    height?: number;
}

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    size: number;
    isEraser: boolean;
}

const COLORS = [
    { value: '#000000', label: 'Black' },
    { value: '#DC2626', label: 'Red' },
    { value: '#2563EB', label: 'Blue' },
    { value: '#16A34A', label: 'Green' },
    { value: '#EA580C', label: 'Orange' },
    { value: '#7C3AED', label: 'Purple' },
];

const BRUSH_SIZES = [
    { value: 2, label: 'S' },
    { value: 4, label: 'M' },
    { value: 8, label: 'L' },
];

export default function DrawingCanvas({ onDrawingChange, initialDrawing, height = 300 }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(4);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const currentStrokeRef = useRef<Stroke | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (initialDrawing) {
            const img = new Image();
            img.onload = () => {
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = initialDrawing;
        }
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            // Save current content
            const imageData = canvas.toDataURL();

            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = height;

            // Restore content
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = imageData;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    const getPointerPos = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top,
        };
    };

    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }
        ctx.lineWidth = stroke.size;

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    const redrawAll = useCallback((allStrokes: Stroke[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const stroke of allStrokes) {
            drawStroke(ctx, stroke);
        }
    }, [drawStroke]);

    const emitDrawing = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const base64 = canvas.toDataURL('image/png');
        onDrawingChange(base64);
    }, [onDrawingChange]);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const pos = getPointerPos(e);
        setIsDrawing(true);
        currentStrokeRef.current = {
            points: [pos],
            color,
            size: tool === 'eraser' ? brushSize * 3 : brushSize,
            isEraser: tool === 'eraser',
        };
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStrokeRef.current) return;
        e.preventDefault();

        const pos = getPointerPos(e);
        currentStrokeRef.current.points.push(pos);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawStroke(ctx, currentStrokeRef.current);
    };

    const handlePointerUp = () => {
        if (!isDrawing || !currentStrokeRef.current) return;
        setIsDrawing(false);

        const completedStroke = currentStrokeRef.current;
        currentStrokeRef.current = null;

        if (completedStroke.points.length > 1) {
            setStrokes(prev => [...prev, completedStroke]);
        }
        emitDrawing();
    };

    const handleUndo = () => {
        setStrokes(prev => {
            const newStrokes = prev.slice(0, -1);
            redrawAll(newStrokes);
            if (newStrokes.length === 0) {
                setTimeout(() => onDrawingChange(null), 0);
            } else {
                setTimeout(emitDrawing, 0);
            }
            return newStrokes;
        });
    };

    const handleClear = () => {
        setStrokes([]);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onDrawingChange(null);
    };

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                {/* Tool selection */}
                <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-500 pr-2">
                    <button
                        type="button"
                        onClick={() => setTool('pen')}
                        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                            tool === 'pen'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Pen"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTool('eraser')}
                        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                            tool === 'eraser'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        title="Eraser"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-500 pr-2">
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => { setColor(c.value); setTool('pen'); }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
                                color === c.value && tool === 'pen'
                                    ? 'border-blue-500 scale-110'
                                    : 'border-gray-300 dark:border-gray-500'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                        />
                    ))}
                </div>

                {/* Brush size */}
                <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-500 pr-2">
                    {BRUSH_SIZES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setBrushSize(s.value)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                brushSize === s.value
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto">
                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={strokes.length === 0}
                        className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Undo"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v0a4 4 0 01-4 4H3m0-8l4-4m-4 4l4 4" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={strokes.length === 0}
                        className="p-1.5 rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Clear"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="w-full">
                <canvas
                    ref={canvasRef}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 cursor-crosshair touch-none"
                    style={{ height: `${height}px`, backgroundColor: '#FFFFFF' }}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                />
            </div>
        </div>
    );
}

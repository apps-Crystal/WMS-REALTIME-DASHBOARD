import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DetrojBlueprint = ({ locationData, occupancyMap }) => {
    const [hoveredZone, setHoveredZone] = useState(null);

    // Helpers to process sheet data
    const totalLocations = locationData ? locationData.length : 0;

    // Layout Dimensions (Based on image ratios roughly)
    // Layout Dimensions (Based on image ratios roughly)
    const SCALE = 0.045; // Slightly larger scale

    // Theme Colors
    const THEME = {
        bg: '#0a192f',
        line: '#64ffda',
        text: '#64ffda',
        gridLines: 'rgba(100, 255, 218, 0.1)',
        roomBg: 'rgba(100, 255, 218, 0.02)',
        featureBg: 'rgba(100, 255, 218, 0.1)',
        highlight: '#00ff7f'
    };

    // Dynamic Grid mapping
    // If we have actual locations, we try to create a grid that fits them all.
    // Default to 64 if 0.
    const gridCount = totalLocations > 0 ? totalLocations : 64;
    const gridCols = 60; // Increased columns to use width
    const gridRows = Math.ceil(gridCount / gridCols);

    // Height constants
    const ROOM_HEIGHT = 20000; // Much taller to accommodate grid
    const GRID_HEIGHT = 16000;

    const sections = [
        {
            id: 'dock_room_left',
            label: 'Dock Room +18 C',
            x: 0,
            y: 0,
            width: 9000 * SCALE,
            height: ROOM_HEIGHT * SCALE,
            borderColor: THEME.line,
            type: 'room',
            features: [
                { type: 'label', text: 'Dock Room +18 C', x: '50%', y: '40%', size: '1.2rem', weight: 'bold', bg: 'transparent', color: '#fff' },
                { type: 'rect', x: 1000 * SCALE, y: 5500 * SCALE, w: 2000 * SCALE, h: 2500 * SCALE, color: THEME.featureBg, border: `1px solid ${THEME.line}`, label: 'Dock Leveller' },
                { type: 'rect', x: 4000 * SCALE, y: 5500 * SCALE, w: 2000 * SCALE, h: 2500 * SCALE, color: THEME.featureBg, border: `1px solid ${THEME.line}`, label: 'Dock Leveller' },
                { type: 'circles', count: 5, xStart: 500 * SCALE, y: 1000 * SCALE, gap: 800 * SCALE, radius: 300 * SCALE },
            ]
        },
        {
            id: 'ante_room',
            label: 'Ante Room +4 C',
            x: 9000 * SCALE, // Starts after left room
            y: 0,
            width: 18000 * SCALE,
            height: ROOM_HEIGHT * SCALE,
            borderColor: THEME.line,
            type: 'room',
            features: [
                { type: 'label', text: 'Ante Room +4 C', x: '50%', y: '5%', size: '1.5rem', weight: 'bold', bg: 'transparent', color: '#fff', padding: '1rem' },
                // Updated Label: Shows Total Locations
                { type: 'label', text: `Staging Area: ${totalLocations} Locations`, x: '50%', y: '10%', size: '1rem', weight: 'bold', bg: 'rgba(0,0,0,0.5)', border: `1px dashed ${THEME.line}` },
            ],
            // The grid of pallets
            grid: {
                rows: gridRows,
                cols: gridCols,
                x: 1000 * SCALE,
                y: 3000 * SCALE,
                w: 16000 * SCALE,
                h: GRID_HEIGHT * SCALE,
                // Pass filtered locations if we had them mapped
                items: locationData || []
            }
        },
        {
            id: 'dock_room_right',
            label: 'Dock Room +18 C',
            x: (9000 + 18000) * SCALE,
            y: 0,
            width: 7000 * SCALE,
            height: ROOM_HEIGHT * SCALE, // Align height
            borderColor: THEME.line,
            type: 'room',
            features: [
                { type: 'label', text: 'Dock Room +18 C', x: '50%', y: '40%', size: '1.2rem', weight: 'bold', bg: 'transparent', color: '#fff' },
                { type: 'rect', x: 1000 * SCALE, y: 2000 * SCALE, w: 2500 * SCALE, h: 2000 * SCALE, color: THEME.featureBg, border: `1px solid ${THEME.line}`, label: 'Dock Leveller' },
                { type: 'rect', x: 500 * SCALE, y: 500 * SCALE, w: 2000 * SCALE, h: 1000 * SCALE, color: 'transparent', border: `1px solid #ff4d4d`, label: 'Battery Charging', textColor: '#ff4d4d' },
            ]
        }
    ];

    return (
        <div style={{
            width: '100%',
            overflowX: 'auto',
            padding: '2rem',
            background: THEME.bg, // Dark Blueprint Background
            color: THEME.text,
            fontFamily: 'monospace',
            minHeight: '800px',
            display: 'flex',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(${THEME.gridLines} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            border: `2px solid ${THEME.line}`,
            borderRadius: '8px'
        }}>
            <div style={{
                position: 'relative',
                width: `${35000 * SCALE}px`,
                height: `${(ROOM_HEIGHT + 2000) * SCALE}px`, // Extra space for trucks
                boxSizing: 'border-box',
                marginTop: '2rem'
            }}>
                {/* Main Title */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    left: 0,
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: THEME.line,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: `0 0 10px ${THEME.line}`
                }}>
                    LAYOUT PLAN OF DETROJ SITE
                </div>

                {sections.map(section => (
                    <div key={section.id} style={{
                        position: 'absolute',
                        left: section.x,
                        top: section.y,
                        width: section.width,
                        height: section.height,
                        border: `2px solid ${section.borderColor}`,
                        boxSizing: 'border-box',
                        background: THEME.roomBg,
                        boxShadow: `inset 0 0 20px ${THEME.featureBg}`
                    }}>
                        {/* Features */}
                        {section.features && section.features.map((feat, idx) => {
                            if (feat.type === 'label') {
                                return (
                                    <div key={idx} style={{
                                        position: 'absolute',
                                        left: feat.x,
                                        top: feat.y,
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: feat.size,
                                        fontWeight: feat.weight,
                                        background: feat.bg || 'transparent',
                                        color: feat.color || THEME.text,
                                        padding: feat.padding || '0.5rem',
                                        border: feat.border || 'none',
                                        zIndex: 5,
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 0 5px rgba(0,0,0,0.5)'
                                    }}>
                                        {feat.text}
                                    </div>
                                );
                            }
                            if (feat.type === 'rect') {
                                return (
                                    <div key={idx} style={{
                                        position: 'absolute',
                                        left: feat.x,
                                        top: feat.y,
                                        width: feat.w,
                                        height: feat.h,
                                        background: feat.color,
                                        border: feat.border || 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        textAlign: 'center',
                                        padding: '4px',
                                        color: feat.textColor || '#000',
                                        fontWeight: 'bold'
                                    }}>
                                        {feat.label}
                                    </div>
                                );
                            }
                            if (feat.type === 'circles') {
                                return (
                                    <div key={idx}>
                                        {Array.from({ length: feat.count }).map((_, cIdx) => (
                                            <div key={cIdx} style={{
                                                position: 'absolute',
                                                left: feat.x + (cIdx * feat.gap),
                                                top: feat.y,
                                                width: feat.radius,
                                                height: feat.radius,
                                                borderRadius: '50%',
                                                border: `1px solid ${THEME.line}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 0 5px ${THEME.line}`
                                            }} />
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {/* Grid (Staging Area / Total Locations) */}
                        {section.grid && (
                            <div style={{
                                position: 'absolute',
                                left: section.grid.x,
                                top: section.grid.y,
                                width: section.grid.w,
                                height: section.grid.h,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${section.grid.cols}, 1fr)`,
                                gridTemplateRows: `repeat(${section.grid.rows}, 1fr)`,
                                gap: '2px', // Slight gap for visual separation
                                padding: '2px',
                                overflow: 'hidden' // Clip if too many for the box, though we calculated rows
                            }}>
                                {Array.from({ length: section.grid.rows * section.grid.cols }).map((_, gIdx) => {
                                    // Visual slot
                                    if (gIdx >= gridCount) return null; // Don't render extra if unnecessary

                                    // Check occupancy
                                    // We need to map real locations to these slots. 
                                    // For now, check if we have an item at this index in locationData
                                    const locItem = section.grid.items[gIdx];
                                    const locCode = locItem ? (locItem.Location_Code || locItem.location_code) : `Slot ${gIdx + 1}`;
                                    const normLocCode = locCode ? String(locCode).trim().toUpperCase() : '';
                                    const isOccupied = occupancyMap[normLocCode] && occupancyMap[normLocCode].length > 0;

                                    return (
                                        <motion.div
                                            key={gIdx}
                                            whileHover={{ scale: 1.5, zIndex: 10, background: THEME.highlight, color: '#000' }}
                                            onMouseEnter={(e) => {
                                                const rect = e.target.getBoundingClientRect();
                                                const items = isOccupied ? occupancyMap[normLocCode] : [];
                                                setHoveredZone({
                                                    id: locCode,
                                                    items: items,
                                                    x: rect.right,
                                                    y: rect.top
                                                });
                                            }}
                                            onMouseLeave={() => setHoveredZone(null)}
                                            style={{
                                                border: isOccupied ? `1px solid ${THEME.highlight}` : `1px solid ${THEME.line}`,
                                                background: isOccupied ? `rgba(0, 255, 127, 0.4)` : 'rgba(100, 255, 218, 0.05)',
                                                fontSize: '0.4rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: isOccupied ? '#fff' : THEME.line,
                                                opacity: 0.8
                                            }}
                                        >
                                            {/* Small dot or number */}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Doors (Orange in diagram) - Keep Orange for contrast */}
                        {section.id === 'dock_room_left' && (
                            <div style={{ position: 'absolute', right: -5, top: '20%', width: 10, height: 100, background: 'orange', boxShadow: '0 0 10px orange' }}></div>
                        )}
                        {section.id === 'dock_room_right' && (
                            <div style={{ position: 'absolute', left: -5, top: '20%', width: 10, height: 100, background: 'orange', boxShadow: '0 0 10px orange' }}></div>
                        )}

                    </div>
                ))}

                {/* Trucks Bottom */}
                <div style={{ position: 'absolute', bottom: -100, left: 1500 * SCALE, width: 3000 * SCALE, height: 4000 * SCALE, border: `2px dashed ${THEME.line}`, borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.line }}>TRUCK</div>
                <div style={{ position: 'absolute', bottom: -100, left: 5000 * SCALE, width: 3000 * SCALE, height: 4000 * SCALE, border: `2px dashed ${THEME.line}`, borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.line }}>TRUCK</div>
                <div style={{ position: 'absolute', bottom: -100, right: 2000 * SCALE, width: 3000 * SCALE, height: 4000 * SCALE, border: `2px dashed ${THEME.line}`, borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.line }}>TRUCK</div>

                {/* Dimensions Arrows (Visual decoration) */}
                <div style={{ position: 'absolute', bottom: -20, left: 0, width: '100%', borderTop: `1px solid ${THEME.line}`, display: 'flex', justifyContent: 'space-between', color: THEME.line }}>
                    <span style={{ fontSize: '0.8rem', background: THEME.bg }}>{'<-- 9000 -->'}</span>
                    <span style={{ fontSize: '0.8rem', background: THEME.bg }}>{'<-- 18000 -->'}</span>
                    <span style={{ fontSize: '0.8rem', background: THEME.bg }}>{'<-- 7000 -->'}</span>
                </div>

                {/* Tooltip Overlay */}
                <AnimatePresence>
                    {hoveredZone && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                left: hoveredZone.x + 10,
                                top: hoveredZone.y - 50,
                                background: 'rgba(10, 25, 47, 0.95)',
                                border: `1px solid ${THEME.line}`,
                                padding: '1rem',
                                borderRadius: '4px',
                                zIndex: 9999,
                                minWidth: '200px',
                                backdropFilter: 'blur(5px)',
                                boxShadow: '0 0 20px rgba(0,0,0,0.8)'
                            }}
                        >
                            <div style={{ color: THEME.highlight, borderBottom: '1px solid #333', marginBottom: '0.5rem', paddingBottom: '0.2rem', fontWeight: 'bold' }}>
                                Loc: {hoveredZone.id}
                            </div>
                            {hoveredZone.items && hoveredZone.items.length > 0 ? hoveredZone.items.map((item, i) => (
                                <div key={i} style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <div style={{ color: '#fff' }}>{item.sku_description || item.sku_id}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>Qty: {item.current_qty}</div>
                                    <div style={{ color: THEME.highlight, fontSize: '0.7rem' }}>Pallet: {item.pallet_id}</div>
                                </div>
                            )) : (
                                <div style={{ color: '#aaa', fontStyle: 'italic' }}>Empty</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DetrojBlueprint;


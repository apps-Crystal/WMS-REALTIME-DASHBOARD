import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to loose match column names (duplicated from App.jsx to be safe)
const getRowValue = (row, targetKeyPart) => {
    const keys = Object.keys(row);
    const key = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(targetKeyPart.toLowerCase().replace(/[^a-z0-9]/g, '')));
    return key ? row[key] : null;
};

const WarehouseBlueprint = ({ locationData, occupancyMap }) => {
    const [hoveredLocation, setHoveredLocation] = useState(null);
    const [isPinned, setIsPinned] = useState(false);

    // Close pinned tooltip on click outside or scroll
    React.useEffect(() => {
        if (!isPinned) return;

        const handleClose = (e) => {
            // If it's a scroll event, only close if the target is NOT the tooltip's scrollable content
            if (e.type === 'scroll') {
                const tooltipContent = document.getElementById('sku-list-container');
                if (tooltipContent && (tooltipContent.contains(e.target) || e.target === tooltipContent)) {
                    return;
                }
            }
            setHoveredLocation(null);
            setIsPinned(false);
        };

        window.addEventListener('click', handleClose);
        window.addEventListener('scroll', handleClose, true); // Use capture to catch scroll on parent containers

        return () => {
            window.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [isPinned]);

    // Process data into a structured format: Aisles -> Bays -> Levels -> Depths
    const blueprint = useMemo(() => {
        const structure = {};

        locationData.forEach(row => {
            const aisle = getRowValue(row, 'aisle') || 'Unassigned';
            const bay = getRowValue(row, 'bay') || '0';
            const level = getRowValue(row, 'level') || '0';
            const depth = getRowValue(row, 'depth') || '0'; // If depth exists
            const locCode = getRowValue(row, 'location_code');

            if (!locCode) return;

            if (!structure[aisle]) structure[aisle] = {};
            if (!structure[aisle][bay]) structure[aisle][bay] = {};
            if (!structure[aisle][bay][level]) structure[aisle][bay][level] = [];

            // Sort by depth if needed, or just push
            structure[aisle][bay][level].push({
                locationCode: locCode,
                depth: depth,
                ...row
            });
        });

        return structure;
    }, [locationData]);

    // Sort helper
    const sortKeys = (keys) => keys.sort((a, b) => {
        // Try numeric sort first
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        // Fallback to string sort
        return a.localeCompare(b);
    });

    const sortedAisles = sortKeys(Object.keys(blueprint));

    const handleExport = () => {
        const headers = ['Aisle', 'Bay', 'Level', 'Location Code', 'Status', 'SKU ID', 'Description', 'Quantity', 'Pallet ID'];
        const rows = [headers];

        sortedAisles.forEach(aisle => {
            const bays = blueprint[aisle];
            const sortedBays = sortKeys(Object.keys(bays));
            sortedBays.forEach(bay => {
                const levels = bays[bay];
                const sortedLevels = sortKeys(Object.keys(levels));

                sortedLevels.forEach(level => {
                    const locations = levels[level];
                    locations.forEach(loc => {
                        const normLocCode = loc.locationCode ? String(loc.locationCode).trim().toUpperCase() : '';
                        const items = occupancyMap[normLocCode];

                        if (items && items.length > 0) {
                            items.forEach(item => {
                                rows.push([
                                    aisle,
                                    bay,
                                    level,
                                    `"${loc.locationCode}"`,
                                    'Occupied',
                                    `"${getRowValue(item, 'sku_id') || ''}"`,
                                    `"${getRowValue(item, 'sku_description') || ''}"`,
                                    getRowValue(item, 'current_qty') || 0,
                                    `"${getRowValue(item, 'pallet_id') || ''}"`
                                ]);
                            });
                        } else {
                            rows.push([aisle, bay, level, `"${loc.locationCode}"`, 'Empty', '', '', '', '']);
                        }
                    });
                });
            });
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `warehouse_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{
            padding: '2rem',
            overflowX: 'hidden',
            color: '#a0a0a0',
            fontFamily: 'monospace',
            backgroundImage: 'linear-gradient(rgba(0, 255, 127, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 127, 0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
            minHeight: '600px',
            position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
                <button
                    onClick={handleExport}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,255,127,0.3)'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export Stock
                </button>
            </div>

            {/* Aisle Navigation Menu */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                gap: '0.8rem',
                flexWrap: 'wrap',
                background: 'rgba(0, 255, 127, 0.05)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(0, 255, 127, 0.1)',
                backdropFilter: 'blur(5px)',
                position: 'sticky',
                top: '0',
                zIndex: 90
            }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '0.5rem', alignSelf: 'center', fontSize: '0.9rem' }}>JUMP TO:</span>
                <button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(0, 255, 127, 0.1)',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 127, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 127, 0.1)';
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    TOP
                </button>
                {sortedAisles.map(aisle => (
                    <button
                        key={aisle}
                        onClick={() => {
                            const element = document.getElementById(`aisle-${aisle}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 255, 127, 0.2)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        {aisle}
                    </button>
                ))}
            </div>

            {sortedAisles.map((aisle, i) => {
                const bays = blueprint[aisle];
                const sortedBays = sortKeys(Object.keys(bays));

                // Calculate Aisle Statistics
                let totalLocs = 0;
                let occupiedLocs = 0;
                const skuCounts = {};

                Object.values(bays).forEach(levels => {
                    Object.values(levels).forEach(levelLocs => {
                        levelLocs.forEach(loc => {
                            totalLocs++;
                            const normLocCode = loc.locationCode ? String(loc.locationCode).trim().toUpperCase() : '';
                            const items = occupancyMap[normLocCode];
                            if (items && items.length > 0) {
                                occupiedLocs++;
                                items.forEach(item => {
                                    const skuId = getRowValue(item, 'sku_id') || 'Unknown';
                                    const skuDesc = getRowValue(item, 'sku_description') || skuId;
                                    const qty = parseInt(getRowValue(item, 'current_qty') || 0, 10);

                                    if (!skuCounts[skuId]) {
                                        skuCounts[skuId] = { id: skuId, desc: skuDesc, totalQty: 0 };
                                    }
                                    skuCounts[skuId].totalQty += qty;
                                });
                            }
                        });
                    });
                });

                const emptyLocs = totalLocs - occupiedLocs;

                return (
                    <motion.div
                        key={aisle}
                        id={`aisle-${aisle}`}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        style={{ marginBottom: '4rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <h3 style={{
                                borderBottom: '1px solid var(--primary)',
                                paddingBottom: '0.5rem',
                                margin: 0,
                                color: 'var(--primary)',
                                textShadow: '0 0 5px var(--primary)',
                                fontSize: '1.2rem',
                                whiteSpace: 'nowrap'
                            }}>
                                AISLE {aisle}
                            </h3>

                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                <div style={{ color: '#aaa' }}>Empty: <span style={{ color: '#fff', fontWeight: 'bold' }}>{emptyLocs}</span></div>
                                <div style={{ height: '15px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ color: '#aaa' }}>Occupied: <span style={{ color: '#00ff7f', fontWeight: 'bold' }}>{occupiedLocs}</span></div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div
                                    style={{
                                        padding: '4px 10px',
                                        background: 'rgba(0, 255, 127, 0.1)',
                                        border: '1px solid rgba(0, 255, 127, 0.3)',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        color: '#00ff7f',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        letterSpacing: '1px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isPinned) return;
                                        const rect = e.target.getBoundingClientRect();
                                        setHoveredLocation({
                                            type: 'aisle_skus',
                                            skus: Object.values(skuCounts),
                                            x: rect.left,
                                            y: rect.bottom
                                        });
                                    }}
                                    onMouseLeave={() => {
                                        if (!isPinned) setHoveredLocation(null);
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPinned(true);
                                    }}
                                >
                                    SKUS
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '1rem' }}>
                            {sortedBays.map(bay => {
                                const levels = bays[bay];
                                const sortedLevels = sortKeys(Object.keys(levels)).reverse(); // Levels usually go bottom-up, so render reverse (top visually) is natural for stacking? Or 1 is bottom. 
                                // In HTML, first element is top. So if Level 5 is top, we want 5 first. So reverse is correct.

                                return (
                                    <div key={bay} style={{
                                        border: '1px dashed rgba(255,255,255,0.1)',
                                        padding: '0.4rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        marginBottom: '0.5rem'
                                    }}>
                                        <div style={{ textAlign: 'center', fontSize: '0.65rem', marginBottom: '0.3rem', color: '#666' }}>BAY {bay}</div>
                                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '4px' }}>
                                            <div style={{ width: '40px', textAlign: 'center', fontSize: '0.6rem', color: '#666', fontWeight: 'bold' }}>F</div>
                                            <div style={{ width: '40px', textAlign: 'center', fontSize: '0.6rem', color: '#666', fontWeight: 'bold' }}>B</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {sortedLevels.map(level => {
                                                const locations = levels[level];

                                                return (
                                                    <div key={level} style={{ display: 'flex', gap: '2px' }}>
                                                        {locations.map((loc, idx) => {
                                                            const normLocCode = loc.locationCode ? String(loc.locationCode).trim().toUpperCase() : '';
                                                            const isOccupied = occupancyMap[normLocCode] && occupancyMap[normLocCode].length > 0;
                                                            const palletCount = isOccupied ? occupancyMap[normLocCode].length : 0;

                                                            // Find oldest SKU or main SKU
                                                            const mainItem = isOccupied ? occupancyMap[normLocCode][0] : null;

                                                            return (
                                                                <motion.div
                                                                    key={loc.locationCode}
                                                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                                                    onMouseEnter={(e) => {
                                                                        const rect = e.target.getBoundingClientRect();
                                                                        setHoveredLocation({
                                                                            type: 'location',
                                                                            item: loc,
                                                                            pallets: occupancyMap[normLocCode],
                                                                            x: rect.left,
                                                                            y: rect.top
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoveredLocation(null)}
                                                                    style={{
                                                                        width: '40px',
                                                                        height: '30px',
                                                                        background: isOccupied
                                                                            ? `rgba(0, 255, 127, ${0.2 + (Math.min(palletCount, 5) * 0.1)})` // Opacity based on density?
                                                                            : 'rgba(255,255,255,0.05)',
                                                                        border: isOccupied ? '1px solid #00ff7f' : '1px solid rgba(255,255,255,0.1)',
                                                                        boxShadow: isOccupied ? '0 0 5px rgba(0,255,127,0.3)' : 'none',
                                                                        cursor: 'pointer',
                                                                        position: 'relative',
                                                                        fontSize: '0.6rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: isOccupied ? '#fff' : '#444'
                                                                    }}
                                                                >
                                                                    {level}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}

            {/* Hover Tooltip Overlay */}
            <AnimatePresence>
                {hoveredLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: hoveredLocation.type === 'aisle_skus' ? hoveredLocation.y + 10 : hoveredLocation.y + 40,
                            left: hoveredLocation.x, // Prevent overflow
                            background: 'rgba(10, 10, 15, 0.95)',
                            border: '1px solid var(--primary)',
                            padding: '1rem',
                            borderRadius: '8px',
                            zIndex: 9999,
                            width: hoveredLocation.type === 'aisle_skus' ? 'auto' : '300px',
                            minWidth: '200px',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            pointerEvents: 'auto'
                        }}
                    >
                        {hoveredLocation.type === 'aisle_skus' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                    Aisle Inventory
                                </h4>
                                <div
                                    id="sku-list-container"
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        paddingRight: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {hoveredLocation.skus.length > 0 ? (
                                        hoveredLocation.skus.map(sku => (
                                            <div key={sku.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#fff' }}>{sku.desc}</span>
                                                <span style={{ color: '#00ff7f', fontWeight: 'bold' }}>{sku.totalQty}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ color: '#999', fontStyle: 'italic' }}>No SKUs in this aisle</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                    {hoveredLocation.item.locationCode}
                                </h4>

                                {hoveredLocation.pallets ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {hoveredLocation.pallets.map((pallet, i) => (
                                            <div key={i} style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                                <div style={{ color: '#fff', fontWeight: 'bold' }}>{getRowValue(pallet, 'sku_description')}</div>
                                                <div style={{ color: '#aaa' }}>{getRowValue(pallet, 'sku_id')}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                                    <span>Qty: {getRowValue(pallet, 'current_qty')}</span>
                                                    <span style={{ color: '#00ff7f' }}>{getRowValue(pallet, 'pallet_id')}</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>
                                                    Exp: {getRowValue(pallet, 'expiry_date') || 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ color: '#666', fontStyle: 'italic' }}>Empty Location</div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WarehouseBlueprint;

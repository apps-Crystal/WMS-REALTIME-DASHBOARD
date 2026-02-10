import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, Box, AlertTriangle, X, ChevronRight, ClipboardList } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, delay, color = 'var(--primary)' }) => (
    <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '200px',
            overflow: 'hidden',
            wordBreak: 'break-word',
            border: `1px solid ${color !== 'var(--primary)' ? color : 'var(--glass-border)'}`
        }}
    >
        <div style={{
            background: color === 'var(--primary)' ? 'rgba(79, 236, 255, 0.1)' : `${color}20`,
            padding: '1rem',
            borderRadius: '50%',
            marginBottom: '1rem',
            color: color
        }}>
            <Icon size={32} />
        </div>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {title}
        </h3>
        <p className={color === 'var(--primary)' ? "gradient-text" : ""} style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', color: color === 'var(--primary)' ? undefined : color }}>
            {value}
        </p>
    </motion.div>
);

import WarehouseBlueprint from './WarehouseBlueprint';


const StatusItem = ({ active, isFirst, isLast, previousActive }) => {
    const isActive = (val) => {
        const s = String(val).toLowerCase().trim();
        return s && s !== 'false' && s !== 'n/a' && s !== 'unchecked' && s !== '-' && s !== '0' && s !== '';
    };

    const showActive = isActive(active);
    const showPrevActive = !isFirst && isActive(previousActive);
    const showLine = showPrevActive && showActive;

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', width: '100%' }}>
            {/* Connecting Line */}
            {showLine && (
                <div style={{
                    position: 'absolute',
                    right: '50.5%',
                    width: '100%',
                    height: '2px',
                    zIndex: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: '100%',
                            height: '2px',
                            background: showActive ? '#00ff7f' : 'rgba(255,255,255,0.1)',
                            opacity: 0.4,
                            transformOrigin: 'right'
                        }}
                    />
                </div>
            )}

            {/* Status Node */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                    scale: showActive ? 1 : 0.8,
                    opacity: showActive ? 1 : 0.3,
                    borderColor: showActive ? '#00ff7f' : 'rgba(255,255,255,0.1)'
                }}
                style={{
                    width: '32px',
                    height: '22px',
                    borderRadius: '4px',
                    background: showActive ? 'rgba(0,255,127,0.15)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    position: 'relative'
                }}
            >
                {showActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={14} color="#00ff7f" />
                    </div>
                ) : (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                )}
            </motion.div>
        </div>
    );
};

const Dashboard = ({ stats, inboundData, outboundData, stockData, dangerStockData, locationData, occupancyMap, grnData, palletDetailsData, pickExecutionData, liveInwardData, liveOutboundData, dateRange, onDateRangeChange, user, lastUpdated, totalOccupiedPallets }) => {
    const [activeTab, setActiveTab] = React.useState('live_control');
    const [stockSearch, setStockSearch] = React.useState('');
    const [stockSort, setStockSort] = React.useState('desc'); // 'asc' or 'desc'
    const [selectedVehicle, setSelectedVehicle] = React.useState(null);
    const [boardSearch, setBoardSearch] = React.useState('');

    // Helper to normalize sheet dates (DD/MM/YYYY) to YYYY-MM-DD for comparison
    const normalizeSheetDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = String(dateStr).trim().split(' ')[0].split(/[/.-]/);
        if (parts.length !== 3) return null;

        if (parts[0].length === 4) { // YYYY-MM-DD case
            const [y, m, d] = parts;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else { // DD-MM-YYYY case
            let [d, m, y] = parts;
            if (y.length === 2) y = '20' + y;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    };

    // Filter Live Data by Date
    const filteredLiveInward = React.useMemo(() => {
        let data = liveInwardData.filter(row => {
            const matchingGrn = grnData.find(g => String(g.GRN_ID).trim() === String(row.GRN_ID).trim());
            const rawDate = matchingGrn ? (matchingGrn.Date || matchingGrn.Arrival_Date || matchingGrn.Arrival_Time) : null;

            // Strict Filtering: If searching by date range, hide rows with no date info
            if (!rawDate) return false;

            const normalized = normalizeSheetDate(rawDate);
            if (!normalized) return false;

            const matchesDate = normalized >= dateRange.start && normalized <= dateRange.end;
            return matchesDate;
        });

        // Search Filter
        if (boardSearch) {
            const q = boardSearch.toLowerCase().trim();
            data = data.filter(row => {
                const grn = String(row.GRN_ID || '').toLowerCase();
                const arrival = String(grnData.find(g => String(g.GRN_ID).trim() === String(row.GRN_ID).trim())?.Arrival_Time || '').toLowerCase();
                return grn.includes(q) || arrival.includes(q);
            });
        }
        return data;
    }, [liveInwardData, grnData, dateRange, boardSearch]);

    const filteredLiveOutbound = React.useMemo(() => {
        let data = liveOutboundData.filter(row => {
            const matchingOutbound = outboundData.find(o => String(o.DN_ID).trim() === String(row.DN_ID).trim());
            const rawDate = matchingOutbound ? (matchingOutbound.Actual_Date || matchingOutbound.Order_Date) : null;

            // Strict Filtering
            if (!rawDate) return false;

            const normalized = normalizeSheetDate(rawDate);
            if (!normalized) return false;

            const matchesDate = normalized >= dateRange.start && normalized <= dateRange.end;
            return matchesDate;
        });

        // Search Filter
        if (boardSearch) {
            const q = boardSearch.toLowerCase().trim();
            data = data.filter(row => {
                const dn = String(row.DN_ID || '').toLowerCase();
                const orderDate = String(outboundData.find(o => String(o.DN_ID).trim() === String(row.DN_ID).trim())?.Order_Date || '').toLowerCase();
                return dn.includes(q) || orderDate.includes(q);
            });
        }
        return data;
    }, [liveOutboundData, outboundData, dateRange, boardSearch]);

    const currentStats = activeTab === 'inbound' ? stats.inbound : stats.outbound;
    let currentData = activeTab === 'inbound' ? inboundData : (activeTab === 'outbound' ? outboundData : (activeTab === 'stock' ? stockData : (activeTab === 'danger' ? dangerStockData : [])));

    if (activeTab === 'outbound' && currentData) {
        currentData = currentData.filter(row => row.Customer_Name && row.Customer_Name.includes('CUS-0001'));
    }

    if (activeTab === 'stock' && currentData) {
        // Filter
        if (stockSearch) {
            const searchLower = stockSearch.toLowerCase();
            currentData = currentData.filter(row =>
                (row.SKU_ID && row.SKU_ID.toLowerCase().includes(searchLower)) ||
                (row.SKU_Description && row.SKU_Description.toLowerCase().includes(searchLower))
            );
        }
        // Sort
        currentData = [...currentData].sort((a, b) => {
            const qtyA = Number(a.Total_Qty) || 0;
            const qtyB = Number(b.Total_Qty) || 0;
            return stockSort === 'asc' ? qtyA - qtyB : qtyB - qtyA;
        });
    }

    const displayStats = React.useMemo(() => {
        if (activeTab === 'locations') return { vehicleCount: 0, count: 0, totalQty: 0, palletCount: 0, boxCount: 0 };
        if (!currentData) return { vehicleCount: 0, count: 0, totalQty: 0, palletCount: 0, boxCount: 0 };

        if (activeTab === 'stock') {
            return {
                count: currentData.length,
                totalQty: currentData.reduce((acc, row) => Number(acc) + (Number(row.Total_Qty) || 0), 0),
                palletCount: totalOccupiedPallets
            };
        }

        if (activeTab === 'danger') {
            return {
                count: currentData.length,
                totalQty: currentData.reduce((acc, row) => {
                    const qty = Number(row.Free_Qty || row.free_qty || 0);
                    return acc + qty;
                }, 0),
                palletCount: currentData.length
            };
        }

        return {
            count: currentData.length,
            palletCount: currentData.reduce((acc, row) => {
                const val = activeTab === 'inbound' ? row.Sum_of_Pallet : row.Sum_of_Dispatched_Pallet;
                return Number(acc) + (Number(val) || 0);
            }, 0),
            boxCount: currentData.reduce((acc, row) => {
                const val = activeTab === 'inbound' ? row.Sum_of_Box : row.Sum_of_Dispatched_Boxes;
                return Number(acc) + (Number(val) || 0);
            }, 0)
        };
    }, [currentData, activeTab, totalOccupiedPallets]);

    const handleStockExport = () => {
        if (!currentData || currentData.length === 0) return;

        const isDanger = activeTab === 'danger';
        const headers = isDanger
            ? ['Pallet ID', 'GRN ID', 'SKU ID', 'Description', 'Expiry Date', 'Days Remaining', 'Free Qty', 'Location']
            : ['SKU ID', 'Description', 'Total Current Qty'];

        const rows = [headers];

        currentData.forEach(row => {
            if (isDanger) {
                const expiry = row.Expiry_Date || row.expiry_date || '';
                // Simple day diff calc for export
                let daysRemaining = '';
                if (expiry) {
                    const parts = expiry.split('/');
                    if (parts.length === 3) {
                        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                        const diffTime = d - new Date();
                        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                }

                rows.push([
                    `"${row.Pallet_ID || row.pallet_id || ''}"`,
                    `"${row.GRN_ID || row.grn_id || ''}"`,
                    `"${row.SKU_ID || row.sku_id || ''}"`,
                    `"${row.SKU_Description || row.sku_description || ''}"`,
                    `"${expiry}"`,
                    daysRemaining,
                    row.Free_Qty || row.free_qty || 0,
                    `"${row.Location_ID || row.location_id || ''}"`
                ]);
            } else {
                rows.push([
                    `"${row.SKU_ID || ''}"`,
                    `"${row.SKU_Description || ''}"`,
                    row.Total_Qty || 0
                ]);
            }
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${isDanger ? 'danger_stock_' : 'stock_export_'}${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getDaysRemaining = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const parts = dateStr.trim().split(' '); // Handle potential time part
            const dateParts = parts[0].split('/');
            if (dateParts.length !== 3) return 'N/A';

            const [dd, mm, yyyy] = dateParts.map(Number);
            const expiryDate = new Date(yyyy, mm - 1, dd);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            return 'Err';
        }
    };

    return (
        <div className="dashboard-container">
            <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            background: activeTab === 'inbound' ? 'rgba(79, 236, 255, 0.1)' :
                                (activeTab === 'locations' ? 'rgba(100, 255, 100, 0.1)' :
                                    (activeTab === 'danger' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)')),
                            color: activeTab === 'inbound' ? 'var(--primary)' :
                                (activeTab === 'locations' ? '#00ff7f' :
                                    (activeTab === 'danger' ? '#ff4d4d' : 'orange')),
                            fontSize: '0.8rem',
                            border: `1px solid ${activeTab === 'inbound' ? 'var(--primary)' :
                                (activeTab === 'locations' ? '#00ff7f' :
                                    (activeTab === 'danger' ? '#ff4d4d' : 'orange'))}`
                        }}>
                            {activeTab === 'live_control' ? 'LIVE CONTROL' :
                                (activeTab === 'inbound' ? 'INBOUND' :
                                    (activeTab === 'outbound' ? 'OUTBOUND' :
                                        (activeTab === 'locations' ? 'BLUEPRINT' :
                                            (activeTab === 'danger' ? 'DANGER STOCK' : 'STOCK'))))}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}>Overview for Falcon Agrifriz Foods Pvt Ltd</p>
                </div>

                {/* User Profile Section - Top Right */}
                <div style={{ textAlign: 'right' }} className="user-profile">
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: '0.9rem', color: 'white', margin: 0 }}>{user.name}</h2>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Verified Admin</p>
                            </div>
                            {user.picture ? (
                                <img src={user.picture} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                            ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {user.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>CRYSTAL GROUP</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin Portal</p>
                        </>
                    )}
                    {lastUpdated && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '0.5rem', opacity: 0.8 }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#00ff7f', borderRadius: '50%', marginRight: '4px' }}></span>
                            Live Updates On
                            <br />
                            Last sync: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </motion.header>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button onClick={() => setActiveTab('live_control')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'live_control' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'live_control' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>LIVE CONTROL</button>
                <button onClick={() => setActiveTab('inbound')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'inbound' ? '#00e5ff' : 'rgba(255,255,255,0.05)', color: activeTab === 'inbound' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>Inbound</button>
                <button onClick={() => setActiveTab('outbound')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'outbound' ? 'orange' : 'rgba(255,255,255,0.05)', color: activeTab === 'outbound' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>Outbound</button>
                <button onClick={() => setActiveTab('stock')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'stock' ? '#4fecff' : 'rgba(255,255,255,0.05)', color: activeTab === 'stock' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>Stock</button>
                <button onClick={() => setActiveTab('danger')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'danger' ? '#ff4d4d' : 'rgba(255,255,255,0.05)', color: activeTab === 'danger' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>Danger Stock</button>
                <button onClick={() => setActiveTab('locations')} style={{ padding: '0.75rem 2rem', borderRadius: '8px', background: activeTab === 'locations' ? '#00ff7f' : 'rgba(255,255,255,0.05)', color: activeTab === 'locations' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}>Locations</button>
            </div>

            {activeTab === 'live_control' ? (
                <div style={{ padding: '0.5rem' }}>
                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search GRN, DN or Site..."
                                    value={boardSearch}
                                    onChange={(e) => setBoardSearch(e.target.value)}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                                        borderRadius: '8px',
                                        width: '300px',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <Truck size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Range:</span>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', outline: 'none', colorScheme: 'dark' }}
                                />
                            </div>
                            <div style={{ width: '10px', height: '1px', background: 'var(--text-muted)' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', outline: 'none', colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
                        {/* INWARD STATUS SYSTEM */}
                        <motion.div
                            className="glass-panel"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: '1.25rem',
                                borderLeft: '4px solid #00e5ff',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Technical Grid Background */}
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)',
                                backgroundSize: '30px 30px',
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.1)' }}>
                                    <h3 style={{ margin: 0, color: '#00e5ff', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div style={{ width: '8px', height: '16px', background: '#00e5ff', borderRadius: '2px' }} />
                                        INWARD STATUS SYSTEM
                                    </h3>
                                    <div style={{ fontSize: '0.6rem', color: '#00e5ff', background: 'rgba(0, 229, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>ONLINE</div>
                                </div>
                                <div style={{ overflow: 'auto', maxHeight: '550px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>ID/Arrival</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Vehicle Arrived</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Vehicle Docked</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Unloading in Progress</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Unloading Completed</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Putaway Completed</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>GRN Issued</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLiveInward.length > 0 ? filteredLiveInward.map((row, idx) => {
                                                const matchingGrn = grnData.find(g => String(g.GRN_ID).trim() === String(row.GRN_ID).trim());
                                                const arrivalTime = matchingGrn ? matchingGrn.Arrival_Time : '--';
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.8rem' }}>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            <div style={{ fontWeight: 'bold', color: 'white' }}>{row.GRN_ID}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#666' }}>{arrivalTime}</div>
                                                        </td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Vehicle Arrived']} isFirst /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Vehicle Docked']} previousActive={row['Vehicle Arrived']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Unloading in Progress']} previousActive={row['Vehicle Docked']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Unloading Completed']} previousActive={row['Unloading in Progress']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Putaway Completed']} previousActive={row['Unloading Completed']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['GRN Issued']} previousActive={row['Putaway Completed']} isLast /></td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inward records for selected date range</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>

                        {/* OUTBOUND STATUS SYSTEM */}
                        <motion.div
                            className="glass-panel"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                padding: '1.25rem',
                                borderLeft: '4px solid orange',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Technical Grid Background */}
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: 'linear-gradient(rgba(255, 165, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 165, 0, 0.03) 1px, transparent 1px)',
                                backgroundSize: '30px 30px',
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 165, 0, 0.1)' }}>
                                    <h3 style={{ margin: 0, color: 'orange', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div style={{ width: '8px', height: '16px', background: 'orange', borderRadius: '2px' }} />
                                        OUTBOUND STATUS SYSTEM
                                    </h3>
                                    <div style={{ fontSize: '0.6rem', color: 'orange', background: 'rgba(255, 165, 0, 0.1)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>ACTIVE</div>
                                </div>
                                <div style={{ overflow: 'auto', maxHeight: '550px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>ID/Order</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Order Created</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Picklist Generated</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Picking In-Progress</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Picking Completed</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Loading In-Progress</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'bottom' }}>Dispatched</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLiveOutbound.length > 0 ? filteredLiveOutbound.map((row, idx) => {
                                                const matchingOutbound = outboundData.find(o => String(o.DN_ID).trim() === String(row.DN_ID).trim());
                                                const orderDate = matchingOutbound ? matchingOutbound.Order_Date : '--';
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.8rem' }}>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            <div style={{ fontWeight: 'bold', color: 'white' }}>{row.DN_ID}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#666' }}>{orderDate}</div>
                                                        </td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Order Created']} isFirst /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Picklist Generated']} previousActive={row['Order Created']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Picking In-Progress']} previousActive={row['Picklist Generated']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Picking Completed']} previousActive={row['Picking In-Progress']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Loading In-Progress']} previousActive={row['Picking Completed']} /></td>
                                                        <td style={{ padding: '0' }}><StatusItem active={row['Dispatched']} previousActive={row['Loading In-Progress']} isLast /></td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No outbound records for selected date range</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : activeTab === 'locations' ? (
                <WarehouseBlueprint locationData={locationData} occupancyMap={occupancyMap} />
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <StatCard
                            title={activeTab === 'inbound' ? "Vehicles Entered" : (activeTab === 'outbound' ? "Entries Processed" : (activeTab === 'danger' ? "Danger Pallets" : "Total SKUs"))}
                            value={displayStats.count}
                            icon={activeTab === 'inbound' ? Truck : (activeTab === 'danger' ? AlertTriangle : Box)}
                            delay={0.1}
                            color={activeTab === 'danger' ? '#ff4d4d' : 'var(--primary)'}
                        />

                        {activeTab !== 'stock' && activeTab !== 'danger' && (
                            <>
                                <StatCard title="Total Pallets" value={displayStats.palletCount} icon={Package} delay={0.2} />
                                <StatCard title="Total Boxes" value={displayStats.boxCount} icon={Box} delay={0.3} />
                            </>
                        )}

                        {activeTab === 'stock' && (
                            <>
                                <StatCard title="Total Pallets Occupied" value={displayStats.palletCount} icon={Package} delay={0.2} />
                                <StatCard title="Total Quantity" value={displayStats.totalQty} icon={Box} delay={0.3} />
                            </>
                        )}

                        {activeTab === 'danger' && (
                            <>
                                <StatCard title="Expiring Soon (Free Qty)" value={displayStats.totalQty} icon={Box} delay={0.2} color="#ff4d4d" />
                                <StatCard title="Avg Days Remaining" value="< 30" icon={Package} delay={0.3} color="#ff4d4d" />
                            </>
                        )}
                    </div>

                    {/* Recent Entries Table */}
                    <motion.div
                        className="glass-panel"
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ padding: '2rem', overflowX: 'auto' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>
                                {activeTab === 'inbound' ? 'Inbound Entries' : (activeTab === 'outbound' ? 'Outbound Entries' : (activeTab === 'danger' ? 'Expiring Stock (<30 Days)' : 'Current Stock'))}
                            </h2>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {(activeTab === 'stock' || activeTab === 'danger') && (
                                    <>
                                        {activeTab === 'stock' && (
                                            <input
                                                type="text"
                                                placeholder="Search SKU ID or Description..."
                                                value={stockSearch}
                                                onChange={(e) => setStockSearch(e.target.value)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    outline: 'none',
                                                    minWidth: '250px'
                                                }}
                                            />
                                        )}
                                        <button
                                            onClick={handleStockExport}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: activeTab === 'danger' ? '#ff4d4d' : '#4fecff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Box size={16} /> Export
                                        </button>
                                    </>
                                )}

                                {activeTab !== 'danger' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px', opacity: activeTab === 'stock' ? 0.3 : 1, pointerEvents: activeTab === 'stock' ? 'none' : 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>From:</span>
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                                                style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid var(--glass-border)',
                                                    color: 'white',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    cursor: 'pointer',
                                                    colorScheme: 'dark'
                                                }}
                                            />
                                        </div>
                                        <div style={{ width: '10px', height: '1px', background: 'var(--text-muted)' }}></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>To:</span>
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                                                style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid var(--glass-border)',
                                                    color: 'white',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    cursor: 'pointer',
                                                    colorScheme: 'dark'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    {activeTab === 'inbound' ? (
                                        <>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>GRN ID</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Vehicle No</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Driver</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Invoice</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Pallets</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Boxes</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Action</th>
                                        </>
                                    ) : (activeTab === 'outbound' ? (
                                        <>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Actual Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Order Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Customer</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>DN ID</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Pallets</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Boxes</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Action</th>
                                        </>
                                    ) : (activeTab === 'danger' ? (
                                        <>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Pallet ID</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>GRN ID</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>SKU Info</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Mfg Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Expiry Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Days Left</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Free Qty</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loc</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>SKU ID</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Description</th>
                                            <th
                                                style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}
                                                onClick={() => setStockSort(s => s === 'desc' ? 'asc' : 'desc')}
                                            >
                                                Total Current Qty
                                                <span style={{ fontSize: '0.7rem' }}>{stockSort === 'asc' ? '▲' : '▼'}</span>
                                            </th>
                                        </>
                                    )))}
                                </tr>
                            </thead>
                            <tbody>
                                {(currentData || []).map((row, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => (activeTab === 'inbound' || activeTab === 'outbound') && setSelectedVehicle(row)}
                                        style={{
                                            borderBottom: '1px solid var(--glass-border)',
                                            transition: 'background 0.2s',
                                            cursor: activeTab === 'inbound' ? 'pointer' : 'default',
                                            background: activeTab === 'danger' ? 'rgba(255, 77, 77, 0.05)' : undefined
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = activeTab === 'danger' ? 'rgba(255, 77, 77, 0.15)' : 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = activeTab === 'danger' ? 'rgba(255, 77, 77, 0.05)' : 'transparent'}
                                    >
                                        {activeTab === 'inbound' ? (
                                            <>
                                                <td style={{ padding: '1rem' }}>
                                                    {(row.Actual_Date || row.Arrival_Time || 'N/A').split(' ')[0]}
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                    {row.GRN_ID || '-'}
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.Vehicle_Number}</td>
                                                <td style={{ padding: '1rem' }}>{row.Driver_Name}</td>
                                                <td style={{ padding: '1rem' }}>{row.Invoice_Number}</td>
                                                <td style={{ padding: '1rem' }}>{row.Sum_of_Pallet}</td>
                                                <td style={{ padding: '1rem' }}>{row.Sum_of_Box}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => setSelectedVehicle(row)}
                                                        style={{
                                                            padding: '4px 12px',
                                                            background: 'rgba(79, 236, 255, 0.1)',
                                                            border: '1px solid var(--primary)',
                                                            borderRadius: '4px',
                                                            color: 'var(--primary)',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        DETAILS <ChevronRight size={12} />
                                                    </button>
                                                </td>
                                            </>
                                        ) : (activeTab === 'outbound' ? (
                                            <>
                                                <td style={{ padding: '1rem' }}>
                                                    {(row.Actual_Date || 'N/A').split(' ')[0]}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {(row.Order_Date || 'N/A').split(' ')[0]}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{row.Customer_Name}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'orange' }}>{row.DN_ID}</td>
                                                <td style={{ padding: '1rem' }}>{row.Sum_of_Dispatched_Pallet}</td>
                                                <td style={{ padding: '1rem' }}>{row.Sum_of_Dispatched_Boxes}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => setSelectedVehicle(row)}
                                                        style={{
                                                            padding: '4px 12px',
                                                            background: 'rgba(255, 165, 0, 0.1)',
                                                            border: '1px solid orange',
                                                            borderRadius: '4px',
                                                            color: 'orange',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        DETAILS <ChevronRight size={12} />
                                                    </button>
                                                </td>
                                            </>
                                        ) : (activeTab === 'danger' ? (
                                            <>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#ff4d4d' }}>{row.Pallet_ID || row.pallet_id}</td>
                                                <td style={{ padding: '1rem' }}>{row.GRN_ID || row.grn_id}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{row.SKU_ID || row.sku_id}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.SKU_Description || row.sku_description}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{row.Manufacturing_Date || row.manufacturing_date}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.Expiry_Date || row.expiry_date}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        background: '#ff4d4d',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {getDaysRemaining(row.Expiry_Date || row.expiry_date)} Days
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.Free_Qty || row.free_qty}</td>
                                                <td style={{ padding: '1rem' }}>{row.Location_ID || row.location_id}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#4fecff' }}>{row.SKU_ID}</td>
                                                <td style={{ padding: '1rem' }}>{row.SKU_Description}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{row.Total_Qty}</td>
                                            </>
                                        )))}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: activeTab === 'danger' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255,255,255,0.1)', borderTop: `2px solid ${activeTab === 'danger' ? '#ff4d4d' : 'var(--primary)'}`, fontWeight: 'bold' }}>
                                    {activeTab === 'inbound' ? (
                                        <>
                                            <td colSpan={5} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL:</td>
                                            <td style={{ padding: '1rem' }}>{displayStats.palletCount}</td>
                                            <td style={{ padding: '1rem' }}>{displayStats.boxCount}</td>
                                            <td></td>
                                        </>
                                    ) : (activeTab === 'outbound' ? (
                                        <>
                                            <td colSpan={4} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL:</td>
                                            <td style={{ padding: '1rem' }}>{displayStats.palletCount}</td>
                                            <td style={{ padding: '1rem' }}>{displayStats.boxCount}</td>
                                            <td></td>
                                        </>
                                    ) : (activeTab === 'danger' ? (
                                        <>
                                            <td colSpan={5} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL DANGER PALLETS:</td>
                                            <td colSpan={2} style={{ padding: '1rem' }}>{displayStats.palletCount}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td colSpan={2} style={{ padding: '1rem', textAlign: 'right' }}>TOTAL:</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>{displayStats.totalQty}</td>
                                        </>
                                    )))}
                                </tr>
                            </tfoot>
                        </table>
                        {(currentData || []).length === 0 && (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No entries matching filter.</p>
                        )}
                    </motion.div>
                </>
            )}

            {/* Vehicle Details Modal */}
            {
                selectedVehicle && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(10px)',
                        padding: '2rem'
                    }} onClick={() => setSelectedVehicle(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            style={{
                                background: '#1a1a2e',
                                width: '90%',
                                maxWidth: '1200px',
                                maxHeight: '85vh',
                                borderRadius: '16px',
                                border: '1px solid var(--primary)',
                                padding: '2rem',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 0 40px rgba(0, 255, 127, 0.2)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {selectedVehicle.type === 'inbound' ? <Truck color="var(--primary)" /> : <Package color="orange" />}
                                        {selectedVehicle.type === 'inbound' ? `Vehicle: ${selectedVehicle.Vehicle_Number}` : `DN: ${selectedVehicle.DN_ID}`}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            background: selectedVehicle.type === 'inbound' ? 'rgba(0, 255, 127, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                                            border: `1px solid ${selectedVehicle.type === 'inbound' ? 'var(--primary)' : 'orange'}`,
                                            borderRadius: '4px',
                                            color: selectedVehicle.type === 'inbound' ? 'var(--primary)' : 'orange',
                                            fontWeight: 'bold'
                                        }}>
                                            {selectedVehicle.type === 'inbound' ? `GRN: ${selectedVehicle.GRN_ID || 'PENDING'}` : `Customer: ${selectedVehicle.Customer_Name}`}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        {selectedVehicle.type === 'inbound' ? (
                                            <>Driver: <strong>{selectedVehicle.Driver_Name}</strong> | Invoice: <strong>{selectedVehicle.Invoice_Number}</strong> | </>
                                        ) : (
                                            <>Order Date: <strong>{selectedVehicle.Order_Date}</strong> | Status: <strong>{selectedVehicle.Status}</strong> | </>
                                        )}
                                        Date: <strong>{selectedVehicle.Actual_Date || selectedVehicle.Arrival_Time}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedVehicle(null)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }} className="custom-scrollbar">
                                <h3 style={{ fontSize: '1rem', color: selectedVehicle.type === 'inbound' ? 'var(--primary)' : 'orange', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ClipboardList size={18} /> {selectedVehicle.type === 'inbound' ? 'PALLET BUILD DETAILS' : 'PICK EXECUTION DETAILS'}
                                </h3>

                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1a1a2e', zIndex: 5 }}>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                            {selectedVehicle.type === 'inbound' ? (
                                                <>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Pallet ID</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>SKU Info</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Batch / Expiry</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Quantity</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Photo</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>SKU Info</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Batch / Expiry</th>
                                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Qty (Pick/Plan)</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            if (selectedVehicle.type === 'inbound') {
                                                const selVNum = String(selectedVehicle.Vehicle_Number || '').trim().toUpperCase();
                                                const selGrnId = String(selectedVehicle.GRN_ID || '').trim().toUpperCase();

                                                const matchingGrnsFromAux = grnData
                                                    .filter(g => String(g.Vehicle_Number || '').trim().toUpperCase() === selVNum)
                                                    .map(g => String(g.GRN_ID || '').trim().toUpperCase());

                                                const allPossibleGrns = new Set([selGrnId, ...matchingGrnsFromAux]);

                                                const filteredPallets = palletDetailsData.filter(p => {
                                                    const vNum = String(p.Vehicle_Number || '').trim().toUpperCase();
                                                    const gId = String(p.GRN_ID || p.grn_id || '').trim().toUpperCase();
                                                    return (vNum && vNum === selVNum) || (gId && allPossibleGrns.has(gId));
                                                });

                                                if (filteredPallets.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>
                                                                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No pallet build details found for this vehicle.</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredPallets.map((pallet, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{pallet.Pallet_ID || 'N/A'}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{pallet.SKU_ID}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{pallet.SKU_Description}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontSize: '0.85rem' }}>Batch: {pallet.Batch_Number || 'N/A'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#ff4d4d' }}>Exp: {pallet.Expiry_Date || 'N/A'}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                                                {pallet.Quantity_Boxes} Boxes
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {pallet.Photos_URL && pallet.Photos_URL !== 'N/A' ? (
                                                                <a href={pallet.Photos_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>View Photo</a>
                                                            ) : 'No Photo'}
                                                        </td>
                                                    </tr>
                                                ));
                                            } else {
                                                // Outbound logic
                                                const selDnId = String(selectedVehicle.DN_ID || '').trim().toUpperCase();
                                                const filteredPicks = pickExecutionData.filter(p => {
                                                    const pPickId = String(p.Pick_ID || '').trim().toUpperCase();
                                                    return pPickId && pPickId.includes(selDnId);
                                                });

                                                if (filteredPicks.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>
                                                                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No pick execution details found for this DN.</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredPicks.map((pick, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontWeight: 'bold', color: 'orange' }}>{pick.SKU_ID}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{pick.SKU_Description}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontSize: '0.85rem' }}>Batch: {pick.Batch_Number || 'N/A'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#ff4d4d' }}>Exp: {pick.Expiry_Date || 'N/A'}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                                                {pick.Quantity_Picked} / {pick.Pick_Quantity}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ));
                                            }
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;

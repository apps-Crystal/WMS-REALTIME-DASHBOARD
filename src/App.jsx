import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';

const GOOGLE_CLIENT_ID = "apps@crystalgroup.in"; // Placeholder client ID as requested
// Main Sheet ID
const SHEET_ID = '1fBPpQD_JaXNqN6Q6vCzF1XqibR_mQRTVRZfHfBg1s_k';

// Helper to loose match column names
const getRowValue = (row, targetKeyPart) => {
  if (!row) return '';
  const keys = Object.keys(row);
  const target = targetKeyPart.toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = keys.find(k => {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanK === target || cleanK.includes(target) || target.includes(cleanK);
  });
  return key ? row[key] : '';
};

// Returns YYYY-MM-DD for input value
const getTodayInputFormat = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

const parseSheetDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const cleanStr = dateStr.trim().split(' ')[0];
    const parts = cleanStr.split(/[/.-]/);
    if (parts.length !== 3) return null;

    // Check if first part is YYYY (e.g. 2026-02-07) or DD/MM/YYYY
    if (parts[0].length === 4) {
      const [yyyy, mm, dd] = parts.map(Number);
      return new Date(yyyy, mm - 1, dd);
    } else {
      const [dd, mm, yyyy] = parts.map(Number);
      // Handle 2-digit years if any
      const fullYear = String(yyyy).length === 2 ? 2000 + yyyy : yyyy;
      return new Date(fullYear, mm - 1, dd);
    }
  } catch (e) {
    return null;
  }
};

const parseInputDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    return new Date(yyyy, mm - 1, dd);
  } catch (e) {
    return null;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const [rawInbound, setRawInbound] = useState([]);
  const [rawOutbound, setRawOutbound] = useState([]);

  const [filteredInbound, setFilteredInbound] = useState([]);
  const [filteredOutbound, setFilteredOutbound] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [dangerStockData, setDangerStockData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [occupancyMap, setOccupancyMap] = useState({});
  const [totalOccupiedPallets, setTotalOccupiedPallets] = useState(0);
  const [grnData, setGrnData] = useState([]);
  const [palletDetailsData, setPalletDetailsData] = useState([]);
  const [pickExecutionData, setPickExecutionData] = useState([]);
  const [liveInwardData, setLiveInwardData] = useState([]);
  const [liveOutboundData, setLiveOutboundData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [debugInfo, setDebugInfo] = useState({
    connection: 'Checking...',
    totalRows: 0,
    palletRows: 0,
    grnRows: 0,
    syncTime: null,
    sample: null
  });

  const [dateRange, setDateRange] = useState({
    start: getTodayInputFormat(),
    end: getTodayInputFormat()
  });

  const [error, setError] = useState(null);
  const [allTimeCount, setAllTimeCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [stats, setStats] = useState({
    inbound: { vehicleCount: 0, palletCount: 0, boxCount: 0 },
    outbound: { entryCount: 0, palletCount: 0, boxCount: 0 }
  });

  const INBOUND_SHEET_NAME = 'Vehicle_Entry_IB_1st';
  const OUTBOUND_SHEET_NAME = 'DN_Entry_OB_01';
  const STOCK_SHEET_NAME = 'Pallet_Status_Occupied';

  const INBOUND_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${INBOUND_SHEET_NAME}`;
  const OUTBOUND_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${OUTBOUND_SHEET_NAME}`;
  const STOCK_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${STOCK_SHEET_NAME}`;
  const LIVE_INWARD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Live%20Transaction%20Status%20Dashboard%20-%20INWARD`;
  const LIVE_OUTBOUND_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Live%20Transaction%20Status%20Dashboard%20-%20OUTBOUND`;

  useEffect(() => {
    const fetchSheet = async (url) => {
      try {
        const response = await fetch(url + `&t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        return new Promise((resolve) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            complete: (results) => resolve(results.data || []),
            error: (err) => {
              console.error(err);
              resolve([]);
            }
          });
        });
      } catch (err) {
        console.warn(`Fetch error for ${url}:`, err);
        return [];
      }
    };

    const loadAllData = async (isPolling = false) => {
      if (!isPolling) setLoading(true);
      try {
        // All data in parallel for maximum speed and sync
        const [inboundData, outboundData, stockRawData, locationRawData, grnRawData, palletBuildRawData, pickExecutionRawData, liveInwardRaw, liveOutboundRaw] = await Promise.all([
          fetchSheet(INBOUND_CSV_URL),
          fetchSheet(OUTBOUND_CSV_URL),
          fetchSheet(STOCK_CSV_URL),
          fetchSheet(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Location_Status_01`),
          fetchSheet(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=GRN_Entry_IB_01`),
          fetchSheet(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Pallet_Build_IB_04`),
          fetchSheet(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Picking_Execution_OB_04`),
          fetchSheet(LIVE_INWARD_URL),
          fetchSheet(LIVE_OUTBOUND_URL)
        ]);

        // Process Stock Data Grouped by SKU for the Stock Tab
        const stockMap = {};
        const locationOccupancyMap = {};

        stockRawData.forEach(row => {
          const sku = getRowValue(row, 'sku_id');
          const desc = getRowValue(row, 'sku_description');
          const qty = parseFloat(String(getRowValue(row, 'current_qty') || 0).replace(/,/g, '')) || 0;
          const locId = getRowValue(row, 'location_id');

          if (sku) {
            if (!stockMap[sku]) {
              stockMap[sku] = { SKU_ID: sku, SKU_Description: desc || 'N/A', Total_Qty: 0 };
            }
            stockMap[sku].Total_Qty += qty;
          }

          if (locId) {
            const normLocId = String(locId).trim().toUpperCase();
            if (!locationOccupancyMap[normLocId]) locationOccupancyMap[normLocId] = [];
            locationOccupancyMap[normLocId].push(row);
          }
        });
        setStockData(Object.values(stockMap));

        const occupiedCount = stockRawData.filter(row => {
          const status = getRowValue(row, 'occupancy_status');
          return status && String(status).toLowerCase().includes('occupied');
        }).length;
        setTotalOccupiedPallets(occupiedCount);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const dangerStock = stockRawData.filter(row => {
          const status = getRowValue(row, 'occupancy_status');
          if (!status || !String(status).toLowerCase().includes('occupied')) return false;
          const expiryDate = parseSheetDate(getRowValue(row, 'expiry_date'));
          return expiryDate && expiryDate <= thirtyDaysFromNow;
        });
        setDangerStockData(dangerStock);

        const falconInbound = inboundData.filter(row => {
          const customerName = getRowValue(row, 'customer');
          return customerName && String(customerName).toLowerCase().includes("falcon");
        });

        const falconOutbound = outboundData.filter(row => {
          const customerName = getRowValue(row, 'customer');
          return customerName && (customerName.toLowerCase().includes("falcon") || customerName.includes("CUS-0001"));
        });

        // Collect all GRN IDs from the main Inbound table
        const inboundGrnIds = falconInbound
          .map(row => String(getRowValue(row, 'grn_id') || '').trim().toUpperCase())
          .filter(id => id && id !== 'N/A' && id !== '-');

        setRawInbound(falconInbound);
        setRawOutbound(falconOutbound);
        setAllTimeCount(falconInbound.length + falconOutbound.length);
        setLocationData(locationRawData || []);
        setOccupancyMap(locationOccupancyMap);

        // Process Detailed Data (Falcon Filter)
        // Match by Customer name OR by the GRN IDs we already found in Inbound
        const falconGrnRaw = grnRawData.filter(row => {
          const customer = getRowValue(row, 'customer_name') || getRowValue(row, 'customer');
          const grnId = String(getRowValue(row, 'grn_id') || '').trim().toUpperCase();
          return (customer && customer.toLowerCase().includes('falcon')) || (grnId && inboundGrnIds.includes(grnId));
        });

        const falconGrn = falconGrnRaw.map(row => ({
          GRN_ID: getRowValue(row, 'grn_id'),
          Vehicle_Number: getRowValue(row, 'vehicle_number'),
          ...row
        }));

        const allTargetGrnIds = new Set([
          ...inboundGrnIds,
          ...falconGrn.map(g => String(g.GRN_ID || '').trim().toUpperCase())
        ]);

        // process pallet data with LESS filtering to be safe
        const falconPalletBuild = palletBuildRawData.map(row => ({
          GRN_ID: getRowValue(row, 'grn_id') || getRowValue(row, 'grn'),
          Pallet_ID: getRowValue(row, 'pallet_id') || getRowValue(row, 'pallet'),
          SKU_ID: getRowValue(row, 'sku_id') || getRowValue(row, 'sku'),
          SKU_Description: getRowValue(row, 'sku_description') || getRowValue(row, 'description'),
          Batch_Number: getRowValue(row, 'batch_number') || getRowValue(row, 'batch'),
          Expiry_Date: getRowValue(row, 'expiry_date') || getRowValue(row, 'expiry'),
          Quantity_Boxes: getRowValue(row, 'quantity_boxes') || getRowValue(row, 'qty'),
          Photos_URL: getRowValue(row, 'photos_url') || getRowValue(row, 'url'),
          Vehicle_Number: getRowValue(row, 'vehicle_number') || getRowValue(row, 'vehicle'),
          ...row
        }));

        if (falconPalletBuild.length === 0 && palletBuildRawData.length > 0) {
          console.warn("Pallet builds found in sheet but none matched Falcon GRNs. Sample GRN from sheet:", getRowValue(palletBuildRawData[0], 'grn_id'));
        }

        const falconPickExecution = pickExecutionRawData.map(row => ({
          Pick_ID: getRowValue(row, 'pick_id') || getRowValue(row, 'Pick_ID'),
          Pick_Quantity: getRowValue(row, 'pick_quantity') || getRowValue(row, 'Pick_Quantity'),
          SKU_ID: getRowValue(row, 'sku_id') || getRowValue(row, 'SKU_ID'),
          SKU_Description: getRowValue(row, 'sku_description') || getRowValue(row, 'SKU_Description'),
          Batch_Number: getRowValue(row, 'batch_number') || getRowValue(row, 'Batch_Number'),
          Expiry_Date: getRowValue(row, 'expiry_date') || getRowValue(row, 'Expiry_Date'),
          Quantity_Picked: getRowValue(row, 'quantity_picked') || getRowValue(row, 'Quantity_Picked'),
          Picked_By: getRowValue(row, 'picked_by') || getRowValue(row, 'Picked_By'),
          Is_This_Last_Pallet_For_Pick_Execution: getRowValue(row, 'is_this_last_pallet_for_pick_execution') || getRowValue(row, 'Is_This_Last_Pallet_For_Pick_Execution'),
          Is_Pick_Execution_Sent: getRowValue(row, 'is_pick_execution_sent') || getRowValue(row, 'Is_Pick_Execution_Sent'),
          DN_ID: getRowValue(row, 'dn_id') || getRowValue(row, 'DN_ID'), // Assuming DN_ID links them
          ...row
        }));

        setGrnData(falconGrn);
        setPalletDetailsData(falconPalletBuild);
        setPickExecutionData(falconPickExecution);
        setLiveInwardData(liveInwardRaw);
        setLiveOutboundData(liveOutboundRaw);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (e) {
        console.error("Critical Load Error:", e);
        setError(e);
        setLoading(false);
      }
    };

    loadAllData();

    const intervalId = setInterval(() => {
      loadAllData(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Back to Top visibility logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const startDate = parseInputDate(dateRange.start);
    const endDate = parseInputDate(dateRange.end);

    const filterByDate = (data, dateFieldKey) => {
      return data.filter(row => {
        const dateStr = getRowValue(row, 'actual_date') || getRowValue(row, dateFieldKey);
        const rowDate = parseSheetDate(dateStr);
        if (!rowDate) return false;

        let matchesStart = true;
        let matchesEnd = true;
        if (startDate) matchesStart = rowDate.getTime() >= startDate.getTime();
        if (endDate) matchesEnd = rowDate.getTime() <= endDate.getTime();

        return matchesStart && matchesEnd;
      });
    };

    const inboundFiltered = filterByDate(rawInbound, 'arrival_time');
    const inboundNormalized = inboundFiltered.map(row => ({
      type: 'inbound',
      GRN_ID: getRowValue(row, 'grn_id'),
      Arrival_Time: getRowValue(row, 'arrival_time'),
      Vehicle_Number: getRowValue(row, 'vehicle_number'),
      Driver_Name: getRowValue(row, 'driver_name'),
      Invoice_Number: getRowValue(row, 'invoice_number'),
      Customer_Name: getRowValue(row, 'customer'),
      Actual_Date: getRowValue(row, 'actual_date'),
      Sum_of_Pallet: parseFloat(String(getRowValue(row, 'sum_of_pallet') || 0).replace(/,/g, '')) || 0,
      Sum_of_Box: parseFloat(String(getRowValue(row, 'sum_of_box') || 0).replace(/,/g, '')) || 0,
      ...row
    }));

    const outboundFiltered = filterByDate(rawOutbound, 'actual_date');
    const outboundNormalized = outboundFiltered.map(row => ({
      type: 'outbound',
      Actual_Date: getRowValue(row, 'actual_date'),
      DN_ID: getRowValue(row, 'dn_id'),
      Order_Date: getRowValue(row, 'order_date'),
      Status: getRowValue(row, 'status'),
      Customer_Name: getRowValue(row, 'customer'),
      Sum_of_Dispatched_Pallet: parseFloat(String(getRowValue(row, 'sum_of_dispatched_pallet') || 0).replace(/,/g, '')) || 0,
      Sum_of_Dispatched_Boxes: parseFloat(String(getRowValue(row, 'sum_of_dispatched_boxes') || 0).replace(/,/g, '')) || 0,
      ...row
    }));

    setFilteredInbound(inboundNormalized);
    setFilteredOutbound(outboundNormalized);

    setStats({
      inbound: {
        vehicleCount: inboundFiltered.length,
        palletCount: inboundNormalized.reduce((acc, row) => Number(acc) + (Number(row.Sum_of_Pallet) || 0), 0),
        boxCount: inboundNormalized.reduce((acc, row) => Number(acc) + (Number(row.Sum_of_Box) || 0), 0)
      },
      outbound: {
        entryCount: outboundFiltered.length,
        palletCount: outboundNormalized.reduce((acc, row) => Number(acc) + (Number(row.Sum_of_Dispatched_Pallet) || 0), 0),
        boxCount: outboundNormalized.reduce((acc, row) => Number(acc) + (Number(row.Sum_of_Dispatched_Boxes) || 0), 0)
      }
    });

  }, [dateRange, rawInbound, rawOutbound]);

  const handleLoginSuccess = (decodedUser) => {
    setUser(decodedUser);
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 4500);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="page-container">
        <AnimatePresence mode="wait">
          {!user && (
            <motion.div key="login" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {user && showWelcome && <WelcomeScreen key="welcome" />}
        </AnimatePresence>

        {user && !showWelcome && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
              Overview Range: <strong>{dateRange.start}</strong> to <strong>{dateRange.end}</strong>
            </div>

            <Dashboard
              stats={stats}
              inboundData={filteredInbound}
              outboundData={filteredOutbound}
              stockData={stockData}
              dangerStockData={dangerStockData}
              totalOccupiedPallets={totalOccupiedPallets}
              locationData={locationData}
              occupancyMap={occupancyMap}
              grnData={grnData}
              palletDetailsData={palletDetailsData}
              pickExecutionData={pickExecutionData}
              liveInwardData={liveInwardData}
              liveOutboundData={liveOutboundData}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              user={user}
              lastUpdated={lastUpdated}
            />

            {(filteredInbound.length === 0 && filteredOutbound.length === 0) && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                <p>No entries found for this date range.</p>
                <p style={{ marginTop: '0.5rem' }}>Total Falcon entries in sheet: {allTimeCount}</p>
              </div>
            )}
          </motion.div>
        )}

        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000 100%)' }} />

        {/* Debug Info */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.85)', color: '#0f0', fontSize: '10px', maxHeight: '120px', overflow: 'auto', zIndex: 9999, borderTop: '1px solid #0f0', padding: '5px' }}>
          <details>
            <summary style={{ cursor: 'pointer' }}>DEBUG PANEL (Data Status)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>Connection:</strong> {error ? `Error: ${error.message}` : (loading ? 'Loading...' : 'Connected')}<br />
                <strong>Falcon Inbound:</strong> {rawInbound.length} | <strong>Outbound:</strong> {rawOutbound.length}<br />
                <strong>Detail Sheets:</strong> Pallets: {palletDetailsData.length}, GRNs: {grnData.length}, Picks: {pickExecutionData.length}<br />
                <strong>Last Sync:</strong> {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </div>
              <div>
                <strong>Pallet Sample:</strong><br />
                <pre style={{ margin: 0, overflow: 'hidden' }}>{palletDetailsData[0] ? JSON.stringify(palletDetailsData[0], null, 1).substring(0, 120) + '...' : 'No Falcon Pallets'}</pre>
              </div>
            </div>
          </details>
        </div>
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="back-to-top-button"
            title="Back to Top"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </motion.button>
        )}
      </AnimatePresence>
    </GoogleOAuthProvider>
  );
}

export default App;

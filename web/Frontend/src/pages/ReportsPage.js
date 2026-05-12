import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBarChart,
  FiDownload,
  FiUsers,
  FiTruck,
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiVideo,
  FiUser,
  FiShield,
  FiAward,
  FiInfo,
  FiChevronDown,
  FiFileText
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { tripAPI, vehicleAPI, incidentAPI, userAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);

  // Data states
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Analytics states
  const [driverScores, setDriverScores] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [driverPickerOpen, setDriverPickerOpen] = useState(false);
  const [selectedDriverForReport, setSelectedDriverForReport] = useState(null);

  // Chart data states
  const [tripStats, setTripStats] = useState({});
  const [vehicleStats, setVehicleStats] = useState({});
  const [incidentStats, setIncidentStats] = useState({});

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
    { name: 'Users', icon: FiUsers, path: '/dashboard/users' },
    { name: 'Reports', icon: FiDollarSign, path: '/dashboard/reports' },
    { name: 'Live Monitor', icon: FiVideo, path: '/dashboard/live' },
    { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
  ];

  const processChartData = useCallback((tripsData, vehiclesData, incidentsData, driversData = []) => {
    console.log('Processing chart data:', { tripsData, vehiclesData, incidentsData, driversData });

    // Process trips data
    const tripStatusCounts = tripsData.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {});

    const tripTrends = getDateTrends(tripsData, 'createdAt');
    const driverTripCounts = getDriverTripCounts(tripsData);

    setTripStats({
      statusCounts: tripStatusCounts,
      trends: tripTrends,
      driverCounts: driverTripCounts
    });

    // Process vehicles data
    const vehicleStatusCounts = vehiclesData.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, {});

    const vehicleMakeCounts = vehiclesData.reduce((acc, vehicle) => {
      acc[vehicle.make] = (acc[vehicle.make] || 0) + 1;
      return acc;
    }, {});

    setVehicleStats({
      statusCounts: vehicleStatusCounts,
      makeCounts: vehicleMakeCounts
    });

    // Process incidents data
    console.log('Processing incidents:', incidentsData);
    const incidentTypeCounts = incidentsData.reduce((acc, incident) => {
      const type = incident.incidentType || incident.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const incidentSeverityCounts = incidentsData.reduce((acc, incident) => {
      const severity = incident.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const driverIncidentCounts = getDriverIncidentCounts(incidentsData);
    const incidentTrends = getDateTrends(incidentsData, 'reportedAt');

    console.log('Incident stats:', {
      typeCounts: incidentTypeCounts,
      severityCounts: incidentSeverityCounts,
      driverCounts: driverIncidentCounts,
      trends: incidentTrends
    });

    setIncidentStats({
      typeCounts: incidentTypeCounts,
      severityCounts: incidentSeverityCounts,
      driverCounts: driverIncidentCounts,
      trends: incidentTrends
    });

    // Calculate Driver Safety Scores (Only for Active Drivers)
    const activeDrivers = driversData.filter(driver => driver.isActive !== false);
    const scores = activeDrivers.map(driver => {
      const dIncidents = incidentsData.filter(inc => {
        const rep = inc.driver || inc.reportedBy || inc.assignedDriver;
        return rep && (rep._id === driver._id || rep === driver._id);
      });
      const dTrips = tripsData.filter(t => t.assignedDriver && (t.assignedDriver._id === driver._id || t.assignedDriver === driver._id));
      
      let critical = 0, high = 0, medium = 0, low = 0;
      dIncidents.forEach(inc => {
        if (inc.severity === 'critical') critical++;
        else if (inc.severity === 'high') high++;
        else if (inc.severity === 'medium') medium++;
        else low++;
      });

      let score = 100 - (critical * 15) - (high * 10) - (medium * 5) - (low * 2);
      
      // Safe Trips: A trip is considered "Safe" if it is completed and has ZERO incidents associated with it.
      const safeTrips = dTrips.filter(t => t.status === 'completed' && !dIncidents.some(i => i.trip === t._id)).length;
      score += (safeTrips * 2);
      score = Math.max(0, Math.min(100, score));

      return { 
        ...driver, 
        score, 
        totalIncidents: dIncidents.length, 
        critical, high, medium, low, 
        safeTrips, 
        totalTrips: dTrips.length 
      };
    }).sort((a, b) => b.score - a.score);

    setDriverScores(scores);

    // Generate AI Insights
    const insights = [];
    if (incidentsData.length === 0) {
      insights.push({ type: 'success', text: "No incidents reported. Outstanding fleet safety!" });
    } else {
      const sortedTypes = Object.entries(incidentTypeCounts).sort((a, b) => b[1] - a[1]);
      if (sortedTypes[0]) {
        insights.push({ type: 'warning', text: `⚠️ ${sortedTypes[0][0].replace('_', ' ').toUpperCase()} is the most frequent violation (${sortedTypes[0][1]} occurrences). Consider targeted training.` });
      }
      const highRisk = scores.filter(s => s.score < 60);
      if (highRisk.length > 0) {
        insights.push({ type: 'danger', text: `🛑 Action Required: ${highRisk.length} driver(s) are in the High Risk category (Score < 60). Intervene immediately.` });
      }
      const topDriver = scores[0];
      if (topDriver && topDriver.score > 85 && topDriver.totalIncidents === 0) {
        insights.push({ type: 'success', text: `🏆 Outstanding Performance: ${topDriver.name} maintains a perfect safety record.` });
      }
    }
    setAiInsights(insights);

  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsResponse, vehiclesResponse, incidentsResponse, usersResponse] = await Promise.all([
        tripAPI.getAllTrips(),
        vehicleAPI.getAllVehicles(),
        incidentAPI.getAllIncidents(),
        userAPI.getAllUsers({ role: 'driver' })
      ]);

      if (tripsResponse.success) setTrips(tripsResponse.data);
      if (vehiclesResponse.success) setVehicles(vehiclesResponse.data);
      if (incidentsResponse.success) setIncidents(incidentsResponse.data);
      
      const driversData = Array.isArray(usersResponse.data) ? usersResponse.data : (usersResponse.data?.users || []);

      // Apply date range filter to time-sensitive data
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const filterData = (arr, field = 'createdAt') => arr.filter(item => {
        const d = item[field] || item.createdAt || item.reportedAt;
        return d && new Date(d) >= cutoff;
      });

      const filteredTrips = tripsResponse.success ? filterData(tripsResponse.data) : [];
      const filteredIncidents = incidentsResponse.success ? filterData(incidentsResponse.data, 'reportedAt') : [];

      setTrips(filteredTrips);
      if (vehiclesResponse.success) setVehicles(vehiclesResponse.data);
      setIncidents(filteredIncidents);

      // Process data for charts
      processChartData(filteredTrips, vehiclesResponse.data, filteredIncidents, driversData);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  }, [processChartData, dateRange]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, dateRange]);

  // Lock background scroll when driver picker modal is open
  useEffect(() => {
    if (driverPickerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [driverPickerOpen]);

  // Filter any dataset to the selected date range
  const filterByDateRange = useCallback((data, dateField = 'createdAt') => {
    const days = parseInt(dateRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter(item => {
      const dateValue = item[dateField] || item.createdAt || item.reportedAt;
      return dateValue && new Date(dateValue) >= cutoff;
    });
  }, [dateRange]);

  const getDateTrends = (data, dateField) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const count = data.filter(item => {
        // Try different possible date field names
        const dateValue = item[dateField] || item.createdAt || item.date || item.timestamp;
        if (!dateValue) return false;

        try {
          const itemDate = new Date(dateValue).toISOString().split('T')[0];
          return itemDate === date;
        } catch (error) {
          console.warn('Invalid date format:', dateValue);
          return false;
        }
      }).length;
      return { date, count };
    });
  };

  const getDriverTripCounts = (tripsData) => {
    return tripsData.reduce((acc, trip) => {
      if (trip.assignedDriver) {
        const driverName = trip.assignedDriver.name;
        acc[driverName] = (acc[driverName] || 0) + 1;
      }
      return acc;
    }, {});
  };

  const getDriverIncidentCounts = (incidentsData) => {
    return incidentsData.reduce((acc, incident) => {
      // Try different possible field names for the reporter
      const reporter = incident.reportedBy || incident.driver || incident.assignedDriver;
      if (reporter) {
        const driverName = reporter.name || reporter.firstName + ' ' + reporter.lastName || 'Unknown';
        acc[driverName] = (acc[driverName] || 0) + 1;
      } else {
        // If no reporter info, count as 'Unknown'
        acc['Unknown'] = (acc['Unknown'] || 0) + 1;
      }
      return acc;
    }, {});
  };

  // Chart configurations
  const getTripStatusChartData = () => ({
    labels: Object.keys(tripStats.statusCounts || {}),
    datasets: [{
      data: Object.values(tripStats.statusCounts || {}),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const getIncidentTypeChartData = () => {
    const typeCounts = incidentStats.typeCounts || {};
    const hasData = Object.keys(typeCounts).length > 0;

    return {
      labels: hasData ? Object.keys(typeCounts) : ['No Data'],
      datasets: [{
        data: hasData ? Object.values(typeCounts) : [1],
        backgroundColor: hasData ? [
          '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
        ] : ['#E5E7EB'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  const getTripTrendsChartData = () => ({
    labels: tripStats.trends?.map(t => new Date(t.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Trips Created',
      data: tripStats.trends?.map(t => t.count) || [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  const getIncidentTrendsChartData = () => {
    const trends = incidentStats.trends || [];

    return {
      labels: trends.length > 0 ? trends.map(t => new Date(t.date).toLocaleDateString()) : ['No Data'],
      datasets: [{
        label: 'Incidents Reported',
        data: trends.length > 0 ? trends.map(t => t.count) : [0],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

  const getDriverIncidentChartData = () => {
    const driverCounts = incidentStats.driverCounts || {};
    const sortedDrivers = Object.entries(driverCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 drivers with most incidents

    const hasData = sortedDrivers.length > 0;

    return {
      labels: hasData ? sortedDrivers.map(([name]) => name) : ['No Data'],
      datasets: [{
        label: 'Incidents',
        data: hasData ? sortedDrivers.map(([, count]) => count) : [0],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1
      }]
    };
  };

  const getVehicleMakeChartData = () => ({
    labels: Object.keys(vehicleStats.makeCounts || {}),
    datasets: [{
      data: Object.values(vehicleStats.makeCounts || {}),
      backgroundColor: [
        '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const periodLabel = `Last ${dateRange} Days`;

    // ── Summary Sheet ──────────────────────────────────────
    const summarySheet = XLSX.utils.json_to_sheet([
      { 'Metric': 'Report Period', 'Value': periodLabel },
      { 'Metric': 'Generated On', 'Value': new Date().toLocaleDateString() },
      { 'Metric': 'Total Trips', 'Value': trips.length },
      { 'Metric': 'Completed Trips', 'Value': trips.filter(t => t.status === 'completed').length },
      { 'Metric': 'Active Vehicles', 'Value': vehicles.filter(v => v.status === 'active').length },
      { 'Metric': 'Total Vehicles', 'Value': vehicles.length },
      { 'Metric': 'Total Incidents', 'Value': incidents.length },
      { 'Metric': 'Critical Incidents', 'Value': incidents.filter(i => i.severity === 'critical').length },
      { 'Metric': 'High Severity Incidents', 'Value': incidents.filter(i => i.severity === 'high').length },
      { 'Metric': 'Resolved Incidents', 'Value': incidents.filter(i => i.status === 'resolved').length },
      { 'Metric': 'Unresolved Incidents', 'Value': incidents.filter(i => i.status !== 'resolved').length },
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // ── Driver Safety Scores Sheet ──────────────────────────
    const safetySheet = XLSX.utils.json_to_sheet(driverScores.map((d, idx) => ({
      'Rank': idx + 1,
      'Driver Name': d.name,
      'Email': d.email || 'N/A',
      'Safety Score': `${d.score}/100`,
      'Status': d.score > 85 ? 'Safe' : d.score >= 60 ? 'Needs Monitoring' : 'High Risk',
      'Total Incidents': d.totalIncidents,
      'Critical Incidents': d.critical,
      'High Incidents': d.high,
      'Medium Incidents': d.medium,
      'Low Incidents': d.low,
      'Total Trips': d.totalTrips,
      'Safe Trips': d.safeTrips,
    })));
    XLSX.utils.book_append_sheet(workbook, safetySheet, 'Driver Safety Scores');

    // ── Trips Sheet ─────────────────────────────────────────
    const tripsSheet = XLSX.utils.json_to_sheet(trips.map(trip => ({
      'Trip Number': trip.tripNumber || 'N/A',
      'Driver': trip.assignedDriver?.name || 'Unassigned',
      'Vehicle': trip.assignedVehicle?.licensePlate || 'Unassigned',
      'Status': trip.status,
      'Priority': trip.priority || 'N/A',
      'Start Location': trip.startLocation?.address || 'N/A',
      'End Location': trip.endLocation?.address || 'N/A',
      'Distance (km)': trip.distance || 'N/A',
      'Estimated Duration': trip.estimatedDuration || 'N/A',
      'Created At': new Date(trip.createdAt).toLocaleDateString(),
    })));
    XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');

    // ── Vehicles Sheet ──────────────────────────────────────
    const vehiclesSheet = XLSX.utils.json_to_sheet(vehicles.map(vehicle => ({
      'Make': vehicle.make,
      'Model': vehicle.model,
      'Year': vehicle.year,
      'License Plate': vehicle.licensePlate,
      'VIN': vehicle.vin || 'N/A',
      'Color': vehicle.color || 'N/A',
      'Status': vehicle.status,
      'Mileage (km)': vehicle.mileage || 'N/A',
      'Fuel Type': vehicle.fuelType || 'N/A',
      'Assigned Driver': vehicle.assignedDriver?.name || 'Unassigned',
      'Last Service Date': vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : 'N/A',
      'Created At': new Date(vehicle.createdAt).toLocaleDateString(),
    })));
    XLSX.utils.book_append_sheet(workbook, vehiclesSheet, 'Vehicles');

    // ── Incidents Sheet ─────────────────────────────────────
    const incidentsSheet = XLSX.utils.json_to_sheet(incidents.map(incident => ({
      'Incident Type': (incident.incidentType || incident.type || 'Unknown').replace('_', ' ').toUpperCase(),
      'Severity': incident.severity?.toUpperCase() || 'N/A',
      'Status': incident.status || 'N/A',
      'Driver': incident.driver?.name || incident.reportedBy?.name || 'Unknown',
      'Vehicle': incident.vehicle?.licensePlate || 'N/A',
      'Trip Number': incident.trip?.tripNumber || 'N/A',
      'Location': incident.location?.address || 'N/A',
      'Description': incident.description || 'N/A',
      'Reported At': incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A',
      'Resolved At': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString() : 'Pending',
    })));
    XLSX.utils.book_append_sheet(workbook, incidentsSheet, 'Incidents');

    XLSX.writeFile(workbook, `fleet-report-${periodLabel.replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text("Fleet Safety & Analytics Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated on: ${dateStr}`, 14, 30);

    // Overview Stats
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text("1. Overview Statistics", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Count']],
      body: [
        ['Total Trips Monitored', trips.length],
        ['Active Vehicles', vehicles.filter(v => v.status === 'active').length],
        ['Total Safety Incidents', incidents.length],
        ['Unresolved Incidents', incidents.filter(i => i.status !== 'resolved').length],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 11, cellPadding: 4 },
      margin: { bottom: 20 }
    });

    // AI Insights
    let finalY = doc.lastAutoTable?.finalY || 100;
    if (aiInsights.length > 0) {
      doc.setFontSize(16);
      doc.text("2. AI System Insights", 14, finalY + 15);
      
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      let insightY = finalY + 24;
      aiInsights.forEach(insight => {
        // Strip emojis and weird unicode for PDF
        const cleanText = insight.text.replace(/[^\x00-\x7F]/g, "").trim();
        
        // Use splitTextToSize to handle text wrapping if insight is too long
        const splitText = doc.splitTextToSize(`•  ${cleanText}`, 180);
        doc.text(splitText, 14, insightY);
        insightY += (splitText.length * 6) + 2;
      });
      finalY = insightY;
    }

    // Driver Safety Leaderboard
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text("3. Driver Safety Leaderboard", 14, finalY + 15);
    
    const driverData = driverScores.map(d => [
      d.name,
      `${d.score}/100`,
      d.score > 85 ? 'Safe' : d.score >= 60 ? 'Monitoring' : 'High Risk',
      d.totalIncidents.toString(),
      `${d.safeTrips} / ${d.totalTrips}`
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Driver Name', 'Safety Score', 'Status', 'Violations', 'Safe Trips']],
      body: driverData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    finalY = doc.lastAutoTable?.finalY || finalY + 50;

    // Recent Critical Incidents
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (criticalIncidents.length > 0) {
      // Check if we need a new page
      if (finalY > 230) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY += 15;
      }

      doc.setFontSize(16);
      doc.text("4. Recent High-Risk Incidents", 14, finalY);

      const incidentData = criticalIncidents.slice(0, 15).map(inc => {
        const dateObj = new Date(inc.reportedAt || inc.createdAt);
        const repName = inc.driver?.name || inc.reportedBy?.name || inc.assignedDriver?.name || 'Unknown';
        const type = inc.incidentType || inc.type || 'Unknown';
        return [
          dateObj.toLocaleDateString(),
          repName,
          type.replace('_', ' ').toUpperCase(),
          inc.severity.toUpperCase(),
          inc.status || 'pending'
        ];
      });

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Driver', 'Incident Type', 'Severity', 'Status']],
        body: incidentData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }, // Red for critical
        styles: { fontSize: 10, cellPadding: 3 }
      });
    }

    // ── PAGE: All Trips Detail ─────────────────────────────
    if (trips.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text(`5. All Trips Detail (Last ${dateRange} Days)`, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Total records: ${trips.length}`, 14, 28);

      autoTable(doc, {
        startY: 33,
        head: [['Trip #', 'Driver', 'Vehicle', 'Status', 'Priority', 'Distance', 'Start', 'End', 'Date']],
        body: trips.map(trip => [
          trip.tripNumber || 'N/A',
          trip.assignedDriver?.name || 'Unassigned',
          trip.assignedVehicle?.licensePlate || 'N/A',
          trip.status || 'N/A',
          trip.priority || 'N/A',
          trip.distance ? `${trip.distance} km` : 'N/A',
          trip.startLocation?.address || 'N/A',
          trip.endLocation?.address || 'N/A',
          new Date(trip.createdAt).toLocaleDateString(),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          6: { cellWidth: 30 },
          7: { cellWidth: 30 },
        }
      });
    }

    // ── PAGE: All Incidents Detail ─────────────────────────
    if (incidents.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text(`6. All Incidents Detail (Last ${dateRange} Days)`, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Total records: ${incidents.length}`, 14, 28);

      autoTable(doc, {
        startY: 33,
        head: [['Date', 'Driver', 'Type', 'Severity', 'Vehicle', 'Trip #', 'Status', 'Description']],
        body: incidents.map(inc => {
          const driverName = inc.driver?.name || inc.reportedBy?.name || 'Unknown';
          const type = (inc.incidentType || inc.type || 'Unknown').replace('_', ' ').toUpperCase();
          return [
            inc.reportedAt ? new Date(inc.reportedAt).toLocaleDateString() : 'N/A',
            driverName,
            type,
            (inc.severity || 'N/A').toUpperCase(),
            inc.vehicle?.licensePlate || 'N/A',
            inc.trip?.tripNumber || 'N/A',
            inc.status || 'pending',
            (inc.description || 'N/A').substring(0, 40),
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    // ── PAGE: All Vehicles Detail ──────────────────────────
    if (vehicles.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text('7. All Vehicles Detail', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Total records: ${vehicles.length}`, 14, 28);

      autoTable(doc, {
        startY: 33,
        head: [['Make', 'Model', 'Year', 'Plate', 'Status', 'Mileage', 'Fuel', 'Assigned Driver', 'Last Service']],
        body: vehicles.map(v => [
          v.make || 'N/A',
          v.model || 'N/A',
          v.year || 'N/A',
          v.licensePlate || 'N/A',
          v.status || 'N/A',
          v.mileage ? `${v.mileage} km` : 'N/A',
          v.fuelType || 'N/A',
          v.assignedDriver?.name || 'Unassigned',
          v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString() : 'N/A',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    const periodLabel = `Last ${dateRange} Days`;
    doc.save(`fleet-report-${periodLabel.replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportDriverPDF = (driver) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const statusLabel = driver.score > 85 ? 'SAFE' : driver.score >= 60 ? 'NEEDS MONITORING' : 'HIGH RISK';
    const statusColor = driver.score > 85 ? [16, 185, 129] : driver.score >= 60 ? [245, 158, 11] : [239, 68, 68];

    // Title
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text(`Individual Driver Report`, 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text(driver.name, 14, 30);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Email: ${driver.email || 'N/A'}  |  Generated: ${dateStr}  |  Period: Last ${dateRange} Days`, 14, 38);

    // Safety Score Summary
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text('1. Safety Score Summary', 14, 52);

    autoTable(doc, {
      startY: 57,
      head: [['Metric', 'Value']],
      body: [
        ['Safety Score', `${driver.score} / 100`],
        ['Status', statusLabel],
        ['Total Incidents', driver.totalIncidents],
        ['Critical Incidents', driver.critical],
        ['High Severity', driver.high],
        ['Medium Severity', driver.medium],
        ['Low Severity', driver.low],
        ['Total Trips', driver.totalTrips],
        ['Safe Trips (No Incidents)', driver.safeTrips],
      ],
      theme: 'grid',
      headStyles: { fillColor: statusColor },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    // Driver's Incidents
    const driverIncidents = incidents.filter(inc => {
      const rep = inc.driver || inc.reportedBy || inc.assignedDriver;
      return rep && (rep._id === driver._id || rep === driver._id || rep.name === driver.name);
    });

    let finalY = doc.lastAutoTable?.finalY || 100;
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text(`2. Incident History (${driverIncidents.length} records)`, 14, finalY + 15);

    if (driverIncidents.length > 0) {
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'Type', 'Severity', 'Vehicle', 'Trip #', 'Status', 'Description']],
        body: driverIncidents.map(inc => [
          inc.reportedAt ? new Date(inc.reportedAt).toLocaleDateString() : 'N/A',
          (inc.incidentType || inc.type || 'Unknown').replace('_', ' ').toUpperCase(),
          (inc.severity || 'N/A').toUpperCase(),
          inc.vehicle?.licensePlate || 'N/A',
          inc.trip?.tripNumber || 'N/A',
          inc.status || 'pending',
          (inc.description || 'N/A').substring(0, 35),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text('No incidents recorded for this driver in the selected period.', 14, finalY + 28);
      finalY = finalY + 35;
    }

    // Driver's Trips
    const driverTrips = trips.filter(t => {
      const d = t.assignedDriver;
      return d && (d._id === driver._id || d === driver._id || d.name === driver.name);
    });

    finalY = doc.lastAutoTable?.finalY || finalY + 10;
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text(`3. Trip History (${driverTrips.length} records)`, 14, 20);

    if (driverTrips.length > 0) {
      autoTable(doc, {
        startY: 26,
        head: [['Trip #', 'Vehicle', 'Status', 'Priority', 'Distance', 'Start Location', 'End Location', 'Date']],
        body: driverTrips.map(trip => [
          trip.tripNumber || 'N/A',
          trip.assignedVehicle?.licensePlate || 'N/A',
          trip.status || 'N/A',
          trip.priority || 'N/A',
          trip.distance ? `${trip.distance} km` : 'N/A',
          trip.startLocation?.address || 'N/A',
          trip.endLocation?.address || 'N/A',
          new Date(trip.createdAt).toLocaleDateString(),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text('No trips recorded for this driver in the selected period.', 14, 30);
    }

    doc.save(`driver-report-${driver.name.replace(/ /g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="Reports" navigationItems={navigationItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="Reports" navigationItems={navigationItems}>
      <div id="report-content" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive fleet management insights</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                Export Report
                <FiChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => { exportToPDF(); setExportDropdownOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <FiFileText className="h-4 w-4 mr-3 text-red-500" />
                      <div className="text-left">
                        <div className="font-medium">Full PDF Report</div>
                        <div className="text-xs text-gray-400">Safety scores, insights & incidents</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { exportToExcel(); setExportDropdownOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <FiDownload className="h-4 w-4 mr-3 text-green-500" />
                      <div className="text-left">
                        <div className="font-medium">Excel Spreadsheet</div>
                        <div className="text-xs text-gray-400">Trips, vehicles & incidents data</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { setDriverPickerOpen(true); setExportDropdownOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <FiUser className="h-4 w-4 mr-3 text-purple-500" />
                      <div className="text-left">
                        <div className="font-medium">Driver Report</div>
                        <div className="text-xs text-gray-400">Focused report for one driver</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Trips"
            value={trips.length}
            icon={FiTruck}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Vehicles"
            value={vehicles.filter(v => v.status === 'active').length}
            icon={FiTruck}
            color="bg-green-500"
          />
          <StatCard
            title="Total Incidents"
            value={incidents.length}
            icon={FiAlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            title="Resolved Incidents"
            value={incidents.filter(i => i.status === 'resolved').length}
            icon={FiAlertTriangle}
            color="bg-yellow-500"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FiBarChart },
              { id: 'driver_safety', name: 'Driver Safety', icon: FiShield },
              { id: 'trips', name: 'Trips', icon: FiTruck },
              { id: 'vehicles', name: 'Vehicles', icon: FiTruck },
              { id: 'incidents', name: 'Incidents', icon: FiAlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Insights Panel */}
              {aiInsights.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <FiInfo className="h-6 w-6 text-blue-500 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-900">AI System Insights</h3>
                  </div>
                  <div className="space-y-3">
                    {aiInsights.map((insight, idx) => (
                      <div key={idx} className={`p-4 rounded-md border-l-4 ${
                        insight.type === 'danger' ? 'bg-red-50 border-red-500 text-red-800' :
                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                        'bg-green-50 border-green-500 text-green-800'
                      }`}>
                        {insight.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
                <div className="h-64">
                  <Pie data={getTripStatusChartData()} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Types</h3>
                <div className="h-64">
                  <Pie data={getIncidentTypeChartData()} options={chartOptions} />
                </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'driver_safety' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Driver Safety Leaderboard</h3>
                <p className="text-sm text-gray-500">Based on incidents and trip completion history</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Incidents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safe Trips</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {driverScores.map((driver, idx) => (
                      <tr key={driver._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {idx === 0 && driver.score > 85 ? (
                              <FiAward className="h-5 w-5 text-yellow-500 mr-2" />
                            ) : (
                              <div className="h-5 w-5 mr-2"></div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{driver.score}/100</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            driver.score > 85 ? 'bg-green-100 text-green-800' :
                            driver.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {driver.score > 85 ? 'Safe' : driver.score >= 60 ? 'Needs Monitoring' : 'High Risk'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.totalIncidents} (Crit: {driver.critical}, High: {driver.high})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.safeTrips} / {driver.totalTrips}
                        </td>
                      </tr>
                    ))}
                    {driverScores.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No drivers found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Trends (Last 30 Days)</h3>
                <div className="h-64">
                  <Line data={getTripTrendsChartData()} options={lineChartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
                <div className="h-64">
                  <Pie data={getTripStatusChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Make Distribution</h3>
                <div className="h-64">
                  <Pie data={getVehicleMakeChartData()} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status</h3>
                <div className="h-64">
                  <Bar data={{
                    labels: Object.keys(vehicleStats.statusCounts || {}),
                    datasets: [{
                      label: 'Vehicles',
                      data: Object.values(vehicleStats.statusCounts || {}),
                      backgroundColor: '#3B82F6',
                      borderColor: '#2563EB',
                      borderWidth: 1
                    }]
                  }} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Trends (Last 30 Days)</h3>
                <div className="h-64">
                  <Line data={getIncidentTrendsChartData()} options={lineChartOptions} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Types</h3>
                  <div className="h-64">
                    <Pie data={getIncidentTypeChartData()} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Drivers with Most Incidents</h3>
                  <div className="h-64">
                    <Bar data={getDriverIncidentChartData()} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Driver Picker Modal */}
      {driverPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Driver</h3>
                <p className="text-sm text-gray-500">Choose a driver to generate their report</p>
              </div>
              <button
                onClick={() => setDriverPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >&times;</button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {driverScores.map(driver => (
                <button
                  key={driver._id}
                  onClick={() => {
                    setSelectedDriverForReport(driver);
                    exportDriverPDF(driver);
                    setDriverPickerOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-3 ${
                      driver.score > 85 ? 'bg-green-500' :
                      driver.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                      <div className="text-xs text-gray-400">{driver.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-700">{driver.score}/100</span>
                    <div className={`text-xs font-medium ${
                      driver.score > 85 ? 'text-green-600' :
                      driver.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {driver.score > 85 ? 'Safe' : driver.score >= 60 ? 'Monitoring' : 'High Risk'}
                    </div>
                  </div>
                </button>
              ))}
              {driverScores.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">No active drivers found.</div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
              Click on a driver to instantly download their individual PDF report.
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReportsPage;

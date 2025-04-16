const chartSelectionContainer = document.getElementById('chartSelectionContainer');
const detailedChartsContainer = document.getElementById('detailedChartsContainer');
const setupContainer = document.getElementById('setupContainer');
const dataPointsInput = document.getElementById('dataPoints');
const scalePaddings = document.getElementById('scalePaddings');
let updateInterval; 

let availableCharts = {};
let selectedCharts = [];
let chartInstances = {};
let originalPlaceholders = {};
let selectionGrid;
let detailedGrid; 
let previousColors = [];
/*
function saveState() {  //broken
    // const state = {
    //     // chartSelectionContainer: chartSelectionContainer.outerHTML,
    //     // detailedChartsContainer: detailedChartsContainer.outerHTML,
    //     availableCharts: availableCharts,
    //     selectedCharts: selectedCharts,
    //     chartInstances: chartInstances,
    //     originalPlaceholders: originalPlaceholders,
    //     selectionGrid: selectionGrid.save(true,false),
    //     detailedGrid: detailedGrid.save(true,false),
    // }

    // localStorage.setItem('npeeState', JSON.stringify(state));
    // // console.log('State saved:', state);
}

function loadState() { //broken
    // const state = JSON.parse(localStorage.getItem('npeeState'));
    // if (state) {
    //     //code
    //     selectionGrid.removeAll(true);
    //     detailedGrid.removeAll(true);

    //     availableCharts = state.selectedCharts;
    //     selectedCharts = state.selectedCharts;
    //     chartInstances = state.chartInstances;
    //     originalPlaceholders = state.originalPlaceholders;
    //     // chartSelectionContainer.outerHTML = state.chartSelectionContainer;
    //     // detailedChartsContainer.outerHTML = state.detailedChartsContainer;
    //     selectionGrid.load(state.selectionGrid);
    //     detailedGrid.load(state.detailedGrid);
        
    //     // console.log('State loaded:', state);
    // } else {
    //     console.error('No saved state found.');
    // }
}

document.getElementById('saveState').addEventListener('click',saveState);
document.getElementById('loadState').addEventListener('click',loadState);
*/
function resetState() { //OK
    chartSelectionContainer.innerHTML = "";
    detailedChartsContainer.innerHTML = "";

    selectionGrid.destroy(false);
    detailedGrid.destroy(false);

    availableCharts = {};
    selectedCharts = [];
    chartInstances = {};
    originalPlaceholders = {};
    init();
}
document.getElementById('resetState').addEventListener('click', resetState);

/* usado para caixa 'especial' de visão geral

// Modify the document.addEventListener('DOMContentLoaded', function() {...}) to add im_disp element
// function createImDispElement() {
//     const imDisp = document.createElement('div');
//     imDisp.className = 'grid-stack-item';
//     imDisp.setAttribute('gs-w', '1');
//     imDisp.setAttribute('gs-h', '1');

//     const content = document.createElement('div');
//     content.className = 'grid-stack-item-content';
//     content.innerHTML = `
//         <div id="im_disp">
//             <div id="im_W_disp">
//                 <span id="active-power">...</span> kW  <span class="slash">-</span> <span id="power-factor">FP ...</span>
//             </div>
//             <div id="im_data_disp">
//                 <span id="voltage">...</span> V <span class="slash">/</span> <span id="current">...</span> A <span class="slash">/</span> <span id="frequency">...</span> Hz
//             </div>
//             <div id="status_message">
//                 <span id="status">...</span>
//             </div>
//         </div>
//     `;
//     content.setAttribute('data-chart-id', 'input_meter__im_disp');

//     imDisp.appendChild(content);
//     selectionGrid.addWidget(imDisp);
// }

// function parseInputMeterData(data) {    //obsoleto, somente para im_disp
//     const phaseVoltages = data.voltage_per_phase || [];
//     const phaseCurrents = data.current_per_phase || [];
//     const phaseActivePowers = data.active_power_per_phase || [];
//     const phaseReactivePowers = data.reactive_power_per_phase || [];

//     // Calculate average phase voltage
//     const averagePhaseVoltage = phaseVoltages.reduce((sum, voltage) => sum + voltage, 0) / phaseVoltages.length;

//     // Calculate line voltage (sqrt(3) * average phase voltage)
//     const lineVoltage = Math.sqrt(3) * averagePhaseVoltage;

//     // Calculate total current
//     const totalCurrent = phaseCurrents.reduce((sum, current) => sum + Math.abs(current), 0);

//     // Calculate total active power
//     const totalActivePower = phaseActivePowers.reduce((sum, power) => sum + Math.abs(power), 0);

//     // Calculate total reactive power
//     const totalReactivePower = phaseReactivePowers.reduce((sum, power) => sum + Math.abs(power), 0);

//     // Calculate apparent power
//     const apparentPower = Math.sqrt(Math.pow(totalActivePower, 2) + Math.pow(totalReactivePower, 2));

//     // Calculate power factor
//     const powerFactor = calculatePowerFactor(totalActivePower, apparentPower);

//     return {
//         voltage: lineVoltage.toFixed(2),
//         current: totalCurrent.toFixed(2),
//         activePower: (totalActivePower / 1000).toFixed(2), // Convert to kW
//         powerFactor: powerFactor,
//         frequency: data.input_frequency.toFixed(2)
//     };
// }

// function updateImDisp(data) { 
//     const parsedData = parseInputMeterData(data);

//     const activePowerElement = document.querySelector('#im_disp #active-power');
//     const powerFactorElement = document.querySelector('#im_disp #power-factor');
//     const voltageElement = document.querySelector('#im_disp #voltage');
//     const currentElement = document.querySelector('#im_disp #current');
//     const frequencyElement = document.querySelector('#im_disp #frequency');
//     const statusElement = document.querySelector('#im_disp #status');

//     activePowerElement.textContent = parsedData.activePower;
//     powerFactorElement.textContent = 'FP ' + parsedData.powerFactor;
//     voltageElement.textContent = parsedData.voltage;
//     currentElement.textContent = parsedData.current;
//     frequencyElement.textContent = parsedData.frequency;

//     const generation = data.pv_voltage * data.pv_current;
//     const usage = parsedData.voltage * parsedData.current;

//     if (usage < generation) {
//         statusElement.textContent = 'Fornecendo à rede';
//         statusElement.style.color = '#060';
//     } else {
//         statusElement.textContent = 'Consumindo da rede';
//         statusElement.style.color = '#630';
//     }
// }
*/

function addToDetailedGrid(item){
    previousColors = [];    //reset unique colors for each new chart.
    const placeholderContent = item.el.querySelector('.grid-stack-item-content');
    const chartId = placeholderContent.getAttribute('data-chart-id').trim(); // Trim to remove any whitespace

    if (!selectedCharts.includes(chartId)) {
        selectedCharts.push(chartId);
        const [collection, chartType, ...chartKeys] = chartId.split('__');
        const chartKey = chartKeys.join('__');
        const maxDataPoints = parseInt(dataPointsInput.value, 10) || 10; // Default to 10 data points if input is invalid

        fetch(`/api/data/${encodeURIComponent(collection)}/${maxDataPoints}`)
            .then(response => response.json())
            .then(data => {
                // Parse and sort the data by datetime in ascending order
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.datetime.$date);
                    const dateB = new Date(b.datetime.$date);
                    return dateA - dateB;
                });

                const labels = sortedData.map(item => new Date(item.datetime.$date).toLocaleTimeString('pt-BR'));
                const flattenedData = sortedData.map(item => flattenObject(item));

                const chartInstance = renderChart(labels, flattenedData, collection, placeholderContent, chartType, chartKey);
                if (chartInstance) {  // Store the chart instance
                    chartInstances[chartId] = chartInstance;
                    // console.log(`Chart instance stored for chartId: ${chartId}. Available chart instances:`, Object.keys(chartInstances));
                }
            })
            // .catch(error => console.error(`Erro ao buscar dados da coleção ${collection}:`, error));

        // Store the original placeholder innerHTML and attributes
        originalPlaceholders[chartId] = {
            innerHTML: placeholderContent.innerHTML,
            attributes: Array.from(placeholderContent.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {})
        };

        // Set the new size for the grid item
        const gridItemEl = placeholderContent.closest('.grid-stack-item');
        detailedGrid.update(gridItemEl, {w: 4, h: 2});
        detailedGrid.resizable(gridItemEl, true);
        detailedGrid.float(gridItemEl, true);
    } else {
        console.warn(`Chart ID already exists: ${chartId}`);
    }
    // console.log('Current chart instances:', chartInstances);
}

function removeFromDetailedGrid(item){
    const placeholderContent = item.el.querySelector('.grid-stack-item-content');
    const chartId = placeholderContent.getAttribute('data-chart-id').trim(); // Trim to remove any whitespace

    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }

    const index = selectedCharts.indexOf(chartId);
    if (index !== -1) {
        selectedCharts.splice(index, 1);
    }
    const originalState = originalPlaceholders[chartId];
    if (originalState) {
        placeholderContent.innerHTML = originalState.innerHTML;
        // Restore all attributes
        Array.from(placeholderContent.attributes).forEach(attr => placeholderContent.removeAttribute(attr.name));
        for (const attrName in originalState.attributes) {
            placeholderContent.setAttribute(attrName, originalState.attributes[attrName]);
        }
        delete originalPlaceholders[chartId];
    }
    const gridItemEl = placeholderContent.closest('.grid-stack-item');
    selectionGrid.update(gridItemEl, {w: 1, h: 1});
    selectionGrid.compact('compact', true);    
}

document.addEventListener('DOMContentLoaded', init);
function init() {
    const setupButton = document.getElementById('setup');
    setupButton.addEventListener('click', function() {
        if (setupContainer.classList.contains('show')) {
            setupContainer.classList.remove('show');
            setupButton.classList.remove('back');
            setupButton.textContent = 'Configurar';
        } else {  
            setupContainer.classList.add('show');
            setupButton.classList.add('back');
            setupButton.textContent = 'OK';
        }
    });
    selectionGrid = GridStack.init({
        cellHeight: 60,
        acceptWidgets: true,
        float: false,
        animate: true,
        removable: false,
        resizable: false,
        margin: '20px',
        draggable: {
            handle: '.grid-stack-item-content'
        },
        columnOpts: {
            breakpointForWindow: false,  // test window vs grid size
            breakpoints: [{w:600, c:2},{w:900, c:3},{w:1200, c:4},{w:1500, c:5},{w:1800, c:6},{w:2100, c:7},{w:2400, c:8}]
        },
    }, chartSelectionContainer);
    selectionGrid.on('added', function(event, items) {
        items.forEach(item => {
            const gridItemEl = item.el;
            selectionGrid.resizable(gridItemEl, false);
            selectionGrid.float(gridItemEl, false);
            selectionGrid.compact('compact', doSort = true);
        });
    });
    selectionGrid.on('removed', function(event, items) {
        items.forEach(item => {
            selectionGrid.compact('compact', doSort = true);
        });
    });

    detailedGrid = GridStack.init({
        cellHeight: '25%',
        minRow: 4,
        maxRow: 4,
        column: 8,
        margin: '20px',
        acceptWidgets: true, // Accept widgets from other grids
        float: true,
        animate: true,
        removable: false,
        resizable: false,
        resizable: {
            handles: 'se' // Enable resizing from the bottom-right corner
        }
    }, detailedChartsContainer);
    detailedGrid.on('added', function(event, items) {
        items.forEach(item => {
            addToDetailedGrid(item);
        });
    });
    detailedGrid.on('removed', function(event, items) {
        items.forEach(item => {
            removeFromDetailedGrid(item);
        });
    });
    
    fetch('/api/devices')
        .then(response => response.json())
        .then(data => {
            $devices = data.devices;
            selectionGrid.removeAll(true);
            $devices.forEach(device => {
                const collection = device.collection;
                const registers = device.registers;

                // Visão Geral (non-array registers)
                if (registers.some(r => !r.array)) {
                    const chartId = `${collection}__overview`;
                    addChartPlaceholder(device.name, 'Visão Geral', chartId);
                }

                // Visão Completa (all registers)
                const completeChartId = `${collection}__complete`;
                addChartPlaceholder(device.name, 'Visão Completa', completeChartId);

                // [Métrica] por fase (each array register)
                registers.filter(r => r.array).forEach(register => {
                    const chartId = `${collection}__metric_per_phase__${register.label}`;
                    addChartPlaceholder(device.name, register.name, chartId);
                });

                // Visão da fase (each phase index)
                const phaseNumbers = new Set();
                registers.filter(r => r.array).forEach(r => {
                    for (let i = 1; i <= r.elements.length; i++) phaseNumbers.add(i);
                });
                Array.from(phaseNumbers).sort().forEach(phaseNumber => {
                    const chartId = `${collection}__phase_overview__${phaseNumber}`;
                    addChartPlaceholder(device.name, `Visão da fase ${phaseNumber}`, chartId);
                });
            });
        })
        .catch(error => console.error('Erro ao buscar devices:', error));

    document.getElementById('updRate').addEventListener('input', startUpdateInterval);
    document.getElementById('dataPoints').addEventListener('input', function() {
        const maxDataPoints = parseInt(this.value, 10) || 10;
        for (const chartId in chartInstances) {
            const chart = chartInstances[chartId];
            resetChartData(chart, maxDataPoints);
        }
    });

    startUpdateInterval();
}





function addChartPlaceholder(friendlyCollectionName, title, chartId) {
    const placeholder = document.createElement('div');
    placeholder.className = 'grid-stack-item';
    placeholder.setAttribute('gs-w', '1');
    placeholder.setAttribute('gs-h', '1');

    const content = document.createElement('div');
    content.className = 'grid-stack-item-content';
    content.innerHTML = `<div class="placeholder-wrapper"><div class="placeholder-collection-name">${friendlyCollectionName}</div><div class="placeholder-chart-name">${title}</div></div>`;
    content.setAttribute('data-chart-id', chartId);

    placeholder.appendChild(content);
    selectionGrid.addWidget(placeholder);
}

// Function to flatten an object
function flattenObject(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
}





//data extractors seem to be OK:
function extractOverviewData(data, registers, scaleIds) {
    const datasets = [];
    const hasMultiplePoints = data.length > 1;
    registers.forEach(register => {
        const key = register.label;
        const scaleType = register.unit;
        let scaleId = scaleIds[scaleType];
        if (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') scaleId = 'y-axis-power-reactivePower';

        let color = hasMultiplePoints ? getRandomColor() : null;
        datasets.push({
            label: register.name,
            data: data.map(item => (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') ? item[key] / 1000 : item[key]),
            borderColor: color,
            backgroundColor: color ? color + "0a" : null,
             fill: (scaleId == 'y-axis-power-reactivePower'),
            yAxisID: scaleId,
            tension: 0.5,
            pointRadius: 2,
            pointBackgroundColor: color ? color + "80" : null
        });
    });
    return datasets;
}

function extractMetricPerPhaseData(data, register, scaleIds) {
    const datasets = [];
    const key = register.label;
    const hasMultiplePoints = data.length > 1;
    register.elements.forEach((element, index) => {
        const scaleType = register.unit;
        let scaleId = scaleIds[scaleType];
        if (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') scaleId = 'y-axis-power-reactivePower';

        let color = hasMultiplePoints ? getRandomColor() : null;
        datasets.push({
            label: element.name,
            data: data.map(item => (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') ? item[key][index] / 1000 : item[key][index]),
            borderColor: color,
            backgroundColor: color ? color + "16" : null,
             fill: (scaleId == 'y-axis-power-reactivePower'),
            yAxisID: scaleId,
            tension: 0.5,
            pointRadius: 2,
            pointBackgroundColor: color ? color + "80" : null
        });
    });
    return datasets;
}

function extractPhaseOverviewData(data, registers, phaseNumber, scaleIds) {
    const datasets = [];
    const phaseIndex = phaseNumber - 1;
    const hasMultiplePoints = data.length > 1;
    registers.filter(r => r.array).forEach(register => {
        if (phaseIndex >= register.elements.length) return;
        const key = register.label;
        const element = register.elements[phaseIndex];
        const scaleType = register.unit;
        let scaleId = scaleIds[scaleType];
        if (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') scaleId = 'y-axis-power-reactivePower';

        let color = hasMultiplePoints ? getRandomColor() : null;
        datasets.push({
            label: `${register.name} - ${element.name}`,
            data: data.map(item => (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') ? item[key][phaseIndex] / 1000 : item[key][phaseIndex]),
            borderColor: color,
            backgroundColor: color ? color + "16" : null,
             fill: (scaleId == 'y-axis-power-reactivePower'),
            yAxisID: scaleId,
            tension: 0.5,
            pointRadius: 2,
            pointBackgroundColor: color ? color + "80" : null
        });
    });
    return datasets;
}

function extractCompleteData(data, registers, scaleIds) {
    const datasets = [];
    const hasMultiplePoints = data.length > 1;
    registers.forEach(register => {
        const key = register.label;
        const scaleType = register.unit;
        let scaleId = scaleIds[scaleType];
        if (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') scaleId = 'y-axis-power-reactivePower';

        if (register.array) {
            register.elements.forEach((element, index) => {
                let color = hasMultiplePoints ? getRandomColor() : null;
                datasets.push({
                    label: `${register.name} - ${element.name}`,
                    data: data.map(item => (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') ? item[key][index] / 1000 : item[key][index]),
                    borderColor: color,
                    backgroundColor: color ? color + "16" : null,
                    fill: (scaleId == 'y-axis-power-reactivePower'),
                    yAxisID: scaleId,
                    tension: 0.5,
                    pointRadius: 2,
                    pointBackgroundColor: color ? color + "80" : null
                });
            });
        } else {
            let color = hasMultiplePoints ? getRandomColor() : null;
            datasets.push({
                label: register.name,
                data: data.map(item => (scaleType === 'kW' || scaleType === 'kVA' || scaleType === 'kVAr') ? item[key] / 1000 : item[key]),
                borderColor: color,
                backgroundColor: color ? color + "0a" : null,
                 fill: (scaleId == 'y-axis-power-reactivePower'),
                yAxisID: scaleId,
                tension: 0.5,
                pointRadius: 2,
                pointBackgroundColor: color ? color + "80" : null
            });
        }
    });
    return datasets;
}
















function renderChart(labels, data, collection, container, chartType, chartKey) {
    const device = $devices.find(d => d.collection === collection);
    if (!device) {
        console.error(`Device not found for collection: ${collection}`);
        return null;
    }

    const scaleIds = {
        'V': 'y-axis-voltage',
        'A': 'y-axis-current',
        'W': 'y-axis-power',
        'kW': 'y-axis-power',
        'VAR': 'y-axis-reactivePower',
        'kVAR': 'y-axis-reactivePower',
        'Hz': 'y-axis-frequency',
        'FP': 'y-axis-default' // For unitless values like power factor
    };

    let datasets, title;
    try {
        switch (chartType) {
            case 'overview':
                datasets = extractOverviewData(data, device.registers.filter(r => !r.array), scaleIds);
                title = `Visão Geral (${device.name})`;
                break;
            case 'complete':
                datasets = extractCompleteData(data, device.registers, scaleIds);
                title = `Visão Completa (${device.name})`;
                break;
            case 'metric_per_phase':
                const register = device.registers.find(r => r.label === chartKey);
                if (!register) {
                    console.error(`Register not found for chartKey: ${chartKey}`);
                    return null;
                }
                datasets = extractMetricPerPhaseData(data, register, scaleIds);
                title = `${register.name} (${device.name})`;
                break;
            case 'phase_overview':
                const phaseNumber = parseInt(chartKey);
                datasets = extractPhaseOverviewData(data, device.registers, phaseNumber, scaleIds);
                title = `Visão da fase ${phaseNumber} (${device.name})`;
                break;
            default:
                console.error(`Unknown chart type: ${chartType}`);
                return null;
        }
    } catch (error) {
        console.error(`Error generating datasets:`, error);
        return null;
    }

    if (!datasets || datasets.length === 0) {
        console.error(`No datasets generated for chart`);
        return null;
    }

    const scaleData = {};
    datasets.forEach(dataset => {
        const scaleId = dataset.yAxisID;
        if (!scaleData[scaleId]) {
            scaleData[scaleId] = [];
        }
        scaleData[scaleId] = scaleData[scaleId].concat(dataset.data.map(Number));
    });

    const globalScales = {};
    for (const scaleId in scaleData) {
        if (scaleData[scaleId].length === 0) continue;

        const dataValues = scaleData[scaleId];
        // const min = Math.min(...dataValues);
        const min = 0;
        const max = Math.max(...dataValues);
        
        // Special handling for different measurement types
        let suggestedMin, suggestedMax;
        // if (scaleId.includes('frequency')) {
        //     // Frequency (Hz) - fixed range 45-65 for better visibility
        //     suggestedMin = 45;
        //     suggestedMax = 65;
        // } else 
        if (scaleId.includes('default')) {
            // Unitless values like power factor - range 0-1
            suggestedMin = 0;
            suggestedMax = 1;
        } else {
            // Normal scaling with padding
            const padding = (max - min) * scalePaddings.value;
            suggestedMin = min >= 0 ? Math.max(0, min - padding) : min - padding;
            suggestedMax = max + padding;
        }

        // Find the register for this scale
        let scaleTitle = 'Valores';
        const dataset = datasets.find(d => d.yAxisID === scaleId);
        if (dataset) {
            const register = device.registers.find(r => 
                r.name === dataset.label || 
                dataset.label.includes(r.name) ||
                (r.array && dataset.label.includes(r.elements[0].name))
            );
            
            if (register) {
                scaleTitle = register.chart_abbr || register.unit || scaleTitle;
            }
        }

        globalScales[scaleId] = {
            type: 'linear',
            position: scaleId.includes('voltage') || scaleId.includes('current') ? 'left' : 'right',
            min: suggestedMin,
            max: suggestedMax,
            title: {
                display: true,
                text: scaleTitle,
                font: {
                    size: 13,
                    weight: '300',
                    family: '"Inter Tight", "Arial", system-ui, sans-serif',
                }
            },
            ticks: {
                beginAtZero: scaleId.includes('default') // Only begin at zero for unitless
            },
            grid: { drawOnChartArea: scaleId.includes('voltage') }
        };
    }

    const chartCanvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(chartCanvas);

    try {
        const chart = new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 10,
                            padding: 10,
                            pointStyle: 'circle'
                        }
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 15,
                            weight: 'normal',
                            family: '"Inter Tight", "Arial", system-ui, sans-serif',
                        }
                    }
                },
                scales: globalScales,
                elements: {
                    line: {
                        tension: 0.5,
                        pointRadius: 2
                    }
                }
            }
        });
        
        // Store the original scale configuration
        chart.originalScales = JSON.parse(JSON.stringify(globalScales));

        // Store the device reference with the chart for updates
        chart.device = device;
        chart.chartType = chartType;
        chart.chartKey = chartKey;
        
        return chart;
    } catch (error) {
        console.error(`Error creating chart:`, error);
        return null;
    }
}

function updateCharts() {
    const activeCollections = [...new Set(selectedCharts.map(id => id.split('__')[0]))];
    activeCollections.forEach(collection => {
        fetch(`/api/data/${encodeURIComponent(collection)}/1`)
            .then(response => response.json())
            .then(data => {
                const newData = data[0];
                const newLabel = new Date(newData.datetime.$date).toLocaleTimeString('pt-BR');
                
                selectedCharts.filter(id => id.startsWith(`${collection}__`)).forEach(chartId => {
                    const chart = chartInstances[chartId];
                    if (!chart) return;
                    
                    const parts = chartId.split('__');
                    const chartType = parts[1];
                    const chartKey = parts.slice(2).join('__');
                    const device = $devices.find(d => d.collection === collection);
                    if (!device) return;

                    let newDatasetData;
                    switch (chartType) {
                        case 'overview':
                            newDatasetData = extractOverviewData([newData], device.registers.filter(r => !r.array), {});
                            break;
                        case 'complete':
                            newDatasetData = extractCompleteData([newData], device.registers, {});
                            break;
                        case 'metric_per_phase':
                            const register = device.registers.find(r => r.label === chartKey);
                            newDatasetData = extractMetricPerPhaseData([newData], register, {});
                            break;
                        case 'phase_overview':
                            newDatasetData = extractPhaseOverviewData([newData], device.registers, parseInt(chartKey), {});
                            break;
                        default: return;
                    }

                    // Update chart data
                    newDatasetData.forEach((dataset, i) => {
                        if (chart.data.datasets[i]) {
                            chart.data.datasets[i].data.push(dataset.data[0]);
                            if (chart.data.datasets[i].data.length > parseInt(dataPointsInput.value, 10)) {
                                chart.data.datasets[i].data.shift();
                            }
                        }
                    });

                    // Update labels
                    if (chart.data.labels[chart.data.labels.length - 1] !== newLabel) {
                        chart.data.labels.push(newLabel);
                        if (chart.data.labels.length > parseInt(dataPointsInput.value, 10)) {
                            chart.data.labels.shift();
                        }
                    }

                    // Restore original scale configuration
                    Object.keys(chart.originalScales).forEach(scaleId => {
                        if (chart.options.scales[scaleId]) {
                            // Only restore min/max if they were defined in original scales
                            if (chart.originalScales[scaleId].min !== undefined) {
                                chart.options.scales[scaleId].min = chart.originalScales[scaleId].min;
                            }
                            if (chart.originalScales[scaleId].max !== undefined) {
                                chart.options.scales[scaleId].max = chart.originalScales[scaleId].max;
                            }
                        }
                    });
                    chart.update('none');
                });
            })
            .catch(error => console.error(`Erro ao atualizar gráficos: ${error}`));
    });
}

function startUpdateInterval() {
    const rate = parseFloat(document.getElementById('updRate').value) || 5;
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateCharts, rate * 1000);
}

function resetChartData(chart, maxDataPoints) {
    chart.data.labels = chart.data.labels.slice(-maxDataPoints);
    chart.data.datasets.forEach(dataset => dataset.data = dataset.data.slice(-maxDataPoints));
    chart.update('none');
}




//converter para https://nagix.github.io/chartjs-plugin-streaming/master/samples/charts/line-horizontal.html posteriormente?





























// color helpers: convert to Lab-aware color selection
function getRandomColor() {
    let hue, saturation, lightness, r, g, b;
    let color;
    let isUnique = false;
    let attempts = 0;
    const initialThreshold = 300; // Initial threshold for color similarity
    const thresholdStep = 30; // Step to reduce the threshold if no unique color is found
    let threshold = initialThreshold;
    const maxAttempts = 100; // Maximum number of attempts to find a unique color

    while (!isUnique && attempts < maxAttempts) {
        hue = Math.floor(Math.random() * 360); // Random hue value between 0 and 360
        saturation = Math.floor(Math.random() * 40) + 60;
        lightness = Math.floor(Math.random() * 45);
        color = hslToHex(hue, saturation, lightness);

        // Check if the color is unique enough
        isUnique = previousColors.every(prevColor => {
            const [r1, g1, b1] = hexToRgb(prevColor);
            const [r2, g2, b2] = hexToRgb(color);

            // Calculate the Euclidean distance between the two colors
            const distance = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

            return distance >= threshold; // Use the current threshold for comparison
        });

        attempts++;

        // If no unique color is found after a certain number of attempts, reduce the threshold
        if (attempts % 10 === 0 && !isUnique) {
            threshold -= thresholdStep;
            console.warn("Unique color threshold reduced to ",threshold);
        }
        if (attempts == 99) console.warn("No unique colors available anymore.");
    }

    // If no unique color is found after maxAttempts, return a random color with the final threshold
    if (!isUnique) {
        hue = Math.floor(Math.random() * 360);
        saturation = Math.floor(Math.random() * 20) + 80;
        lightness = Math.floor(Math.random() * 60);
        color = hslToHex(hue, saturation, lightness);
    }
    previousColors.push(color);
    // Limit the number of stored colors
    if (previousColors.length > 500) {
        previousColors.shift();
    }
    return color;
}

function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let a = s * Math.min(l, 1 - l);
    let f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    let r = Math.round(255 * f(0));
    let g = Math.round(255 * f(8));
    let b = Math.round(255 * f(4));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}


// trying to use Lab-aware perceptual colors, dE2000 distances and WCAG minimum contrast requirements instead 
// (fails, color distinctness logic is probably bogus, gives colors way closer than it should most of the time)
// const previousLabColors = [];
// const WHITE_RGB = [255, 255, 255];
// const WCAG_AA_RATIO = 4.5;

// // Threshold configuration
// const INITIAL_THRESHOLD = 30; // Starting ΔE2000 threshold (very distinct colors)
// const MIN_THRESHOLD = 10;     // Minimum acceptable difference
// const THRESHOLD_STEP = 3;     // How much to reduce threshold when relaxing
// const MAX_ATTEMPTS = 100;     // Maximum attempts to find a suitable color

// function getRandomColor() {
//     const [r, g, b] = generateDistinctWcagColor();
//     return rgbToHex(r, g, b);
// }

// function generateDistinctWcagColor() {
//     let labColor, rgbColor;
//     let attempts = 0;
//     let currentThreshold = INITIAL_THRESHOLD;
//     let bestCandidate = null;
//     let bestScore = -Infinity;

//     while (attempts < MAX_ATTEMPTS) {
//         labColor = generateRandomLabColor();
//         rgbColor = labToRgb(labColor);
        
//         // Calculate quality metrics
//         const contrastRatio = getContrastRatio(rgbColor, WHITE_RGB);
//         const minDeltaE = previousLabColors.length > 0 ?
//             Math.min(...previousLabColors.map(prev => deltaE2000(prev, labColor))) :
//             Infinity;
        
//         // Score combines contrast and distinctness
//         const score = contrastRatio + (minDeltaE / 10);
        
//         // Store the best candidate found so far
//         if (score > bestScore) {
//             bestScore = score;
//             bestCandidate = { labColor, rgbColor, minDeltaE, contrastRatio };
//         }
        
//         // Check if this meets all our requirements
//         if (contrastRatio >= WCAG_AA_RATIO && minDeltaE >= currentThreshold) {
//             break;
//         }
        
//         attempts++;
        
//         // Gradually relax the threshold if needed
//         if (attempts % 10 === 0 && currentThreshold > MIN_THRESHOLD) {
//             currentThreshold = Math.max(MIN_THRESHOLD, currentThreshold - THRESHOLD_STEP);
//         }
//     }
    
//     // If we didn't find a perfect match, use the best candidate we found
//     const finalCandidate = bestCandidate || {
//         labColor: generateRandomLabColor(),
//         rgbColor: labToRgb(generateRandomLabColor()),
//         minDeltaE: 0,
//         contrastRatio: 0
//     };
    
//     // Store the selected color
//     previousLabColors.push(finalCandidate.labColor);
//     if (previousLabColors.length > 500) previousLabColors.shift();
    
//     return finalCandidate.rgbColor;
// }

// // Rest of your functions remain the same as previous implementation:
// // generateRandomLabColor(), getContrastRatio(), getRelativeLuminance(), 
// // labToRgb(), deltaE2000(), rgbToHex(), etc.

// // WCAG Contrast Ratio Calculation
// function getContrastRatio(rgb1, rgb2) {
//     const lum1 = getRelativeLuminance(rgb1);
//     const lum2 = getRelativeLuminance(rgb2);
//     const lighter = Math.max(lum1, lum2);
//     const darker = Math.min(lum1, lum2);
//     return (lighter + 0.05) / (darker + 0.05);
// }

// function getRelativeLuminance(rgb) {
//     const [r, g, b] = rgb.map(v => {
//         v /= 255;
//         return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
//     });
//     return 0.2126 * r + 0.7152 * g + 0.0722 * b;
// }

// // Adjusted Lab generation to favor more contrast by default
// function generateRandomLabColor() {
//     // Bias toward darker colors (better contrast on white)
//     const L = 20 + Math.random() * 50; // L range 20-70
    
//     // More saturated colors (better visual distinction)
//     const a = -128 + Math.random() * 256;
//     const b = -128 + Math.random() * 256;
    
//     return [L, a, b];
// }


// // CIEDE2000 color difference formula
// function deltaE2000(lab1, lab2) {
//     const [L1, a1, b1] = lab1;
//     const [L2, a2, b2] = lab2;
    
//     // Weighting factors (you can adjust these based on needs)
//     const kL = 1, kC = 1, kH = 1;
    
//     // Convert Lab to LCH
//     const C1 = Math.sqrt(a1 * a1 + b1 * b1);
//     const C2 = Math.sqrt(a2 * a2 + b2 * b2);
//     const avgC = (C1 + C2) / 2;
//     const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
    
//     const a1p = a1 * (1 + G);
//     const a2p = a2 * (1 + G);
//     const C1p = Math.sqrt(a1p * a1p + b1 * b1);
//     const C2p = Math.sqrt(a2p * a2p + b2 * b2);
    
//     let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
//     if (h1p < 0) h1p += 360;
    
//     let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
//     if (h2p < 0) h2p += 360;
    
//     const dLp = L2 - L1;
//     const dCp = C2p - C1p;
    
//     let dh = 0;
//     if (C1p * C2p !== 0) {
//         dh = h2p - h1p;
//         if (dh > 180) dh -= 360;
//         else if (dh < -180) dh += 360;
//     }
//     const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dh * Math.PI / 360);
    
//     const avgL = (L1 + L2) / 2;
//     const avgCp = (C1p + C2p) / 2;
    
//     let avgH = 0;
//     if (C1p * C2p !== 0) {
//         avgH = (h1p + h2p) / 2;
//         if (Math.abs(h1p - h2p) > 180) {
//             avgH += 180;
//         }
//     }
    
//     const T = 1 - 0.17 * Math.cos((avgH - 30) * Math.PI / 180)
//                 + 0.24 * Math.cos(2 * avgH * Math.PI / 180)
//                 + 0.32 * Math.cos((3 * avgH + 6) * Math.PI / 180)
//                 - 0.20 * Math.cos((4 * avgH - 63) * Math.PI / 180);
    
//     const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
//     const SC = 1 + 0.045 * avgCp;
//     const SH = 1 + 0.015 * avgCp * T;
    
//     const dTheta = 30 * Math.exp(-Math.pow((avgH - 275) / 25, 2));
//     const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
//     const RT = -RC * Math.sin(2 * dTheta * Math.PI / 180);
    
//     const term1 = dLp / (kL * SL);
//     const term2 = dCp / (kC * SC);
//     const term3 = dHp / (kH * SH);
    
//     return Math.sqrt(term1 * term1 + term2 * term2 + term3 * term3 + RT * term2 * term3);
// }

// // Convert Lab to RGB (simplified version)
// function labToRgb(lab) {
//     // Convert Lab to XYZ
//     const [L, a, b] = lab;
//     const y = (L + 16) / 116;
//     const x = a / 500 + y;
//     const z = y - b / 200;
    
//     const x3 = x * x * x;
//     const y3 = y * y * y;
//     const z3 = z * z * z;
    
//     const X = 0.95047 * (x3 > 0.008856 ? x3 : (x - 16/116) / 7.787);
//     const Y = 1.00000 * (y3 > 0.008856 ? y3 : (y - 16/116) / 7.787);
//     const Z = 1.08883 * (z3 > 0.008856 ? z3 : (z - 16/116) / 7.787);
    
//     // Convert XYZ to RGB
//     let r = X *  3.2406 + Y * -1.5372 + Z * -0.4986;
//     let g = X * -0.9689 + Y *  1.8758 + Z *  0.0415;
//     let bVal = X *  0.0557 + Y * -0.2040 + Z *  1.0570;
    
//     // Gamma correction
//     r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
//     g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
//     bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal, 1/2.4) - 0.055 : 12.92 * bVal;
    
//     // Clamp to [0,1] then scale to [0,255]
//     r = Math.min(Math.max(0, r), 1) * 255;
//     g = Math.min(Math.max(0, g), 1) * 255;
//     bVal = Math.min(Math.max(0, bVal), 1) * 255;
    
//     return [Math.round(r), Math.round(g), Math.round(bVal)];
// }

// function rgbToHex(r, g, b) {
//     return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
// }
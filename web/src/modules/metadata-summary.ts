/**
 * Metadata Summary Module
 * Handles the Metadata Summary tab logic, including matrix generation
 * and CSV export with PyScript integration.
 */

import { enableButton, disableButton } from "./dom-utils.js";

/**
 * Generate and display the metadata summary matrix
 */
export function generateMetadataSummary(): void {
    if (typeof window.generateMatrixHTML !== "undefined") {
        try {
            const matrixHTML = window.generateMatrixHTML();
            const outputDiv = document.getElementById("metadata-summary-output");
            
            if (outputDiv) {
                outputDiv.innerHTML = matrixHTML;
                
                // Enable the CSV download button if matrix was generated successfully
                if (matrixHTML && !matrixHTML.includes("No metadata available")) {
                    enableButton("download-matrix-csv-btn");
                } else {
                    disableButton("download-matrix-csv-btn");
                }
            }
        } catch (error) {
            console.error("Error generating metadata summary:", error);
            const outputDiv = document.getElementById("metadata-summary-output");
            if (outputDiv) {
                outputDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Error generating summary. Please try again.</p>';
            }
            disableButton("download-matrix-csv-btn");
        }
    } else {
        alert("Matrix generation function not available. Please refresh the page.");
    }
}

/**
 * Download the metadata summary matrix as CSV
 */
export function downloadMetadataCSV(): void {
    if (typeof window.exportMatrixCSV !== "undefined") {
        try {
            const csvData = window.exportMatrixCSV();
            const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
            const filename = `metadata_summary_${timestamp}.csv`;

            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV");
        }
    } else {
        alert("Export function not available. Please refresh the page.");
    }
}

// Track current sort state
let currentSortColumn: string | null = null;
let currentSortDirection: 'asc' | 'desc' = 'asc';

/**
 * Sort the metadata summary table by the specified column
 * @param column - The column name to sort by ('table', field type name, or 'total')
 */
export function sortMetadataTable(column: string): void {
    const tbody = document.getElementById("metadata-summary-tbody");
    if (!tbody) {
        console.error("Table body not found");
        return;
    }

    // Toggle sort direction if clicking the same column
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }

    // Get all data rows (exclude the totals row which is the last one)
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const totalsRow = rows.pop(); // Remove and save the totals row
    
    if (!totalsRow) {
        console.error("No totals row found");
        return;
    }

    // Sort the rows
    rows.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (column === 'table') {
            // Sort by table name (text)
            aValue = (a.getAttribute('data-table') || '').toLowerCase();
            bValue = (b.getAttribute('data-table') || '').toLowerCase();
        } else if (column === 'total') {
            // Sort by total (number)
            aValue = parseInt(a.getAttribute('data-total') || '0', 10);
            bValue = parseInt(b.getAttribute('data-total') || '0', 10);
        } else {
            // Sort by specific field type column (number)
            const aCell = a.querySelector(`td[data-${column}]`);
            const bCell = b.querySelector(`td[data-${column}]`);
            aValue = parseInt(aCell?.getAttribute(`data-${column}`) || '0', 10);
            bValue = parseInt(bCell?.getAttribute(`data-${column}`) || '0', 10);
        }

        // Compare values
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else {
            comparison = (aValue as number) - (bValue as number);
        }

        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // Clear tbody and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    tbody.appendChild(totalsRow); // Re-add totals row at the end

    // Update sort indicators
    updateSortIndicators(column);
}

/**
 * Update the visual sort indicators in the table headers
 * @param activeColumn - The column that is currently sorted
 */
function updateSortIndicators(activeColumn: string): void {
    const indicators = document.querySelectorAll('.sort-indicator');
    
    indicators.forEach(indicator => {
        const col = indicator.getAttribute('data-col');
        if (col === activeColumn) {
            // Show active sort direction
            indicator.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
            indicator.classList.add('text-blue-600', 'dark:text-blue-400');
        } else {
            // Show neutral sort indicator
            indicator.textContent = '⇅';
            indicator.classList.remove('text-blue-600', 'dark:text-blue-400');
        }
    });
}

// Export to window for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.sortMetadataTable = sortMetadataTable;
}

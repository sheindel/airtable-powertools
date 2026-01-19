"""Metadata Summary Tab - Display field type counts by table in a matrix"""
try:
    from pyscript import window
    _HAS_PYSCRIPT = True
except ImportError:
    _HAS_PYSCRIPT = False

import sys
sys.path.append("web")
from components.airtable_client import get_local_storage_metadata
from collections import defaultdict


def get_field_type_matrix():
    """Generate a matrix of table names and field type counts.
    
    Returns:
        Dictionary with:
        - headers: List of field type names
        - rows: List of dicts with table_name and counts for each type
        - totals: Dict with total counts for each type
    """
    metadata = get_local_storage_metadata()
    if not metadata:
        return None
    
    # Collect all field types across all tables
    all_field_types = set()
    table_data = []
    
    for table in metadata.get("tables", []):
        table_name = table.get("name", "Unknown")
        type_counts = defaultdict(int)
        
        for field in table.get("fields", []):
            field_type = field.get("type", "unknown")
            type_counts[field_type] += 1
            all_field_types.add(field_type)
        
        table_data.append({
            "table_name": table_name,
            "counts": dict(type_counts)
        })
    
    # Sort field types alphabetically for consistent display
    sorted_types = sorted(all_field_types)
    
    # Calculate totals for each field type
    totals = defaultdict(int)
    for table in table_data:
        for field_type, count in table["counts"].items():
            totals[field_type] += count
    
    return {
        "headers": sorted_types,
        "rows": table_data,
        "totals": dict(totals)
    }


def generate_matrix_html():
    """Generate HTML table for the field type matrix.
    
    Returns:
        HTML string with the matrix table
    """
    matrix = get_field_type_matrix()
    
    if not matrix:
        return '<p class="text-gray-600 dark:text-gray-400">No metadata available. Please load schema first.</p>'
    
    headers = matrix["headers"]
    rows = matrix["rows"]
    totals = matrix["totals"]
    
    if not headers:
        return '<p class="text-gray-600 dark:text-gray-400">No field types found in metadata.</p>'
    
    # Build the HTML table with sortable headers
    html_parts = [
        '<div class="overflow-x-auto">',
        '<table id="metadata-summary-table" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">',
        '<thead class="bg-gray-50 dark:bg-gray-800">',
        '<tr>',
        '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="table" onclick="sortMetadataTable(\'table\')" title="Click to sort">',
        'Table ',
        '<span class="sort-indicator" data-col="table">⇅</span>',
        '</th>'
    ]
    
    # Add column headers for each field type (sortable)
    for idx, field_type in enumerate(headers):
        html_parts.append(
            f'<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="{field_type}" onclick="sortMetadataTable(\'{field_type}\')" title="Click to sort">{field_type} <span class="sort-indicator" data-col="{field_type}">⇅</span></th>'
        )
    
    html_parts.extend([
        '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="total" onclick="sortMetadataTable(\'total\')" title="Click to sort">Total <span class="sort-indicator" data-col="total">⇅</span></th>',
        '</tr>',
        '</thead>',
        '<tbody id="metadata-summary-tbody" class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">'
    ])
    
    # Add data rows with data attributes for sorting
    for row in rows:
        table_name = row["table_name"]
        counts = row["counts"]
        row_total = sum(counts.values())
        
        html_parts.append(f'<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-table="{table_name}" data-total="{row_total}">')
        html_parts.append(
            f'<td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-900">{table_name}</td>'
        )
        
        # Add count for each field type with data attributes
        for field_type in headers:
            count = counts.get(field_type, 0)
            if count > 0:
                html_parts.append(
                    f'<td class="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300" data-{field_type}="{count}">{count}</td>'
                )
            else:
                html_parts.append(
                    f'<td class="px-4 py-3 text-sm text-center text-gray-400 dark:text-gray-600" data-{field_type}="0">-</td>'
                )
        
        html_parts.append(
            f'<td class="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">{row_total}</td>'
        )
        html_parts.append('</tr>')
    
    # Add totals row
    total_all_fields = sum(totals.values())
    html_parts.extend([
        '<tr class="bg-gray-100 dark:bg-gray-800 font-semibold">',
        '<td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 sticky left-0 bg-gray-100 dark:bg-gray-800">Total</td>'
    ])
    
    for field_type in headers:
        count = totals.get(field_type, 0)
        html_parts.append(
            f'<td class="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">{count}</td>'
        )
    
    html_parts.extend([
        f'<td class="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">{total_all_fields}</td>',
        '</tr>',
        '</tbody>',
        # Add footer with repeated column headers
        '<tfoot class="bg-gray-50 dark:bg-gray-800">',
        '<tr>',
        '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="table" onclick="sortMetadataTable(\'table\')" title="Click to sort">Table <span class="sort-indicator" data-col="table">⇅</span></th>'
    ])
    
    # Repeat field type headers in footer
    for field_type in headers:
        html_parts.append(
            f'<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="{field_type}" onclick="sortMetadataTable(\'{field_type}\')" title="Click to sort">{field_type} <span class="sort-indicator" data-col="{field_type}">⇅</span></th>'
        )
    
    html_parts.extend([
        '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" data-column="total" onclick="sortMetadataTable(\'total\')" title="Click to sort">Total <span class="sort-indicator" data-col="total">⇅</span></th>',
        '</tr>',
        '</tfoot>',
        '</table>',
        '</div>'
    ])
    
    return ''.join(html_parts)


def export_matrix_to_csv():
    """Export the field type matrix as CSV.
    
    Returns:
        CSV formatted string
    """
    matrix = get_field_type_matrix()
    
    if not matrix:
        return "No data available"
    
    headers = matrix["headers"]
    rows = matrix["rows"]
    totals = matrix["totals"]
    
    # Build CSV lines
    lines = []
    
    # Header row
    header_row = ["Table"] + headers + ["Total"]
    lines.append(",".join(f'"{h}"' for h in header_row))
    
    # Data rows
    for row in rows:
        table_name = row["table_name"]
        counts = row["counts"]
        row_total = sum(counts.values())
        
        csv_row = [f'"{table_name}"']
        for field_type in headers:
            csv_row.append(str(counts.get(field_type, 0)))
        csv_row.append(str(row_total))
        
        lines.append(",".join(csv_row))
    
    # Totals row
    total_all_fields = sum(totals.values())
    totals_row = ['"Total"']
    for field_type in headers:
        totals_row.append(str(totals.get(field_type, 0)))
    totals_row.append(str(total_all_fields))
    
    lines.append(",".join(totals_row))
    
    return "\n".join(lines)


def initialize():
    """Initialize the Metadata Summary tab"""
    print("Metadata Summary tab initialized")
    
    # Export functions to JavaScript (only in PyScript context)
    if _HAS_PYSCRIPT:
        window.generateMatrixHTML = generate_matrix_html
        window.exportMatrixCSV = export_matrix_to_csv

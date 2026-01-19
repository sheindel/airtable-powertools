# Date-Based Versioning System

## Overview

The project uses a **date-based versioning system** in the format `YYYY.MM.DD` (e.g., `2026.01.18`). This provides clear, chronological version identifiers that are easy to understand and maintain.

## Version Format

### Full Version (with Build Index)
- **Format**: `YYYY.MM.DD.HHMM`
- **Example**: `2026.01.18.1430`
- **Components**: 
  - `YYYY.MM.DD` = Build date
  - `HHMM` = Build time in UTC (24-hour format)
- **Usage**: Uniquely identifies each build with date and time

### Display Version
- **Format**: `vYYYY.MM.DD`
- **Example**: `v2026.01.18`
- **Usage**: Clean display in UI (full version shown in tooltip)

## Version Locations

The version appears in multiple project files:

1. **[pyproject.toml](../pyproject.toml)** - Python project metadata
   ```toml
   version = "2026.01.18"
   ```

2. **[package.json](../package.json)** - Node.js project metadata
   ```json
   "version": "2026.01.18"
   ```

3. **[web/pyscript.toml](../web/pyscript.toml)** - PyScript configuration
   ```toml
   version = "2026.01.18"
   ```

4. **[web/index.html](../web/index.html)** - Default version display
   ```html
   <span id="app-version">v2026.01.18</span>
   ```

## CI/CD Pipeline

The GitHub Actions workflow ([.github/workflows/static.yml](../.github/workflows/static.yml)) automatically generates date-based versions during deployment:

### Automatic Version Generation

```yaml
- name: Inject version into HTML
  run: |
    # Generate date-based version with build index (YYYY.MM.DD.HHMM format)
    DATE_VERSION=$(date -u +%Y.%m.%d)
    BUILD_INDEX=$(date -u +%H%M)
    FULL_VERSION="${DATE_VERSION}.${BUILD_INDEX}"
    COMMIT_SHA=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=%B | head -n 1)
    BUILD_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Check if this is a tagged release
    if git describe --exact-match --tags HEAD 2>/dev/null; then
      DISPLAY_VERSION="v${DATE_VERSION}"
      TOOLTIP="Version ${FULL_VERSION} | Built: ${BUILD_TIME}"
    else
      DISPLAY_VERSION="v${DATE_VERSION}"
      TOOLTIP="Version ${FULL_VERSION} | Commit: ${COMMIT_SHA} | Built: ${BUILD_TIME} | ${COMMIT_MSG}"
    fi
    
    echo "Deploying version: ${FULL_VERSION} (${COMMIT_SHA})"
    
    # Replace version in index.html with tooltip
    sed -i "s|<span id=\"app-version\"[^>]*>v[0-9.-]*</span>|<span id=\"app-version\" title=\"${TOOLTIP}\" class=\"cursor-help\">${DISPLAY_VERSION}</span>|g" web/index.html
```

### Version Logic

1. **Display**: Always shows clean `v2026.01.18` format
2. **Tooltip**: Reveals full version info on hover:
   - **Tagged releases**: `Version 2026.01.18.1430 | Built: 2026-01-18 14:30:00 UTC`
   - **Development builds**: `Version 2026.01.18.1430 | Commit: a3f2b1c | Built: 2026-01-18 14:30:00 UTC | commit message`

## Updating Versions

### Manual Updates (Project Files)

When updating versions in project files, use the current date:

```bash
# Get current date in correct format
date +%Y.%m.%d

# Example: 2026.01.18
```

Update all three files with the same date:
- [pyproject.toml](../pyproject.toml)
- [package.json](../package.json)
- [web/pyscript.toml](../web/pyscript.toml)

### Automatic Updates (Deployments)

The CI/CD pipeline automatically:
1. Generates the current date when deploying
2. Appends commit hash for non-tagged builds
3. Injects the version into [web/index.html](../web/index.html)

**No manual intervention required** for deployment versions!

## Benefits of Date-Based Versioning

1. **Chronological clarity**: Instantly know when a version was released
2. **No semantic version debates**: No need to decide if a change is major/minor/patch
3. **Automatic CI/CD**: Date generation is straightforward in pipelines
4. **Human-readable**: `2026.01.18` is more intuitive than `v0.4.0`
5. **Avoids version number exhaustion**: No running out of version numbers
6. **Consistent with build timestamps**: Aligns with deployment dates

## Migration from Semantic Versioning
 with a tooltip for additional details:

```html
<span id="app-version" 
      title="Version 2026.01.18.1430 | Commit: a3f2b1c | Built: 2026-01-18 14:30:00 UTC | commit message" 
      class="cursor-help border-b border-dotted border-gray-400 dark:border-gray-500">
    v2026.01.18
</span>
```

**User Experience**:
- **Visual**: Clean date format (`v2026.01.18`)
- **On Hover**: Dotted underline indicates more info available
- **Tooltip**: Shows full version with build time, commit hash, and commit message

CI/CD automatically updates both the display version and tooltip during deploymen

```html
<diBuild Index Details

The build index (`.HHMM` suffix) provides:

1. **Uniqueness**: Each build has a unique timestamp
2. **Traceability**: Know exactly when a deployment occurred
3. **Ordering**: Builds can be sorted chronologically within the same day
4. **UTC timezone**: All times are in UTC for consistency

**Example**: `2026.01.18.1430` indicates:
- Built on January 18, 2026
- At 14:30 (2:30 PM) UTC

## Version Information in Tooltip

The tooltip includes comprehensive build information:

- **Full version**: `2026.01.18.1430`
- **Build time**: `2026-01-18 14:30:00 UTC`
- **Commit hash**: Short SHA (e.g., `a3f2b1c`)
- **Commit message**: First line of commit message
- **Visual indicator**: Dotted underline suggests hovering for details
All dates are generated in UTC timezone during CI/CD runs. If timezone specificity is needed, consider appending timezone:

```
2026.01.18-utc
```

However, the standard `YYYY.MM.DD` format is sufficient for most use cases.

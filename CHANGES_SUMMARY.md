# Summary of Changes

## 1. Fixed Doctor Name Resolution in ReportUpload
**File**: `frontend/src/components/ReportUpload.jsx`
- Changed from `officer.firstName + officer.lastName` to `officer.name`
- Officers have a single `name` field, not separate first/last names

## 2. Visitor ID and Serial Number Restructuring

### Backend Changes:

#### VisitorService.js
- **Removed**: `getNextIdForEntity()` method
- **Updated**: `getNextSerialForEntity(entityId)` now returns 6-digit numbers (e.g., "000001", "000002")
- **Old format**: "E1-V1", "E1-V2" (composite)
- **New format**: "000001", "000002" (simple 6-digit)

#### visitorController.js
- **ID Generation**: Changed from 6-digit number to UUID using `uuidv4()`
- **Serial Generation**: Now uses `entityId` instead of `entitySerial`
- **Added**: `getNextSerial(req, res)` endpoint for preview
- **Route**: `GET /visitors/entity/:entityId/next-serial`

#### visitorRoutes.js
- Added new route for getting next serial number (must be before the generic `:entityId` route)

### Frontend Changes:

#### visitorService.js
- Added `getNextSerial(entityId)` method to fetch the next serial number

#### UserDashboard.jsx
- Added `nextVisitorSerial` state
- Added useEffect to fetch next serial when visitor modal opens (only for new patients, not edits)
- Passes `nextVisitorSerial` to ReceptionTab

#### ReceptionTab.jsx
- Receives and forwards `nextVisitorSerial` to VisitorsSection

#### VisitorsSection.jsx
- Receives `nextVisitorSerial` prop
- Displays a blue info box showing the serial that will be assigned (e.g., "E1-000001")
- Only shows when creating a new patient (not when editing)

### Migration Script:
**File**: `backend/scripts/migrate-visitor-ids.js`

**What it does**:
1. Converts all visitor IDs from 6-digit numbers to UUIDs
2. Converts all visitor serials to 6-digit format
3. Updates all related interactions with new visitor IDs and serials
4. Maintains chronological order (first visitor gets "000001", second gets "000002", etc.)

**To run**: `node scripts/migrate-visitor-ids.js` (from backend directory)

## 3. Fixed API Polling Issue

### UserDashboard.jsx
- **Problem**: Changing filters created multiple stacked intervals
- **Solution**: Split into two separate useEffects:
  - Effect 3a: Loads interactions when filter changes (no interval)
  - Effect 3b: Polling interval (only depends on entityId, not filter)
- **Result**: Reduced API calls from ~17 per 3 minutes to 1 per 30 seconds + manual filter changes

## Display Format:

### Visitor Serial Display:
- **Database**: "000001" (6-digit number)
- **UI Display**: "E1-000001" (entitySerial-serial)
- The `getVisitorSerial()` function handles both old and new formats automatically

### Visitor ID:
- **Old**: "000001" (6-digit number)
- **New**: "a1b2c3d4-e5f6-7890-..." (UUID)
- IDs are internal and not displayed to users

## Testing Checklist:
- [ ] Run migration script
- [ ] Create a new patient and verify serial preview shows
- [ ] Verify serial is displayed correctly in patient list
- [ ] Verify interactions show correct patient serials
- [ ] Verify report upload shows correct doctor name
- [ ] Verify API is not being called excessively
- [ ] Test filter changes don't create multiple intervals

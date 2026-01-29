# Visitor ID and Serial Migration Summary

## Changes Made

### Backend Changes:
1. **VisitorService.js**:
   - Removed `getNextIdForEntity()` method (no longer needed)
   - Updated `getNextSerialForEntity()` to return 6-digit numbers instead of composite format
   - Serial format changed from "E1-V1" to "000001"

2. **visitorController.js**:
   - Changed visitor ID generation from 6-digit number to UUID (using `uuidv4()`)
   - Updated serial generation to use `entityId` instead of `entitySerial`
   - Added `getNextSerial()` endpoint to preview next serial number
   - Interaction creation now uses simple 6-digit serial

3. **visitorRoutes.js**:
   - Added route: `GET /visitors/entity/:entityId/next-serial`

### Frontend Changes:
1. **visitorService.js**:
   - Added `getNextSerial(entityId)` method

2. **UserDashboard.jsx**:
   - Added `nextVisitorSerial` state
   - Added useEffect to fetch next serial when modal opens
   - Passes `nextVisitorSerial` to ReceptionTab

3. **ReceptionTab.jsx**:
   - Receives and passes `nextVisitorSerial` to VisitorsSection

4. **ReportUpload.jsx**:
   - Fixed doctor name resolution to use `officer.name` field

### Migration Script:
- Created `backend/scripts/migrate-visitor-ids.js`
- Converts existing visitor IDs from 6-digit numbers to UUIDs
- Converts existing serials to proper 6-digit format (000001, 000002, etc.)
- Updates all related interactions with new visitor IDs and serials

## Next Steps:
1. Run the migration script: `node scripts/migrate-visitor-ids.js`
2. Update VisitorsSection to display nextVisitorSerial in the create form
3. Test the changes

## Serial Format:
- **Old**: E1-V1, E1-V2 (composite format)
- **New**: 000001, 000002 (6-digit number)
- **Display**: Will show as entitySerial-serial (e.g., "E1-000001") in UI

## ID Format:
- **Old**: 6-digit number (e.g., "000001")
- **New**: UUID (e.g., "a1b2c3d4-e5f6-...")

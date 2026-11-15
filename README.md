# PEXFO Mess Tracker v2

## New in v2
- Editable daily mess price in Settings. Default ₹140.
- Separate Extras tab for tea, snacks, shakes, etc.
- Each extra entry has a custom name, price and date.
- Extras total is calculated independently by month and never added to the mess bill.
- Delete an extra entry if entered by mistake.
- CSV export includes mess and extras; JSON backup/restore includes settings and all records.
- Existing v1 mess dates are migrated automatically in the same browser.

## Deploy free with GitHub Pages
1. Create a GitHub repository named `pexfo-mess-tracker`.
2. Upload all files in this folder to the repository root.
3. Open Settings → Pages.
4. Choose Deploy from a branch, `main`, folder `/ (root)`, then Save.
5. Open the published HTTPS link in Chrome on Android.
6. Use Chrome menu → Add to Home screen / Install app.

## Data
Records are stored in local browser storage on this device. Clearing site data may erase them. Use Settings → Backup data regularly. Extras are an independent expense ledger and are not included in the hostel mess calculation.
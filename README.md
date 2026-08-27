# Appliance Rebate Tracker — Network Selector v1

Second-site build with BrandSource vs Nationwide/NMG selection.

## Network rules
- BrandSource: Café National, Profile National, Profile Laundry, BrandSource Commercial Laundry, Monogram D&I, BrandSource Labor Day (date-aware).
- Nationwide/NMG: NMG Café combined program (NOT Café National), Profile National, Profile Laundry, NMG Commercial Laundry, NMG Labor Day (date-aware).
- Profile Laundry is treated as an exclusive alternative because its official form says it cannot be combined with any other GE Appliances rebate or promotion.

## Date preview
Append `?date=2026-08-27` to preview scheduled programs.

## GitHub Pages
Upload everything in this folder to the root of a separate GitHub repository. Keep `rebates/` intact.

## Build version
2026.08.21.network.1


## Predictive model entry (v2)
- Start typing 2 or more characters of a model number to see suggestions.
- Suggestions are built only from rebate programs active for the selected network and simulated/current date.
- Each suggestion shows model, category, and matching rebate program context.
- Arrow Up/Down changes selection; Enter inserts; Escape closes.
- Clicking a suggestion inserts it into the package.
- Models already entered are suppressed from suggestions to reduce duplicates.

## Update 2026-08-26
- BrandSource GE Commercial Laundry Pair rebate extended through September 30, 2026.
- Official GEQ3COMLAU26 printable form replaced with version 8.19.26.
- Nationwide/NMG commercial laundry program and all other calculator behavior remain unchanged.


## Google Analytics 4
Measurement ID: `G-YZNSEDDBPM`. Tracks page traffic, dealer-network selection, rebate checks, package size, qualifying rebate count/programs, compatible calculated rebate total, and print actions. Appliance model numbers are not transmitted to analytics.


## Print reliability update
This build improves Print Eligible Rebate Forms without changing rebate calculations. One qualifying form opens directly. Multiple qualifying forms are merged when the browser can load pdf-lib; if the primary CDN is unavailable the app retries from a second CDN. If merging is blocked, a fallback page provides direct links to every qualifying official form.


## Print fix v3
Single-form printing now resolves the eligible rebate PDF to an absolute URL based on the live GitHub Pages site before navigating the print tab. This corrects the single-rebate case while leaving multi-form packet merging unchanged.


## Print pipeline v6
The eligible-form feature now uses one unified PDF preparation path for both single-form and multi-form packages. This removes the separate single-form navigation branch that caused inconsistent behavior.

# Rental Shop Manager — editable source

Open this whole folder in Visual Studio Code: **File → Open Folder**.
Open `index.html` in Chrome to run the app. No installation, build step, internet
connection or local server is needed.

## Where to make changes

| File | Responsibility |
| --- | --- |
| `index.html` | Main page structure, sidebar container, header, dialogs and script loading order |
| `style.css` | Colors, fonts, sizes, spacing, sidebar, dashboard layout, mobile and print design |
| `app.js` | Menu items, page titles, navigation, rendering and startup |
| `auth.js` | Load the local workspace and read the display profile; **no real login or authentication** |
| `core.js` | Shared state, browser storage, rent calculations, dates and backup validation |
| `icons.js` | SVG icon definitions |
| `ui.js` | Shared tables, panels, buttons, fields and document dialogs |
| `dashboard.js` | Dashboard cards, charts, notifications and quick actions |
| `shop.js` | Shop list and add/edit shop form |
| `tenant.js` | Tenant list and add/edit tenant form |
| `contract.js` | Contract forms, renewal, scheduled increases and agreement printing |
| `payment.js` | Payment form, collection, outstanding, receipts, voiding and rent bills |
| `notice.js` | Rent reminder drafts, editing, printing and delivery records |
| `expense.js` | Expenses and maintenance list and form |
| `utility.js` | Utility bills, collection form and receipts |
| `report.js` | Reports, CSV downloads and report printing |
| `settings.js` | Organization settings, JSON backup/restore, Urdu migration and reset |
| `demo.js` | Fictional demonstration records |
| `forms.js` | Shared form dialog controller and feature form dispatch |

## Design changes

Change the palette in the `:root` section at the top of `style.css`.

```css
--navy: #1d304b; /* Sidebar */
--blue: #2475d1; /* Primary buttons */
--bg: #f2f6fc;   /* Page background */
--ink: #183351;  /* Main text */
```

Use `.stats`, `.stat`, `.panel` and `.dashboard-grid` to change dashboard layout.
Use `aside`, `nav` and `.brand` to change the sidebar.
Use the `body` rule to change the font. Mobile styles are at the bottom of the
stylesheet, followed by print styles.

For menu labels or order, edit `navItems` in `app.js`. For a shop form field,
edit `shopFormConfig()` in `shop.js`; for payment fields, edit
`paymentFormConfig()` in `payment.js`. The shared dialog stays in `forms.js`.

Save files, then refresh Chrome with **Ctrl + Shift + R**.

## Loading order

The scripts are ordinary browser scripts, not ES modules. This allows the app
to run directly from a local `file://` location without a server. They share
one application state. Keep their order in `index.html`: `core.js` first and
`app.js` last. `auth.js` defines loading helpers; `app.js` calls them only after
all feature files have loaded. HTML click handlers use global functions.

## Data compatibility and moving PCs

The storage key remains `rental-shop-manager-en-v2`; the backup schema and Urdu
backup import remain compatible. Updating the existing `index.html` at the same
location in the same browser keeps the previous storage identity. Browser
storage behavior for local files can vary, so download a JSON backup before
moving or replacing the app.

**Transfer the entire folder**, not just `index.html`. On another PC, extract
the ZIP, open `index.html`, then restore your JSON backup in Settings. The app
does not synchronize between PCs. No credentials or actual database records
are included in the source package.

`auth.js` does not secure records or implement user permissions. Real account
authentication and multi-user access require a backend; adding a local password
would not provide that protection.

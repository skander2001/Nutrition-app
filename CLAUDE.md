# NutriCare — Medical Nutrition Platform

**Project**: Healthcare SPA for patient-doctor interactions (nutritionist consultations, appointments, medical records).  
**Frontend**: Angular 19 standalone components, lazy-loaded routes. Public landing + authenticated pages (login, register, dashboard, appointment booking, profile).  
**Backend**: (TODO — Python Flask)

---

## Quick Start

```bash
cd frontend
npm install
npm start              # Dev server: http://localhost:4200
npm run build          # Production build
npm test               # Unit tests (Karma/Jasmine)
```

---

## Architecture

### App Structure
- **Pages** (`/pages/*`): Route-level components (Landing, Login, Register, Dashboard, Appointment, Profile)
  - Each page: `.component.ts` (logic + data), `.component.html` (template), `.component.css` (styles)
  - Authenticated pages use `@HostBinding` to add `has-shell` class to `<body>` → triggers sidebar + indigo background
  
- **Shared** (`/shared/*`): Reusable components (Sidebar, Topbar, Chatbot)
  - Imported by authenticated pages
  - Sidebar accepts `@Input() active: SidebarKey` to highlight current nav item
  - Topbar accepts `@Input() userName`, `userRole`, `initials`

- **Routes** (`app.routes.ts`): Lazy-loaded per page
  ```typescript
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) }
  ```

### Design System (global `styles.css`)

**CSS Variables** (`:root`):
- **Brand**: `--brand: #4f46e5` (indigo)
- **Grayscale**: `--ink`, `--ink-2`, `--ink-3` (text), `--bg`, `--surface`, `--line` (semantic colors)
- **Status**: `--ok: #10b981`, `--warn: #f59e0b`, `--danger: #ef4444`, `--info: #06b6d4`
- **Fonts**: `Plus Jakarta Sans` (body), `JetBrains Mono` (labels, data)

**Shared Classes**:
- `.shell` + `.shell-main`: Layout grid (240px sidebar + 1fr main)
- `.card`: White container with border, shadow, rounded corners
- `.btn`, `.btn.ghost`, `.btn.lg`: Button variants
- `.badge`: Status indicator with colored dot
- `.tabs`: Horizontal tab bar
- `.field`, `.input`, `.select`, `.textarea`: Form elements
- `.see-all`: Link button style

---

## Key Files & Patterns

### Authenticated Pages (Dashboard, Appointment, Profile)
Pattern: Use `has-shell` for sidebar layout
```typescript
// dashboard.component.ts
@HostBinding('class.dashboard-host') hostClass = true;
ngOnInit() { document.body.classList.add('has-shell'); }
ngOnDestroy() { document.body.classList.remove('has-shell'); }
```
This triggers the shell layout (sidebar + topbar) and indigo background.

### Data-Driven Components
Pages define typed interfaces and arrays:
```typescript
interface Appointment { num: string; date: string; /* ... */ }
appointments: Appointment[] = [ /* data */ ];
```
Templates use `*ngFor` + conditional binding:
```html
<div *ngFor="let a of appointments" class="appt">
  <div class="appt-col-val">{{ a.date }}</div>
</div>
```

### Shared Auth CSS
`login/auth.component.css` is reused by register:
```typescript
// register.component.ts
styleUrl: '../login/auth.component.css'
```

### Form Binding
Forms use two-way binding with `FormsModule`:
```typescript
// login.component.ts
email = ''; password = '';

<input type="email" [(ngModel)]="email" name="email" />
```

---

## Common Tasks

### Add a New Page
1. Create folder: `/pages/page-name/`
2. Generate 3 files: `.component.ts`, `.component.html`, `.component.css`
3. Export standalone component:
   ```typescript
   @Component({
     selector: 'app-page-name',
     standalone: true,
     imports: [CommonModule, SidebarComponent, TopbarComponent, ChatbotComponent],
     templateUrl: './page-name.component.html',
     styleUrl: './page-name.component.css'
   })
   ```
4. Add route in `app.routes.ts` with lazy loading
5. If page uses sidebar + shell layout:
   - Add `@HostBinding('class.page-name-host') hostClass = true;`
   - Add `ngOnInit/ngOnDestroy` to manage `document.body.classList.add/remove('has-shell')`

### Add a Shared Component
1. Create folder: `/shared/component-name/`
2. Define component with `standalone: true`
3. Import in pages that need it:
   ```typescript
   imports: [CommonModule, MySharedComponent]
   ```

### Style New Elements
- Use CSS custom properties from `:root` (e.g., `color: var(--brand)`)
- Follow existing naming: `.section-hd`, `.card`, `.info-box`, `.toggle-row`
- Responsive breakpoints: `@media (max-width: 1280px)`, `(max-width: 720px)`, `(max-width: 600px)`

### Add Form Fields
Use class `.field` + `.input`/`.textarea`/`.select`:
```html
<div class="field">
  <label class="lbl">Label</label>
  <input class="input" [(ngModel)]="variable" />
</div>
```

---

## Component Inventory

| Page | Route | Purpose | Shell Layout |
|------|-------|---------|--------------|
| Landing | `/` | Public home page | No |
| Login | `/login` | Authentication | No (split-screen) |
| Register | `/register` | Sign up | No (split-screen) |
| Dashboard | `/dashboard` | Patient overview | Yes |
| Appointment | `/appointment` | Book consultation (3-step stepper) | Yes |
| Profile | `/profile` | Edit patient info (6 sections) | Yes |

| Shared | Purpose |
|--------|---------|
| Sidebar | Nav + CTA button + account menu |
| Topbar | Search + notifications + user profile |
| Chatbot | Floating FAB + chat panel with typing animation |

---

## Conventions

- **Component names**: Generic (Login, Register, Dashboard) — NOT "NutriCare"-prefixed
- **CSS scope**: Each page has its own `.css` file; shared styles in `styles.css`
- **Type safety**: Use TypeScript interfaces for data structures (`Appointment`, `Document`, `Record`)
- **Imports**: `CommonModule` for `*ngFor`, `*ngIf`; `FormsModule` for `[(ngModel)]`
- **Responsive design**: Mobile-first, test at 1280px, 720px, 600px breakpoints
- **Validation**: Client-side only (server validation pending backend)

---

## Important Gotchas

1. **`has-shell` body class is required** for sidebar layout to display + background to be indigo.  
   Forgetting `ngOnInit/ngOnDestroy` will break layout.

2. **Shared auth CSS**: Register imports auth CSS from login. Don't duplicate.

3. **Sidebar active state**: Pass `active="component-name"` matching the `SidebarKey` type.  
   Valid values: `'dashboard'`, `'appointment'`, `'records'`, `'messages'`, `'plan'`, `'tracking'`, `'billing'`, `'profile'`

4. **Lazy loading**: Routes use dynamic imports. Build time is longer but individual page bundles are smaller.

5. **No backend yet**: Forms don't post data. Add `(ngSubmit)="submit()"` on `<form>` and implement submission logic when API is ready.

6. **Chatbot is mock**: Fake AI replies + suggestion chips. Replace with real API when backend is ready.

---

## File Locations

```
frontend/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── landing/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   ├── appointment/
│   │   │   └── profile/
│   │   ├── shared/
│   │   │   ├── sidebar/
│   │   │   ├── topbar/
│   │   │   └── chatbot/
│   │   ├── app.routes.ts
│   │   ├── app.component.ts
│   │   └── app.config.ts
│   ├── styles.css          (← Global design system)
│   ├── index.html          (← Google Fonts, favicon)
│   └── main.ts
├── angular.json
├── package.json
└── README.md
```

---

## Next Steps for Backend

When Flask backend is ready:
1. Create `/backend/app.py` with endpoints:
   - `POST /api/auth/register`, `/api/auth/login`
   - `GET /api/patient/:id` (dashboard data)
   - `POST /api/appointments` (booking)
   - `PATCH /api/patient/:id` (profile updates)
2. Update frontend components to call backend instead of using mock data
3. Add error handling + loading states

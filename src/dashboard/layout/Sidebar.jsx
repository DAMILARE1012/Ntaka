import { NavLink } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { ROLE_LABELS } from '@/services/mock/accounts';
import { navFor } from '@/dashboard/layout/navigation';

function NavItem({ item }) {
  if (item.soon) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-faint"
        title="Coming in a later phase"
      >
        <Icon name={item.icon} className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <span className="rounded bg-subtle px-1.5 py-0.5 text-2xs font-semibold text-faint">
          Soon
        </span>
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-soft text-brand ring-1 ring-inset ring-brand-border'
            : 'text-muted hover:bg-subtle hover:text-fg',
        )
      }
    >
      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

/** Persistent sidebar on desktop; rendered inside the drawer on mobile. */
export default function Sidebar({ role, onNavigate }) {
  const sections = navFor(role);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4" onClick={onNavigate}>
      <div className="px-1">
        <Logo size="sm" />
        <p className="mt-2 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
          {ROLE_LABELS[role] ?? 'Dashboard'}
        </p>
      </div>

      <nav className="flex-1 space-y-6" aria-label="Dashboard">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <NavLink
        to="/"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-fg"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to the site
      </NavLink>
    </div>
  );
}

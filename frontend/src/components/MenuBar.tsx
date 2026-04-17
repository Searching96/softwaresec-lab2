import type { MenuTab } from '../types/crypto';

type MenuBarProps = {
  tabs: Array<{ id: MenuTab; label: string }>;
  activeTab: MenuTab;
  onSelectTab: (tab: MenuTab) => void;
};

function MenuBar({ tabs, activeTab, onSelectTab }: MenuBarProps) {
  return (
    <nav className="menu-bar" aria-label="Feature menu">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'menu-item active' : 'menu-item'}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default MenuBar;

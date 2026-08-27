import { Search, Mic, Bell, Mail, Plus } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search" />
      </div>
      <button className="mic-btn" title="AI Assistant Voice Command">
        <Mic size={17} />
      </button>
      <div className="topbar-spacer" />
      <button className="btn-primary">
        <Plus size={15} /> New Order
      </button>
      <button className="icon-btn">
        <Bell size={16} />
        <span className="badge-dot">2</span>
      </button>
      <button className="icon-btn">
        <Mail size={16} />
      </button>
      <div className="user-chip">
        <div className="user-avatar">PU</div>
        <div>
          <div className="name">Professional Users</div>
          <div className="plan">Premium Active</div>
        </div>
      </div>
    </header>
  );
}

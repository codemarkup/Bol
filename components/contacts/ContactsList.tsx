import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

export function ContactsList({ activeId, onSelect, contacts = [], isLoaded = false, onlineUsers = new Set(), onOpenAddContact, onContactContextMenu }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Online' | 'Groups'>('All');

  const filteredContacts = contacts.filter((c: any) => {
    const isOnline = onlineUsers.has(c.id);
    if (filter === 'Online' && !isOnline) return false;
    if (filter === 'Groups') return false;

    if (search) {
      const q = search.toLowerCase();
      const fullName = (c.full_name || '').toLowerCase();
      const username = (c.username || '').toLowerCase();
      if (!fullName.includes(q) && !username.includes(q)) return false;
    }
    return true;
  });

  const grouped: Record<string, any[]> = {};
  filteredContacts.forEach((c: any) => {
    const letter = (c.full_name?.[0] || '#').toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  return (
    <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4 relative bg-white">
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>

      <div className="relative mb-4">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search contacts..."
          className="w-full bg-[#F6F8F7] border border-transparent focus:border-brand focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-6">
        {(['All', 'Online', 'Groups'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${filter === f ? 'bg-brand text-white' : 'bg-[#F6F8F7] text-[#6B7280] hover:text-[#0F0F14]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {/* Skeleton shimmer on first load */}
        {!isLoaded && contacts.length === 0 && (
          <div className="space-y-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#F0F0F0] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#F0F0F0] rounded-full animate-pulse" style={{ width: `${45 + (i * 11) % 35}%` }} />
                  <div className="h-3 bg-[#F0F0F0] rounded-full animate-pulse" style={{ width: `${30 + (i * 17) % 25}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {isLoaded && contacts.length > 0 && Object.keys(grouped).sort().map(letter => (
          <div key={letter} className="mb-6">
            <div className="mb-3 text-sm font-semibold text-[#6B7280] pl-2">{letter}</div>
            {grouped[letter].map((contact: any) => {
              const isOnline = onlineUsers.has(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact.id)}
                  onContextMenu={e => {
                    e.preventDefault();
                    onContactContextMenu?.(contact.id, e.clientX, e.clientY);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeId === contact.id ? 'bg-[#F6F8F7]' : 'hover:bg-[#F6F8F7]'}`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-brand/20 to-brand/40 text-brand rounded-full relative flex items-center justify-center font-bold text-lg shrink-0">
                    {contact.avatar_url ? (
                      <img src={contact.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      contact.full_name?.charAt(0).toUpperCase()
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00E5FF] rounded-full border-2 border-white shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-[#0F0F14] truncate">{contact.full_name}</div>
                    <div className="text-[13px] text-[#6B7280] truncate">@{contact.username || 'user'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        {isLoaded && contacts.length === 0 && (
          <div className="text-center text-[#9CA3AF] text-sm mt-10">No contacts yet. Add some!</div>
        )}
        {isLoaded && contacts.length > 0 && filteredContacts.length === 0 && (
          <div className="text-center text-[#9CA3AF] text-sm mt-10">No contacts found.</div>
        )}
      </div>

      <button
        onClick={onOpenAddContact}
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

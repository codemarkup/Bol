"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Search, Camera, Link2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials, getColor } from "@/lib/supabase/chat";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onStartChat }: NewChatModalProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"chat" | "group">("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [contacts, setContacts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('bol_last_user_id');
      if (uid) {
        const cached = localStorage.getItem(`bol_contacts_cache_${uid}`);
        if (cached) {
          try { return JSON.parse(cached); } catch(e) {}
        }
      }
    }
    return [];
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [membersError, setMembersError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    async function loadContacts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      localStorage.setItem('bol_last_user_id', user.id);

      // Load profile for system message
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setCurrentUserName(profile?.full_name || 'Someone');

      // Load from contacts table (real contacts only)
      const { data: contactRows } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('owner_id', user.id)
        .eq('status', 'accepted');

      if (contactRows && contactRows.length > 0) {
        const ids = contactRows.map((r: any) => r.contact_id);
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids)
          .order('full_name', { ascending: true });
        setContacts(data || []);
        localStorage.setItem(`bol_contacts_cache_${user.id}`, JSON.stringify(data || []));
      } else {
        // Fallback: show all other users if no contacts added yet
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .neq('id', user.id)
          .limit(30);
        setContacts(data || []);
        localStorage.setItem(`bol_contacts_cache_${user.id}`, JSON.stringify(data || []));
      }
    }
    loadContacts();
  }, [isOpen, supabase]);

  const filtered = contacts.filter(c =>
    !searchQuery || c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const selectedList = contacts.filter(c => selectedContacts.includes(c.id));

  const handleCreateGroup = async () => {
    let valid = true;
    setNameError('');
    setMembersError('');

    if (!groupName.trim()) { setNameError('Group name is required'); valid = false; }
    if (selectedContacts.length === 0) { setMembersError('Select at least 1 member'); valid = false; }
    if (!valid || !currentUserId || isCreating) return;

    setIsCreating(true);
    try {
      const { data: group } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          created_by: currentUserId,
          allow_anonymous_join: allowAnonymous,
          member_count: 0,
        })
        .select().single();

      if (!group) return;

      const members = [
        { conversation_id: group.id, user_id: currentUserId, role: 'admin' },
        ...selectedContacts.map(uid => ({ conversation_id: group.id, user_id: uid, role: 'member' })),
      ];
      await supabase.from('conversation_members').insert(members);

      // System message
      await supabase.from('messages').insert({
        conversation_id: group.id,
        sender_id: currentUserId,
        content: `${currentUserName} created the group`,
        type: 'text',
      });

      onClose();
      onStartChat(group.id);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header & Tabs */}
            <div className="px-6 pt-6 pb-4 border-b border-[#ECECEC] shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#0F0F14]">New Message</h2>
                <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-[#0F0F14] hover:bg-[#F6F8F7] rounded-full transition-colors -mr-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative flex bg-[#F6F8F7] p-1 rounded-xl">
                {["chat", "group"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`relative flex-1 py-2 text-sm font-semibold capitalize z-10 transition-colors ${activeTab === tab ? "text-[#0F0F14]" : "text-[#6B7280] hover:text-[#0F0F14]"}`}
                  >
                    {activeTab === tab && (
                      <motion.div layoutId="modal-tab" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    )}
                    New {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "chat" ? (
                  <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="p-6">
                    <div className="relative flex items-center w-full h-11 bg-[#F6F8F7] rounded-xl focus-within:ring-2 focus-within:ring-brand/20 transition-shadow mb-6">
                      <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF]" strokeWidth={2} />
                      <input type="text" autoFocus placeholder="Search contacts..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full bg-transparent pl-10 pr-4 text-[15px] text-[#0F0F14] placeholder:text-[#9CA3AF] outline-none" />
                    </div>

                    <div className="space-y-1 mb-6">
                      <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3 px-2">Contacts on Bol</h3>
                      {filtered.length === 0 && (
                        <p className="text-sm text-[#9CA3AF] text-center py-4">No users found</p>
                      )}
                      {filtered.map((contact) => (
                        <div key={contact.id}
                          onClick={() => onStartChat(contact.id)}
                          className="flex items-center gap-3 p-2 hover:bg-[#F6F8F7] rounded-xl cursor-pointer transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getColor(contact.full_name || '')}`}>
                            {getInitials(contact.full_name || '?')}
                          </div>
                          <span className="font-semibold text-[#0F0F14]">{contact.full_name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[#ECECEC]">
                      <button className="w-full flex items-center justify-between p-4 bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                            <Link2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-brand">Invite Friends</div>
                            <div className="text-xs text-[#6B7280]">Share your Bol link</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="group" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="p-6 flex flex-col h-full">
                    {/* Group Details */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative group cursor-pointer shrink-0">
                        <div className="w-14 h-14 bg-[#F6F8F7] border border-[#ECECEC] rounded-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-[#9CA3AF]" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <input type="text" placeholder="Group Name" value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="flex-1 bg-transparent border-b border-[#ECECEC] focus:border-brand px-1 py-2 text-[15px] font-semibold text-[#0F0F14] placeholder:font-normal placeholder:text-[#9CA3AF] outline-none transition-colors" />
                    </div>

                    {/* Selected Chips */}
                    {selectedList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <AnimatePresence>
                          {selectedList.map(c => (
                            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-1.5 bg-[#F6F8F7] border border-[#ECECEC] pl-1.5 pr-2.5 py-1 rounded-full">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getColor(c.full_name || '')}`}>
                                {getInitials(c.full_name || '?')}
                              </div>
                              <span className="text-xs font-semibold text-[#0F0F14]">{c.full_name?.split(' ')[0]}</span>
                              <X className="w-3 h-3 text-[#9CA3AF] hover:text-red-500 cursor-pointer ml-0.5" onClick={() => toggleContact(c.id)} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Search & List */}
                    <div className="relative flex items-center w-full h-11 bg-[#F6F8F7] rounded-xl mb-4 shrink-0 focus-within:ring-2 focus-within:ring-brand/20">
                      <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF]" />
                      <input type="text" placeholder="Search to add members..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full bg-transparent pl-10 pr-4 text-[14px] outline-none" />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[160px] space-y-1 mb-6">
                      {filtered.map((contact) => {
                        const isSelected = selectedContacts.includes(contact.id);
                        return (
                          <div key={contact.id} onClick={() => toggleContact(contact.id)}
                            className="flex items-center justify-between p-2 hover:bg-[#F6F8F7] rounded-xl cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getColor(contact.full_name || '')}`}>
                                {getInitials(contact.full_name || '?')}
                              </div>
                              <span className="font-semibold text-[#0F0F14]">{contact.full_name}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand border-brand' : 'border-[#D1D5DB] group-hover:border-[#9CA3AF]'}`}>
                              {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Settings Toggles */}
                    <div className="space-y-4 mb-6 pt-4 border-t border-[#ECECEC] shrink-0">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setAllowAnonymous(!allowAnonymous)}>
                        <div>
                          <div className="font-semibold text-[13px] text-[#0F0F14]">Allow anonymous joining</div>
                          <div className="text-[11px] text-[#6B7280]">Users can join without showing phone numbers</div>
                        </div>
                        <Toggle active={allowAnonymous} />
                      </div>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsEncrypted(!isEncrypted)}>
                        <div>
                          <div className="font-semibold text-[13px] text-[#0F0F14]">Encrypted group</div>
                          <div className="text-[11px] text-[#6B7280]">End-to-end encryption for all members</div>
                        </div>
                        <Toggle active={isEncrypted} />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="shrink-0">
                      <button onClick={handleCreateGroup}
                        disabled={isCreating}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-brand hover:bg-brand/90 transition-colors disabled:opacity-70 disabled:hover:bg-brand flex items-center justify-center gap-2">
                        {isCreating ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                        ) : 'Create Group'}
                      </button>
                      {nameError && <p className="text-xs text-red-500 text-center mt-2">{nameError}</p>}
                      {membersError && <p className="text-xs text-red-500 text-center mt-1">{membersError}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Toggle({ active }: { active: boolean }) {
  return (
    <div className={`w-10 h-5.5 rounded-full flex items-center px-0.5 transition-colors ${active ? 'bg-brand' : 'bg-gray-300'}`}>
      <motion.div initial={false} animate={{ x: active ? 18 : 0 }} className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
        style={{ width: '18px', height: '18px' }} />
    </div>
  );
}

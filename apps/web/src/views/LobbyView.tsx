import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/session';
import { api } from '../utils/api';

const SETTING_ICONS: Record<string, string> = {
  fantasy: '🗡️', xianxia: '☯️', romance: '💕', mystery: '🔍', custom: '✨',
};

interface Props {
  onEnterGame: (sessionId: string) => void;
  onLogout: () => void;
}

function SkeletonCard() {
  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
      <div className="h-5 bg-gray-800 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-800 rounded w-full mb-2" />
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  );
}

const SETTING_DESC: Record<string, string> = {
  xianxia: '魂穿异世，以武为尊，踏上修仙之路',
  fantasy: '剑与魔法的世界，古老的预言等待实现',
  romance: '温馨治愈的都市恋爱故事，心动就在转角',
  mystery: '浓雾笼罩的小镇，隐藏着不可告人的秘密',
  custom: '一个全新的世界，等待你来定义',
};

interface NpcSetup {
  name: string;
  personality: string;
}

function CreateWorldModal({ onClose, onCreated }: { onClose: () => void; onCreated: (worldId: string, charName?: string, charDesc?: string, npcs?: NpcSetup[]) => void }) {
  const [name, setName] = useState('');
  const [setting, setSetting] = useState('xianxia');
  const [description, setDescription] = useState('');
  const [storyGoal, setStoryGoal] = useState('');
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [npcs, setNpcs] = useState<NpcSetup[]>([]);
  const [creating, setCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const world = await api.createWorld({
        name,
        description: description || (SETTING_DESC[setting] ?? ''),
        setting,
        storyGoal: storyGoal || undefined,
      });
      onCreated(world.id, charName || undefined, charDesc || undefined, npcs.filter(n => n.name.trim()));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  function addNpc() { setNpcs([...npcs, { name: '', personality: '' }]); }
  function updateNpc(i: number, field: keyof NpcSetup, value: string) {
    const copy = [...npcs]; copy[i] = { ...copy[i], [field]: value }; setNpcs(copy);
  }
  function removeNpc(i: number) { setNpcs(npcs.filter((_, idx) => idx !== i)); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">✨ 创造新世界</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 世界名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">世界名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="给你的世界取个名字" required maxLength={64} />
          </div>

          {/* 世界观 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">世界观</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SETTING_ICONS).map(([key, icon]) => (
                <button key={key} type="button" onClick={() => setSetting(key)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    setting === key
                      ? 'bg-purple-900/30 border-purple-700 text-purple-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                  <span className="mr-1.5">{icon}</span>
                  { { xianxia: '玄幻', fantasy: '奇幻', romance: '恋爱', mystery: '悬疑', custom: '自定义' }[key] }
                </button>
              ))}
            </div>
          </div>

          {/* 你的角色 */}
          <div className="border-t border-gray-800 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">🧙 你的角色</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">角色名</label>
                <input type="text" value={charName} onChange={e => setCharName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 placeholder-gray-500 text-sm"
                  placeholder="你的名字" maxLength={32} />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">角色设定 <span className="text-gray-600">(可选)</span></label>
              <textarea value={charDesc} onChange={e => setCharDesc(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 placeholder-gray-500 resize-none text-sm"
                rows={2} placeholder="性格冷静的前世天才，沉默寡言但观察力敏锐" maxLength={500} />
            </div>
          </div>

          {/* 主要角色 */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-400">👥 主要角色 <span className="text-gray-600">(可选)</span></h4>
              <button type="button" onClick={addNpc}
                className="text-xs px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-700/50 rounded-lg text-purple-300 transition-all">
                + 添加
              </button>
            </div>
            {npcs.length === 0 ? (
              <p className="text-gray-600 text-xs">定义这个世界的主要 NPC，AI 会为你生成更多角色</p>
            ) : (
              <div className="space-y-2">
                {npcs.map((npc, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-800/50 rounded-lg p-3">
                    <div className="flex-1 space-y-1.5">
                      <input type="text" value={npc.name} onChange={e => updateNpc(i, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500 text-sm"
                        placeholder="角色名" />
                      <textarea value={npc.personality} onChange={e => updateNpc(i, 'personality', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500 resize-none text-xs"
                        rows={1} placeholder="性格、外貌、背景简介" />
                    </div>
                    <button type="button" onClick={() => removeNpc(i)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 世界设定 */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-400">📖 世界设定 <span className="text-gray-600">(可选)</span></h4>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-purple-400 hover:text-purple-300">
                {showAdvanced ? '收起' : '更多'}
              </button>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 placeholder-gray-500 resize-none mt-2"
              rows={2} placeholder={SETTING_DESC[setting]} maxLength={2000} />
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">主线目标 <span className="text-gray-600">(可选)</span></label>
                <textarea value={storyGoal} onChange={e => setStoryGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 placeholder-gray-500 resize-none text-sm"
                  rows={2} placeholder="找到传说中的神器，拯救被诅咒的王国" maxLength={500} />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors">取消</button>
            <button type="submit" disabled={creating || !name}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-medium transition-colors">
              {creating ? '创造中...' : '开始冒险'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditWorldModal({ world, onClose }: { world: any; onClose: () => void }) {
  const [name, setName] = useState(world.name || '');
  const [description, setDescription] = useState(world.description || '');
  const [storyGoal, setStoryGoal] = useState((world.rules?.storyGoal as string) || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateWorld(world.id, { name, description, storyGoal: storyGoal || undefined });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">✏️ 编辑世界</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">世界名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100" required maxLength={64} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">世界描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 resize-none"
              rows={3} maxLength={2000} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">主线目标</label>
            <textarea value={storyGoal} onChange={e => setStoryGoal(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-100 resize-none"
              rows={2} placeholder="可选" maxLength={500} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-gray-300">取消</button>
            <button type="submit" disabled={saving || !name}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-medium transition-colors">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LobbyView({ onEnterGame, onLogout }: Props) {
  const { sessions, worlds, worldsLoaded, sessionsLoaded, setSessions, setWorlds, user } = useSessionStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editWorld, setEditWorld] = useState<any>(null);

  useEffect(() => {
    api.listWorlds().then(setWorlds).catch(() => {});
    api.listSessions().then(setSessions).catch(() => {});
  }, []);

  async function createGame(worldId: string, charName?: string, charDesc?: string) {
    const existing = sessions.find(s => s.worldId === worldId && s.status === 'ACTIVE');
    if (existing) { onEnterGame(existing.id); return; }
    try {
      const session = await api.createSession(worldId, charName, charDesc);
      api.listSessions().then(setSessions).catch(() => {});
      onEnterGame(session.id);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleWorldCreated(worldId: string, charName?: string, charDesc?: string, npcs?: NpcSetup[]) {
    setShowCreate(false);
    api.listWorlds().then(setWorlds).catch(() => {});
    // 创建 NPC 实体
    if (npcs && npcs.length > 0) {
      await api.createWorldNpcs(worldId, npcs).catch(() => {});
    }
    await createGame(worldId, charName, charDesc);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent">
            AI Dungeon Master
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.username}</span>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">退出</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 overflow-y-auto">
        {/* Worlds */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-300">🌍 世界</h2>
            <button onClick={() => setShowCreate(true)}
              className="text-sm px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-700/50 rounded-lg text-purple-300 transition-all">
              + 创造世界
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!worldsLoaded
              ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
              : worlds.map((world) => (
                  <div key={world.id} className="group relative">
                    <button onClick={() => createGame(world.id)}
                      className="w-full text-left p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-700 transition-all group">
                      <h3 className="text-lg font-medium text-gray-200 group-hover:text-purple-300">{world.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{world.description}</p>
                      <span className="inline-block mt-3 text-xs px-2.5 py-1 bg-gray-800 rounded-full text-gray-400">
                        {SETTING_ICONS[world.setting] ?? '✨'} {world.setting}
                      </span>
                    </button>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); setEditWorld(world); }}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200 text-xs transition-all"
                        title="编辑世界">✏️</button>
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`删除世界「${world.name}」？所有相关存档和数据都会被删除。`)) {
                          await api.deleteWorld(world.id);
                          useSessionStore.getState().setWorlds(worlds.filter(w => w.id !== world.id));
                        }
                      }}
                        className="p-1.5 bg-red-900/50 hover:bg-red-800 rounded-lg text-red-300 text-xs transition-all"
                        title="删除世界">✕</button>
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* Active Sessions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">📜 继续冒险</h2>
          {!sessionsLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/3" />
              </div>)}
            </div>
          ) : sessions.filter(s => s.status === 'ACTIVE').length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🏰</p>
              <p>还没有进行中的冒险，选择一个世界开始吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.filter(s => s.status === 'ACTIVE').map((session) => (
                <div key={session.id} className="group relative">
                  <button onClick={() => onEnterGame(session.id)}
                    className="w-full text-left p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                    <h3 className="font-medium text-gray-200">{session.world?.name ?? '未知世界'}</h3>
                    <p className="text-gray-500 text-sm mt-1">回合 {session.turnNumber} · {session.world?.setting}</p>
                  </button>
                  <button onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('删除这个存档？')) {
                      await api.deleteSession(session.id);
                      useSessionStore.getState().setSessions(sessions.filter(s => s.id !== session.id));
                    }
                  }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-900/50 hover:bg-red-800 rounded-lg text-red-300 text-xs transition-all"
                    title="删除存档">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <CreateWorldModal onClose={() => setShowCreate(false)} onCreated={handleWorldCreated} />
      )}
      {editWorld && (
        <EditWorldModal world={editWorld} onClose={() => { setEditWorld(null); api.listWorlds().then(setWorlds).catch(() => {}); }} />
      )}
    </div>
  );
}

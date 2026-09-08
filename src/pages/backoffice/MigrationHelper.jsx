import { useEffect, useState } from 'react';
import api from '../../api/pos.js';

export default function MigrationHelper(){
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [families, setFamilies] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [renameBuffer, setRenameBuffer] = useState({});

  const load = async () => {
    setLoading(true);
    try{
      const [{ data: statusData }, { data: familiesData }] = await Promise.all([
        api.get('/pos/backoffice/migration/status'),
        api.get('/pos/menu/categories'),
      ]);
      setStatus(statusData);
      // families are categories with level === 3
      setFamilies(familiesData.filter(c => c.level === 3));
    }catch(e){
      alert(e.response?.data?.error || 'Failed to load migration status');
    }finally{ setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleSelectItem = (id) => {
    setSelectedItems(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const doBatchReassign = async () => {
    if (selectedItems.size === 0) return alert('Select items to reassign');
    const familyId = window.prompt('Enter destination family id (level 3)');
    if (!familyId) return;
    if (!window.confirm(`Reassign ${selectedItems.size} items to family ${familyId}?`)) return;
    setRunning(true);
    try{
      const promises = Array.from(selectedItems).map(id => api.post('/pos/backoffice/migration/reassign', { itemId: id, familyId }));
      await Promise.all(promises);
      alert('Reassigned items');
      setSelectedItems(new Set());
      load();
    }catch(e){ alert(e.response?.data?.error || 'Reassign failed'); }
    finally{ setRunning(false); }
  };

  const handleRenameChange = (id, newName) => {
    setRenameBuffer(b => ({ ...b, [id]: newName }));
  };

  const doBulkRename = async () => {
    const renames = Object.entries(renameBuffer).map(([id, newName]) => ({ id: Number(id), newName }));
    if (renames.length === 0) return alert('No renames queued');
    if (!window.confirm(`Apply ${renames.length} renames?`)) return;
    setRunning(true);
    try{
      const { data } = await api.post('/pos/backoffice/migration/bulk-rename', { renames });
      alert('Renamed: ' + (data.renamed?.length || 0));
      setRenameBuffer({});
      load();
    }catch(e){ alert(e.response?.data?.error || 'Bulk rename failed'); }
    finally{ setRunning(false); }
  };

  const doGenerateMapping = async () => {
    if (!window.confirm('Generate migration mapping from existing backup?')) return;
    setRunning(true);
    try{
      const { data } = await api.post('/pos/backoffice/migration/generate-mapping');
      alert('Mapping generation triggered');
      load();
    }catch(e){ alert(e.response?.data?.error || 'Mapping generation failed'); }
    finally{ setRunning(false); }
  };

  const doDownloadMapping = async () => {
    try{
      const { data } = await api.get('/pos/backoffice/migration/mapping');
      const payload = JSON.stringify(data, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = data.mappingFile; a.click(); URL.revokeObjectURL(url);
    }catch(e){ alert(e.response?.data?.error || 'Download mapping failed'); }
  };

  if (loading) return <div className="p-4">Loading migration status…</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Migration helper</h2>

      <div>
        <h3 className="font-semibold">Migrated categories</h3>
        {status?.migratedCats?.length === 0 && <div className="text-sm text-slate-500">No migrated categories found</div>}
        <ul className="list-disc pl-6">
          {status?.migratedCats?.map(c => (
            <li key={c.id}>
              <input type="text" defaultValue={c.name} onChange={(e) => handleRenameChange(c.id, e.target.value)} className="w-full bg-slate-800 text-sm p-1 rounded" />
              <div className="text-xs text-slate-500">level {c.level} · id {c.id}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Items</h3>
        <div className="text-sm text-slate-500">Total items: {status?.items?.length || 0}</div>
        <div style={{maxHeight:300, overflow:'auto'}}>
          <table className="w-full text-sm">
            <thead><tr><th></th><th>Name</th><th>Category</th></tr></thead>
            <tbody>
              {status?.items?.map(it => (
                <tr key={it.id} className="border-t border-slate-700">
                  <td className="px-2"><input type="checkbox" checked={selectedItems.has(it.id)} onChange={() => toggleSelectItem(it.id)} /></td>
                  <td className="px-2">{it.name}</td>
                  <td className="px-2">{it.categoryId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={doBatchReassign} disabled={running} className="bg-amber-500 px-3 py-2 rounded">Reassign selected items</button>
        <button onClick={doBulkRename} disabled={running} className="bg-blue-500 px-3 py-2 rounded">Apply bulk rename</button>
        <button onClick={doGenerateMapping} disabled={running} className="bg-indigo-500 px-3 py-2 rounded">Generate mapping</button>
        <button onClick={doDownloadMapping} disabled={running} className="border px-3 py-2 rounded">Download mapping</button>
        <button onClick={() => { if (!window.confirm('Revert using mapping?')) return; setRunning(true); api.post('/pos/backoffice/migration/revert', { dry: false }).then(r => { alert('Reverted'); load(); }).catch(e => alert(e.response?.data?.error || 'Revert failed')).finally(() => setRunning(false)); }} disabled={running} className="bg-rose-500 px-3 py-2 rounded">Revert using mapping</button>
        <button onClick={load} disabled={running} className="border px-3 py-2 rounded">Reload</button>
      </div>
    </div>
  );
}

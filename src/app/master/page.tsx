"use client";

import { useState, useEffect } from "react";
import {
  getDivisions,
  getSchemes,
  getPumpHouses,
  getPhoneMappings,
  saveDivision,
  saveScheme,
  savePumpHouse,
  savePhoneMapping,
  deleteDivision,
  deleteScheme,
  deletePumpHouse,
  deletePhoneMapping,
  updateDivision,
  updateScheme,
  updatePumpHouse,
  updatePhoneMapping,
  initializeSampleData,
} from "@/lib/storage";
import { Division, Scheme, PumpHouse, PhoneMapping } from "@/types";

type Tab = "divisions" | "schemes" | "pumphouses" | "phones";

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("divisions");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [pumpHouses, setPumpHouses] = useState<PumpHouse[]>([]);
  const [phoneMappings, setPhoneMappings] = useState<PhoneMapping[]>([]);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const refreshData = () => {
    setDivisions(getDivisions());
    setSchemes(getSchemes());
    setPumpHouses(getPumpHouses());
    setPhoneMappings(getPhoneMappings());
  };

  useEffect(() => {
    initializeSampleData();
    refreshData();
  }, []);

  const getSchemeName = (schemeId: string) => {
    return schemes.find(s => s.id === schemeId)?.name || "Unknown";
  };

  const getPumpHouseName = (pumpHouseId: string) => {
    return pumpHouses.find(p => p.id === pumpHouseId)?.name || "Unknown";
  };

  const getDivisionName = (divisionId: string) => {
    return divisions.find(d => d.id === divisionId)?.name || "Unknown";
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "divisions", label: "Divisions" },
    { key: "schemes", label: "Schemes" },
    { key: "pumphouses", label: "Pump Houses" },
    { key: "phones", label: "Phone Mappings" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Master Data Management</h1>
        <p className="page-subtitle">Manage divisions, schemes, pump houses, and phone number mappings</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setIsAdding(false); setEditingItem(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-cyan-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "divisions" && (
        <DivisionTab
          divisions={divisions}
          onSave={(d: Omit<Division, "id">) => { saveDivision(d); refreshData(); setIsAdding(false); }}
          onUpdate={(d: Division) => { updateDivision(d); refreshData(); setEditingItem(null); }}
          onDelete={(id: string) => { deleteDivision(id); refreshData(); }}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
        />
      )}

      {activeTab === "schemes" && (
        <SchemeTab
          schemes={schemes}
          divisions={divisions}
          onSave={(s: Omit<Scheme, "id">) => { saveScheme(s); refreshData(); setIsAdding(false); }}
          onUpdate={(s: Scheme) => { updateScheme(s); refreshData(); setEditingItem(null); }}
          onDelete={(id: string) => { deleteScheme(id); refreshData(); }}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
        />
      )}

      {activeTab === "pumphouses" && (
        <PumpHouseTab
          pumpHouses={pumpHouses}
          schemes={schemes}
          onSave={(p: Omit<PumpHouse, "id">) => { savePumpHouse(p); refreshData(); setIsAdding(false); }}
          onUpdate={(p: PumpHouse) => { updatePumpHouse(p); refreshData(); setEditingItem(null); }}
          onDelete={(id: string) => { deletePumpHouse(id); refreshData(); }}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
          getSchemeName={getSchemeName}
        />
      )}

      {activeTab === "phones" && (
        <PhoneMappingTab
          phoneMappings={phoneMappings}
          pumpHouses={pumpHouses}
          schemes={schemes}
          divisions={divisions}
          onSave={(p: Omit<PhoneMapping, "id">) => { savePhoneMapping(p); refreshData(); setIsAdding(false); }}
          onUpdate={(p: PhoneMapping) => { updatePhoneMapping(p); refreshData(); setEditingItem(null); }}
          onDelete={(id: string) => { deletePhoneMapping(id); refreshData(); }}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
          getPumpHouseName={getPumpHouseName}
          getSchemeName={getSchemeName}
          getDivisionName={getDivisionName}
        />
      )}
    </div>
  );
}

function DivisionTab({ divisions, onSave, onUpdate, onDelete, editingItem, setEditingItem, isAdding, setIsAdding }: any) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingItem) setName(editingItem.name);
    else if (isAdding) setName("");
  }, [editingItem, isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate({ ...editingItem, name });
    } else {
      onSave({ name });
    }
    setName("");
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Divisions</h2>
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">+ Add Division</button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              className="input"
              placeholder="Division Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {divisions.map((d: Division) => (
            <tr key={d.id}>
              <td>{editingItem?.id === d.id ? (
                <input
                  type="text"
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : d.name}</td>
              <td>
                {editingItem?.id === d.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => onUpdate({ ...editingItem, name })} className="text-green-600 text-sm">Save</button>
                    <button onClick={() => setEditingItem(null)} className="text-slate-600 text-sm">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem(d)} className="text-cyan-600 text-sm">Edit</button>
                    <button onClick={() => onDelete(d.id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchemeTab({ schemes, divisions, onSave, onUpdate, onDelete, editingItem, setEditingItem, isAdding, setIsAdding }: any) {
  const [name, setName] = useState("");
  const [divisionId, setDivisionId] = useState("");

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDivisionId(editingItem.divisionId);
    } else if (isAdding) {
      setName("");
      setDivisionId(divisions[0]?.id || "");
    }
  }, [editingItem, isAdding, divisions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate({ ...editingItem, name, divisionId });
    } else {
      onSave({ name, divisionId });
    }
    setName("");
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Water Supply Schemes</h2>
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">+ Add Scheme</button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Scheme Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="select w-48"
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
            >
              {divisions.map((d: Division) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Division</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schemes.map((s: Scheme) => {
            const division = divisions.find((d: Division) => d.id === s.divisionId);
            return (
              <tr key={s.id}>
                <td>{editingItem?.id === s.id ? (
                  <input
                    type="text"
                    className="input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : s.name}</td>
                <td>{division?.name || "Unknown"}</td>
                <td>
                  {editingItem?.id === s.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => onUpdate({ ...editingItem, name, divisionId })} className="text-green-600 text-sm">Save</button>
                      <button onClick={() => setEditingItem(null)} className="text-slate-600 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(s)} className="text-cyan-600 text-sm">Edit</button>
                      <button onClick={() => onDelete(s.id)} className="text-red-600 text-sm">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PumpHouseTab({ pumpHouses, schemes, onSave, onUpdate, onDelete, editingItem, setEditingItem, isAdding, setIsAdding, getSchemeName }: any) {
  const [name, setName] = useState("");
  const [schemeId, setSchemeId] = useState("");

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSchemeId(editingItem.schemeId);
    } else if (isAdding) {
      setName("");
      setSchemeId(schemes[0]?.id || "");
    }
  }, [editingItem, isAdding, schemes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate({ ...editingItem, name, schemeId });
    } else {
      onSave({ name, schemeId });
    }
    setName("");
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Pump Houses</h2>
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">+ Add Pump House</button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Pump House Name (e.g., PH-1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="select w-64"
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
            >
              {schemes.map((s: Scheme) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Scheme</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pumpHouses.map((p: PumpHouse) => (
            <tr key={p.id}>
              <td>{editingItem?.id === p.id ? (
                <input
                  type="text"
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : p.name}</td>
              <td>{getSchemeName(p.schemeId)}</td>
              <td>
                {editingItem?.id === p.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => onUpdate({ ...editingItem, name, schemeId })} className="text-green-600 text-sm">Save</button>
                    <button onClick={() => setEditingItem(null)} className="text-slate-600 text-sm">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem(p)} className="text-cyan-600 text-sm">Edit</button>
                    <button onClick={() => onDelete(p.id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MAX_PHONE_NUMBERS = 4;

function PhoneMappingTab({ phoneMappings, pumpHouses, schemes, divisions, onSave, onUpdate, onDelete, editingItem, setEditingItem, isAdding, setIsAdding, getPumpHouseName, getSchemeName, getDivisionName }: any) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pumpHouseId, setPumpHouseId] = useState("");
  const [operatorName, setOperatorName] = useState("");

  useEffect(() => {
    if (editingItem) {
      setPhoneNumber("");
      setPumpHouseId(editingItem.id || "");
      setOperatorName("");
    } else if (isAdding) {
      setPhoneNumber("");
      setPumpHouseId("");
      setOperatorName("");
    }
  }, [editingItem, isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !pumpHouseId) return;
    
    const existingCount = phoneMappings.filter((pm: PhoneMapping) => pm.pumpHouseId === pumpHouseId).length;
    if (existingCount >= MAX_PHONE_NUMBERS) {
      alert(`Maximum ${MAX_PHONE_NUMBERS} phone numbers allowed per pump house`);
      return;
    }
    
    if (editingItem) {
      onUpdate({ ...editingItem, phoneNumber, pumpHouseId, operatorName: operatorName || undefined });
    } else {
      onSave({ phoneNumber, pumpHouseId, operatorName: operatorName || undefined });
    }
    setPhoneNumber("");
    setOperatorName("");
    setIsAdding(false);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Phone Number Mappings</h2>
        <button onClick={() => setIsAdding(true)} className="btn btn-primary">+ Add Phone Number</button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 <strong>Important:</strong> Map operator phone numbers to pump houses. Maximum {MAX_PHONE_NUMBERS} phone numbers allowed per pump house.
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 <strong>Important:</strong> Map operator phone numbers to pump houses. When messages are imported, the system will automatically identify which pump house the message is from based on the phone number. Multiple phone numbers can be added for each pump house.
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              className="input"
              placeholder="Enter phone number (e.g., +91 90000 11111)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pump House (Scheme - Division)</label>
            <select
              className="select"
              value={pumpHouseId}
              onChange={(e) => setPumpHouseId(e.target.value)}
            >
              <option value="">Select Pump House</option>
              {pumpHouses.map((p: PumpHouse) => {
                const scheme = schemes.find((s: Scheme) => s.id === p.schemeId);
                const division = scheme ? divisions.find((d: Division) => d.id === scheme.divisionId) : null;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} - {scheme?.name || "Unknown"} ({division?.name || "Unknown"})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="label">Operator Name (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Enter operator name"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Scheme - Pump House</th>
            <th>Division</th>
            <th>Phone Numbers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pumpHouses.map((p: PumpHouse) => {
            const scheme = schemes.find((s: Scheme) => s.id === p.schemeId);
            const division = scheme ? divisions.find((d: Division) => d.id === scheme.divisionId) : null;
            const mappings = phoneMappings.filter((pm: PhoneMapping) => pm.pumpHouseId === p.id);
            
            return (
              <tr key={p.id}>
                <td>
                  <div className="font-medium">{scheme?.name || "Unknown"} - {p.name}</div>
                </td>
                <td>{division?.name || "Unknown"}</td>
                <td>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-slate-400 mr-1">{mappings.length}/{MAX_PHONE_NUMBERS}</span>
                    {mappings.length === 0 ? (
                      <span className="text-slate-400 text-sm italic">No phone numbers</span>
                    ) : (
                      mappings.map((pm: PhoneMapping) => (
                        <span key={pm.id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm">
                          <span className="font-mono">{pm.phoneNumber}</span>
                          {pm.operatorName && <span className="text-slate-500">({pm.operatorName})</span>}
                          <button 
                            onClick={() => onDelete(pm.id)} 
                            className="text-red-500 hover:text-red-700 ml-1"
                            title="Delete"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td>
                  {mappings.length >= MAX_PHONE_NUMBERS ? (
                    <span className="text-xs text-slate-400 italic">Limit reached</span>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingItem(p);
                        setIsAdding(true);
                      }} 
                      className="btn btn-secondary text-sm"
                    >
                      + Add Number
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
